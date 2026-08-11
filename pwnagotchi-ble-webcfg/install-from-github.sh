#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID:-$(id -u)} -ne 0 ]]; then
  echo "Run as root, for example:" >&2
  echo "curl -fsSL https://raw.githubusercontent.com/adondada/adondada.github.io/main/pwnagotchi-ble-webcfg/install-from-github.sh | sudo bash" >&2
  exit 1
fi

BASE="https://raw.githubusercontent.com/adondada/adondada.github.io/main/pwnagotchi-ble-webcfg/pi"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

for file in install.sh pwnagotchi_ble.py pwnagotchi-ble.service; do
  echo "Downloading $file..."
  curl -fsSL "$BASE/$file" -o "$TMP/$file"
done

chmod +x "$TMP/install.sh" "$TMP/pwnagotchi_ble.py"
cd "$TMP"
bash ./install.sh
