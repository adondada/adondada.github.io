# Pwnagotchi BLE WebCFG

BLE-only control panel for **jayofelony Pwnagotchi v2.9.5.6** on Raspberry Pi / Pi Zero 2 W.

It does **not** create a Bluetooth PAN interface, IP network, DHCP service, or iPhone tether. The Pi advertises a custom BLE GATT service and the iPhone connects directly from a Web Bluetooth page opened in **Bluefy**.

## Live iPhone app

Open this inside **Bluefy** on iPhone:

**https://adondada.com/pwnagotchi-ble-webcfg/**

Safari itself does not provide the Web Bluetooth API used by this page.

## One-line Pi install

Run on the Pwnagotchi:

```bash
curl -fsSL https://raw.githubusercontent.com/adondada/adondada.github.io/main/pwnagotchi-ble-webcfg/install-from-github.sh | sudo bash
```

The installer checks Pwnagotchi, BlueZ and Python D-Bus dependencies, installs the BLE daemon and systemd unit, enables the service, and prints a random BLE control token.

Save the token. To display it later:

```bash
sudo /usr/local/lib/pwnagotchi-ble/pwnagotchi_ble.py --show-token
```

Then open the live page in Bluefy, paste the token, tap **Save token**, then **Connect BLE** and select `Pwnagotchi BLE`.

## Architecture

```text
iPhone / Bluefy
      |
      | BLE GATT only
      v
Pwnagotchi BLE daemon
      |
      +-- /etc/pwnagotchi/config.toml
      +-- pwnagotchi --print-config
      +-- systemctl
      +-- journalctl
      +-- plugin configuration

No bnep0
No PAN
No IP address
No DHCP
No Personal Hotspot
No bt-tether requirement
```

## Features

- BLE-only control, independent of Pwnagotchi `bt-tether`.
- Full effective-config browser similar to WebCFG.
- Search all merged Pwnagotchi options.
- Edit booleans, numbers, strings, arrays and JSON-like values.
- Add new config overrides.
- Remove a user override and fall back to the release default.
- Automatic timestamped backup of `/etc/pwnagotchi/config.toml` before changes.
- Validation with `pwnagotchi --print-config` before accepting a modified config.
- Optional Pwnagotchi restart after saving.
- Discover configured and custom plugins.
- Enable/disable configured plugins.
- View Pwnagotchi journal logs.
- Debug snapshot.
- Device status, version, uptime and CPU temperature.
- Reboot and shutdown the Pi.
- Restart Bluetooth.
- Allowlisted maintenance commands such as:
  - `systemctl restart pwnagotchi`
  - `systemctl start pwnagotchi`
  - `systemctl stop pwnagotchi`
  - `systemctl status pwnagotchi`
  - `pwnagotchi --version`
  - bounded `journalctl -u pwnagotchi -n ...`
  - `bluetoothctl show`
  - `rfkill list bluetooth`

There is deliberately **no unrestricted root shell over BLE**. The daemon runs as root because writing `/etc/pwnagotchi/config.toml` and controlling systemd require it. Arbitrary shell execution over a nearby radio would turn a useful controller into a pocket RCE beacon.

## Files

```text
pwnagotchi-ble-webcfg/
├── index.html                  # Bluefy/Web Bluetooth client served by GitHub Pages
├── install-from-github.sh      # one-line bootstrap installer
├── README.md
└── pi/
    ├── install.sh
    ├── pwnagotchi_ble.py       # BlueZ GATT/advertising daemon
    └── pwnagotchi-ble.service  # systemd service
```

## Service commands

Check status:

```bash
sudo systemctl status pwnagotchi-ble --no-pager
```

Follow logs:

```bash
sudo journalctl -u pwnagotchi-ble -f
```

Restart the BLE daemon:

```bash
sudo systemctl restart pwnagotchi-ble
```

A healthy startup should contain messages similar to:

```text
GATT application registered
BLE advertising as Pwnagotchi BLE
Pwnagotchi BLE control ready; PAN/tethering is not used
```

## Disable PAN/tethering

BLE works whether `bt-tether` is enabled or not. For a truly BLE-only setup, use the WebCFG page and set:

```toml
[main.plugins.bt-tether]
enabled = false
```

Then save and restart Pwnagotchi.

## BLE protocol

The project uses Nordic-UART-style UUIDs so it is straightforward to inspect with generic BLE tooling too.

Service:

```text
6e400001-b5a3-f393-e0a9-e50e24dcca9e
```

Phone -> Pi RX:

```text
6e400002-b5a3-f393-e0a9-e50e24dcca9e
```

Pi -> Phone TX/Notify:

```text
6e400003-b5a3-f393-e0a9-e50e24dcca9e
```

Messages are UTF-8 JSON objects terminated by `\n` and split into conservative 20-byte BLE chunks for iOS compatibility.

Example request:

```json
{"id":"1","token":"...","action":"status","data":{}}
```

Example response:

```json
{"id":"1","ok":true,"result":{"pwnagotchi":"active"}}
```

## Config behavior

Reads use:

```bash
pwnagotchi --print-config
```

so the browser sees the effective merged Pwnagotchi configuration rather than only the raw user file.

Writes modify:

```text
/etc/pwnagotchi/config.toml
```

using `tomlkit` from the installed Pwnagotchi Python environment where possible. Before each edit the daemon creates a backup like:

```text
/etc/pwnagotchi/config.toml.ble-backup.YYYYMMDD-HHMMSS
```

It validates the resulting configuration by running `pwnagotchi --print-config`. If validation fails, the previous config is restored. The newest ten BLE backups are retained.

## Security

On first install a random high-entropy application token is generated and saved root-only at:

```text
/etc/pwnagotchi/ble-control.json
```

The Bluefy page stores the copy in browser local storage after you press **Save token**.

This initial version prioritizes Bluefy/iPhone compatibility and does not require BLE link-level pairing/encryption. Authentication prevents commands without the token, but configuration values still travel over the BLE link. Do not use it as a high-assurance secret-management channel.

## Troubleshooting

If the service fails:

```bash
sudo journalctl -u pwnagotchi-ble -n 100 --no-pager
systemctl status bluetooth --no-pager
bluetoothctl show
```

If Bluefy cannot see `Pwnagotchi BLE`:

```bash
sudo systemctl restart bluetooth
sudo systemctl restart pwnagotchi-ble
sudo journalctl -u pwnagotchi-ble -n 100 --no-pager
```

If authentication fails:

```bash
sudo /usr/local/lib/pwnagotchi-ble/pwnagotchi_ble.py --show-token
```

## Target

Built for **jayofelony Pwnagotchi 2.9.5.6**. The implementation intentionally follows that release's `/etc/pwnagotchi/config.toml`, `pwnagotchi --print-config`, plugin config and systemd layout rather than assuming old Pwnagotchi images behave the same way.
