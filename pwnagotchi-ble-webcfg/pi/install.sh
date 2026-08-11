#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Run with sudo: sudo bash install.sh" >&2
  exit 1
fi

SRC_DIR="$(cd "$(dirname "$0")" && pwd)"
DST="/usr/local/lib/pwnagotchi-ble"

echo "[1/6] Checking Pwnagotchi..."
if ! command -v pwnagotchi >/dev/null 2>&1; then
  echo "pwnagotchi command not found." >&2
  exit 1
fi
pwnagotchi --version || true

echo "[2/6] Checking BlueZ / Python D-Bus dependencies..."
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

echo "[3/6] Installing BLE daemon..."
install -d -m 0755 "$DST"
install -m 0755 "$SRC_DIR/pwnagotchi_ble.py" "$DST/pwnagotchi_ble.py"
install -m 0644 "$SRC_DIR/pwnagotchi-ble.service" /etc/systemd/system/pwnagotchi-ble.service

echo "[4/6] Checking Pwnagotchi PAN tether plugin..."
if grep -A8 -E '^\[main\.plugins\.bt-tether\]' /etc/pwnagotchi/config.toml 2>/dev/null | grep -qE '^enabled\s*=\s*true'; then
  echo "NOTE: main.plugins.bt-tether.enabled is true in config.toml."
  echo "BLE will still work, but disable bt-tether in WebCFG for BLE-only operation."
else
  echo "bt-tether is not explicitly enabled in config.toml."
fi

echo "[5/6] Enabling service..."
systemctl daemon-reload
systemctl enable --now bluetooth
systemctl enable --now pwnagotchi-ble
sleep 1

echo "[6/6] Result"
systemctl --no-pager --full status pwnagotchi-ble || true
TOKEN="$($DST/pwnagotchi_ble.py --show-token)"
echo
echo "============================================================"
echo "BLE name : Pwnagotchi BLE"
echo "BLE token: $TOKEN"
echo "============================================================"
echo "Save that token. Enter it in the Bluefy web app on first use."
echo "Web app: https://adondada.com/pwnagotchi-ble-webcfg/"
echo "To show it later: sudo $DST/pwnagotchi_ble.py --show-token"
echo "Logs: sudo journalctl -u pwnagotchi-ble -f"
