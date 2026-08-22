#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Run with sudo: sudo bash install.sh" >&2
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DST="/usr/local/lib/pwnagotchi-ble"

echo "[1/7] Checking Pwnagotchi..."
if ! command -v pwnagotchi >/dev/null 2>&1; then
  echo "pwnagotchi command not found." >&2
  exit 1
fi
pwnagotchi --version || true

echo "[2/7] Checking BlueZ / Python D-Bus dependencies..."
missing=()
command -v bluetoothctl >/dev/null 2>&1 || missing+=(bluez)
/usr/bin/python3 - <<'PY' >/dev/null 2>&1 || missing+=(python3-dbus python3-gi)
import dbus
from gi.repository import GLib
PY
if ((${#missing[@]})); then
  echo "Missing packages: ${missing[*]}"
  echo "Installing with apt..."
  apt-get update
  apt-get install -y "${missing[@]}"
fi

echo "[3/7] Installing BLE daemon..."
install -d -m 0755 "$DST"
install -m 0755 "$SRC_DIR/pwnagotchi_ble.py" "$DST/pwnagotchi_ble.py"
install -m 0644 "$SRC_DIR/pwnagotchi-ble.service" /etc/systemd/system/pwnagotchi-ble.service

echo "[4/7] Enabling authenticated full command shell..."
/usr/bin/python3 - "$DST/pwnagotchi_ble.py" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
src = p.read_text()
old = '''        if action == "command":
            command = str(data.get("command", ""))
            argv = allowed_command(command)
            if argv is None:
                raise PermissionError("command is not in the BLE allowlist")
            return run(argv, timeout=25)
'''
new = '''        if action == "command":
            command = str(data.get("command", "")).strip()
            if not command:
                raise ValueError("empty command")
            try:
                p = subprocess.run(
                    ["/bin/bash", "-lc", command],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    timeout=60,
                    env={
                        **os.environ,
                        "SYSTEMD_PAGER": "cat",
                        "PAGER": "cat",
                        "TERM": "dumb",
                    },
                )
                return {
                    "rc": p.returncode,
                    "output": tail_text(p.stdout or "", MAX_OUTPUT),
                }
            except subprocess.TimeoutExpired as e:
                output = e.stdout if isinstance(e.stdout, str) else ""
                return {
                    "rc": 124,
                    "output": tail_text(output + "\\nCommand timed out.", MAX_OUTPUT),
                }
'''

if old in src:
    p.write_text(src.replace(old, new, 1))
elif '["/bin/bash", "-lc", command]' not in src:
    raise SystemExit("Could not find expected command-dispatch block in BLE daemon")
PY
/usr/bin/python3 -m py_compile "$DST/pwnagotchi_ble.py"

echo "[5/7] Checking Pwnagotchi PAN tether plugin..."
if grep -A8 -E '^\[main\.plugins\.bt-tether\]' /etc/pwnagotchi/config.toml 2>/dev/null | grep -qE '^enabled\s*=\s*true'; then
  echo "NOTE: main.plugins.bt-tether.enabled is true in config.toml."
  echo "BLE will still work when the adapter is available, but iPhone PAN may take over the Bluetooth link."
else
  echo "bt-tether is not explicitly enabled in config.toml."
fi

echo "[6/7] Enabling service..."
systemctl daemon-reload
systemctl enable --now bluetooth
systemctl enable --now pwnagotchi-ble
sleep 1

echo "[7/7] Result"
systemctl --no-pager --full status pwnagotchi-ble || true
TOKEN="$($DST/pwnagotchi_ble.py --show-token)"
echo
echo "============================================================"
echo "BLE name : Pwnagotchi BLE"
echo "BLE token: $TOKEN"
echo "============================================================"
echo "Save that token. Enter it in the Bluefy web app on first use."
echo "Commands in the web app run as root after token authentication."
echo "Web app: https://adondada.com/pwnagotchi-ble-webcfg/"
echo "To show the token later: sudo $DST/pwnagotchi_ble.py --show-token"
echo "Logs: sudo journalctl -u pwnagotchi-ble -f"
