#!/usr/bin/env python3
"""Pwnagotchi BLE Control Plane for jayofelony Pwnagotchi 2.9.5.6.

BLE transport: Nordic UART Service-compatible GATT service.
Protocol: UTF-8 JSON objects, newline delimited, chunked over BLE.
No PAN, no IP, no tethering.
"""

from __future__ import annotations

import argparse
import base64
import copy
import datetime as dt
import glob
import json
import logging
import os
import pathlib
import queue
import secrets
import shutil
import socket
import subprocess
import sys
import threading
import time
import tomllib
from typing import Any

import dbus
import dbus.exceptions
import dbus.mainloop.glib
import dbus.service
from gi.repository import GLib

BLUEZ = "org.bluez"
DBUS_OM = "org.freedesktop.DBus.ObjectManager"
DBUS_PROP = "org.freedesktop.DBus.Properties"
ADAPTER_IFACE = "org.bluez.Adapter1"
GATT_MANAGER = "org.bluez.GattManager1"
GATT_SERVICE = "org.bluez.GattService1"
GATT_CHRC = "org.bluez.GattCharacteristic1"
LE_ADV_MANAGER = "org.bluez.LEAdvertisingManager1"
LE_ADV = "org.bluez.LEAdvertisement1"

# Nordic UART Service UUIDs. This makes the service usable from Bluefy/Web Bluetooth
# and also from many generic BLE UART tools.
SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"  # phone -> Pi
TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"  # Pi -> phone

CONFIG_FILE = pathlib.Path("/etc/pwnagotchi/config.toml")
DEFAULT_FILE = pathlib.Path("/etc/pwnagotchi/default.toml")
SETTINGS_FILE = pathlib.Path("/etc/pwnagotchi/ble-control.json")
CUSTOM_PLUGINS = pathlib.Path("/usr/local/share/pwnagotchi/custom-plugins")

# 20 bytes works even before a larger ATT MTU is negotiated. It is slower but
# dramatically less flaky across iOS/Web-Bluetooth implementations.
TX_CHUNK = 20
MAX_RX_BUFFER = 128 * 1024
MAX_OUTPUT = 24_000

LOG = logging.getLogger("pwnagotchi-ble")


class InvalidArgs(dbus.exceptions.DBusException):
    _dbus_error_name = "org.freedesktop.DBus.Error.InvalidArgs"


class NotSupported(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.NotSupported"


class Failed(dbus.exceptions.DBusException):
    _dbus_error_name = "org.bluez.Error.Failed"


def dbus_bytes(data: bytes):
    return dbus.Array([dbus.Byte(b) for b in data], signature="y")


def json_safe(value: Any) -> Any:
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(v) for v in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def flatten(data: Any, prefix: str = "") -> list[tuple[str, Any]]:
    out: list[tuple[str, Any]] = []
    if isinstance(data, dict):
        for key in sorted(data, key=lambda x: str(x).lower()):
            path = f"{prefix}.{key}" if prefix else str(key)
            val = data[key]
            if isinstance(val, dict):
                out.extend(flatten(val, path))
            else:
                out.append((path, json_safe(val)))
    else:
        out.append((prefix, json_safe(data)))
    return out


def path_exists(data: Any, dotted: str) -> bool:
    cur = data
    for key in dotted.split("."):
        if not isinstance(cur, dict) or key not in cur:
            return False
        cur = cur[key]
    return True


def tail_text(text: str, limit: int = MAX_OUTPUT) -> str:
    if len(text) <= limit:
        return text
    return "…[truncated]…\n" + text[-limit:]


def run(argv: list[str], timeout: int = 15, max_output: int | None = MAX_OUTPUT) -> dict[str, Any]:
    try:
        p = subprocess.run(
            argv,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout,
            env={**os.environ, "SYSTEMD_PAGER": "cat", "PAGER": "cat"},
        )
        output = p.stdout or ""
        if max_output is not None:
            output = tail_text(output, max_output)
        return {"rc": p.returncode, "output": output}
    except subprocess.TimeoutExpired as e:
        output = (e.stdout or "") if isinstance(e.stdout, str) else ""
        return {"rc": 124, "output": tail_text(output + "\nCommand timed out.")}
    except Exception as e:
        return {"rc": 127, "output": f"{type(e).__name__}: {e}"}


def service_state(name: str) -> str:
    r = run(["systemctl", "is-active", name], timeout=5)
    return (r["output"].strip().splitlines() or ["unknown"])[-1]


def cpu_temp() -> float | None:
    try:
        return round(int(pathlib.Path("/sys/class/thermal/thermal_zone0/temp").read_text().strip()) / 1000.0, 1)
    except Exception:
        return None


def system_uptime() -> int:
    try:
        return int(float(pathlib.Path("/proc/uptime").read_text().split()[0]))
    except Exception:
        return 0


def pwnagotchi_binary() -> str:
    return shutil.which("pwnagotchi") or "/usr/local/bin/pwnagotchi"


def pwnagotchi_python() -> str:
    """Find the interpreter used by the installed Pwnagotchi entry point.

    Jayofelony images commonly run Pwnagotchi from a virtualenv. Using the same
    interpreter gives us its already-installed tomlkit without assuming system
    Python has it.
    """
    binary = pathlib.Path(pwnagotchi_binary())
    try:
        first = binary.read_text(errors="ignore").splitlines()[0].strip()
        if first.startswith("#!"):
            candidate = first[2:].strip().split()[0]
            if os.path.exists(candidate):
                return candidate
    except Exception:
        pass
    for candidate in ("/home/pi/.pwn/bin/python3", "/home/pi/.pwn/bin/python"):
        if os.path.exists(candidate):
            return candidate
    return sys.executable


def load_user_config() -> dict[str, Any]:
    try:
        if CONFIG_FILE.exists():
            return tomllib.loads(CONFIG_FILE.read_text())
    except Exception as e:
        LOG.warning("Could not parse user config: %s", e)
    return {}


def load_effective_config() -> dict[str, Any]:
    """Use Pwnagotchi's own 2.9.5.6 CLI to produce the merged config."""
    r = run([pwnagotchi_binary(), "--print-config"], timeout=20, max_output=None)
    if r["rc"] != 0:
        raise RuntimeError("pwnagotchi --print-config failed: " + r["output"][-1500:])
    text = r["output"]
    starts = [i for i in (text.find("[main]"), text.find("[personality]"), text.find("[ui]")) if i >= 0]
    if starts:
        text = text[min(starts):]
    return json_safe(tomllib.loads(text))


PATCH_HELPER = r'''
import json, os, pathlib, shutil, sys, tempfile
import tomlkit

cfg_path = pathlib.Path('/etc/pwnagotchi/config.toml')
payload = json.loads(sys.stdin.read())

if cfg_path.exists():
    text = cfg_path.read_text()
    doc = tomlkit.parse(text) if text.strip() else tomlkit.document()
else:
    doc = tomlkit.document()


def set_path(root, dotted, value):
    keys = dotted.split('.')
    cur = root
    for key in keys[:-1]:
        if key not in cur or not hasattr(cur[key], 'keys'):
            cur[key] = tomlkit.table()
        cur = cur[key]
    cur[keys[-1]] = value


def del_path(root, dotted):
    keys = dotted.split('.')
    cur = root
    parents = []
    for key in keys[:-1]:
        if key not in cur or not hasattr(cur[key], 'keys'):
            return
        parents.append((cur, key))
        cur = cur[key]
    cur.pop(keys[-1], None)
    for parent, key in reversed(parents):
        try:
            if len(parent[key]) == 0:
                del parent[key]
            else:
                break
        except Exception:
            break

for path, value in payload.get('set', {}).items():
    set_path(doc, path, value)
for path in payload.get('delete', []):
    del_path(doc, path)

cfg_path.parent.mkdir(parents=True, exist_ok=True)
fd, tmp_name = tempfile.mkstemp(prefix='config.toml.ble.', dir=str(cfg_path.parent))
os.close(fd)
pathlib.Path(tmp_name).write_text(tomlkit.dumps(doc))
os.chmod(tmp_name, 0o644)
os.replace(tmp_name, cfg_path)
print('ok')
'''


def apply_config_patch(sets: dict[str, Any], deletes: list[str]) -> dict[str, Any]:
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = CONFIG_FILE.with_name(f"config.toml.ble-backup.{stamp}")
    existed = CONFIG_FILE.exists()
    if existed:
        shutil.copy2(CONFIG_FILE, backup)

    python = pwnagotchi_python()
    try:
        p = subprocess.run(
            [python, "-c", PATCH_HELPER],
            input=json.dumps({"set": sets, "delete": deletes}),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=20,
        )
        if p.returncode != 0:
            raise RuntimeError(p.stdout.strip() or "config helper failed")

        validation = run([pwnagotchi_binary(), "--print-config"], timeout=25)
        if validation["rc"] != 0:
            raise RuntimeError("Validation failed: " + validation["output"][-2500:])

        backups = sorted(CONFIG_FILE.parent.glob("config.toml.ble-backup.*"), reverse=True)
        for old in backups[10:]:
            try:
                old.unlink()
            except OSError:
                pass
        return {"backup": str(backup) if existed else None, "validated": True}
    except Exception:
        if existed and backup.exists():
            shutil.copy2(backup, CONFIG_FILE)
        elif not existed and CONFIG_FILE.exists():
            CONFIG_FILE.unlink()
        raise


def configured_plugins() -> list[dict[str, Any]]:
    try:
        effective = load_effective_config()
    except Exception:
        effective = {}
    plugins = effective.get("main", {}).get("plugins", {}) if isinstance(effective, dict) else {}
    found: dict[str, dict[str, Any]] = {}
    if isinstance(plugins, dict):
        for name, options in plugins.items():
            if isinstance(options, dict):
                found[str(name)] = {
                    "name": str(name),
                    "enabled": bool(options.get("enabled", False)),
                    "configured": True,
                    "options": json_safe(options),
                }
    if CUSTOM_PLUGINS.is_dir():
        for py in CUSTOM_PLUGINS.glob("*.py"):
            if py.name.startswith("_"):
                continue
            name = py.stem
            found.setdefault(name, {"name": name, "enabled": False, "configured": False, "options": {}})
            found[name]["custom"] = True
            found[name]["path"] = str(py)
    return sorted(found.values(), key=lambda x: x["name"].lower())


ALLOWED_EXACT = {
    "systemctl restart pwnagotchi": ["systemctl", "restart", "pwnagotchi"],
    "systemctl start pwnagotchi": ["systemctl", "start", "pwnagotchi"],
    "systemctl stop pwnagotchi": ["systemctl", "stop", "pwnagotchi"],
    "systemctl status pwnagotchi": ["systemctl", "status", "pwnagotchi", "--no-pager", "-l"],
    "systemctl status bluetooth": ["systemctl", "status", "bluetooth", "--no-pager", "-l"],
    "pwnagotchi --version": [pwnagotchi_binary(), "--version"],
    "bluetoothctl show": ["bluetoothctl", "show"],
    "rfkill list bluetooth": ["rfkill", "list", "bluetooth"],
    "systemctl --failed": ["systemctl", "--failed", "--no-pager"],
}


def allowed_command(command: str) -> list[str] | None:
    command = " ".join(command.strip().split())
    if command in ALLOWED_EXACT:
        return ALLOWED_EXACT[command]
    parts = command.split()
    if len(parts) >= 4 and parts[:3] == ["journalctl", "-u", "pwnagotchi"]:
        n = 100
        if "-n" in parts:
            try:
                n = max(1, min(500, int(parts[parts.index("-n") + 1])))
            except Exception:
                return None
        return ["journalctl", "-u", "pwnagotchi", "-n", str(n), "--no-pager", "-o", "short-iso"]
    return None


class Controller:
    def __init__(self, token: str, tx: "TxCharacteristic"):
        self.token = token
        self.tx = tx
        self._cfg_cache_ts = 0.0
        self._cfg_cache = None
        self._user_cache = None

    def configs(self, force: bool = False):
        now = time.monotonic()
        if force or self._cfg_cache is None or now - self._cfg_cache_ts > 15:
            self._cfg_cache = load_effective_config()
            self._user_cache = load_user_config()
            self._cfg_cache_ts = now
        return self._cfg_cache, self._user_cache

    def invalidate_config_cache(self):
        self._cfg_cache_ts = 0.0
        self._cfg_cache = None
        self._user_cache = None

    def emit(self, obj: dict[str, Any]):
        self.tx.send_json(obj)

    def handle_async(self, req: dict[str, Any]):
        threading.Thread(target=self._handle_worker, args=(req,), daemon=True).start()

    def _handle_worker(self, req: dict[str, Any]):
        req_id = str(req.get("id", ""))[:80]
        try:
            if not secrets.compare_digest(str(req.get("token", "")), self.token):
                self.emit({"id": req_id, "ok": False, "error": "authentication failed"})
                return
            action = str(req.get("action", ""))
            data = req.get("data") or {}
            result = self.dispatch(action, data)
            self.emit({"id": req_id, "ok": True, "result": result})
        except Exception as e:
            LOG.exception("Request failed")
            self.emit({"id": req_id, "ok": False, "error": f"{type(e).__name__}: {e}"})

    def dispatch(self, action: str, data: dict[str, Any]) -> Any:
        if action == "ping":
            return {"pong": True, "protocol": 1, "service_uuid": SERVICE_UUID}

        if action == "status":
            ver = run([pwnagotchi_binary(), "--version"], timeout=8)
            return {
                "hostname": socket.gethostname(),
                "pwnagotchi": service_state("pwnagotchi"),
                "bluetooth": service_state("bluetooth"),
                "ble_service": service_state("pwnagotchi-ble"),
                "version": ver["output"].strip().splitlines()[-1] if ver["rc"] == 0 and ver["output"].strip() else "unknown",
                "temperature_c": cpu_temp(),
                "uptime_s": system_uptime(),
                "config": str(CONFIG_FILE),
                "bt_tether_enabled": bool(self.configs()[0].get("main", {}).get("plugins", {}).get("bt-tether", {}).get("enabled", False)),
            }

        if action == "config.list":
            prefix = str(data.get("prefix", ""))
            offset = max(0, int(data.get("offset", 0)))
            limit = max(1, min(50, int(data.get("limit", 25))))
            effective, user = self.configs()
            entries = flatten(effective)
            if prefix:
                entries = [e for e in entries if e[0].startswith(prefix)]
            total = len(entries)
            page = []
            for path, value in entries[offset:offset + limit]:
                page.append({
                    "path": path,
                    "value": value,
                    "type": "bool" if isinstance(value, bool) else "number" if isinstance(value, (int, float)) and not isinstance(value, bool) else "array" if isinstance(value, list) else "string" if isinstance(value, str) else "json",
                    "overridden": path_exists(user, path),
                })
            return {"entries": page, "offset": offset, "limit": limit, "total": total, "more": offset + limit < total}

        if action == "config.patch":
            sets = data.get("set", {}) or {}
            deletes = data.get("delete", []) or []
            restart = bool(data.get("restart", True))
            if not isinstance(sets, dict) or not isinstance(deletes, list):
                raise ValueError("set must be an object and delete must be an array")
            if len(sets) + len(deletes) > 200:
                raise ValueError("too many changes in one request")
            for path in list(sets) + list(deletes):
                if not isinstance(path, str) or not path or path.startswith(".") or ".." in path:
                    raise ValueError(f"invalid config path: {path!r}")
            info = apply_config_patch(sets, deletes)
            self.invalidate_config_cache()
            if restart:
                r = run(["systemctl", "restart", "pwnagotchi"], timeout=20)
                info["restart"] = r
            return info

        if action == "plugins.list":
            return {"plugins": configured_plugins()}

        if action == "logs":
            n = max(10, min(500, int(data.get("lines", 150))))
            return run(["journalctl", "-u", "pwnagotchi", "-n", str(n), "--no-pager", "-o", "short-iso"], timeout=12)

        if action == "debug.snapshot":
            chunks = []
            commands = [
                [pwnagotchi_binary(), "--version"],
                ["systemctl", "status", "pwnagotchi", "--no-pager", "-l"],
                ["journalctl", "-u", "pwnagotchi", "-n", "120", "--no-pager", "-o", "short-iso"],
                ["systemctl", "status", "bluetooth", "--no-pager", "-l"],
                ["bluetoothctl", "show"],
                ["rfkill", "list", "bluetooth"],
                ["systemctl", "--failed", "--no-pager"],
                ["df", "-h", "/", "/etc/pwnagotchi"],
            ]
            for argv in commands:
                r = run(argv, timeout=12)
                chunks.append(f"$ {' '.join(argv)}\n{r['output'].rstrip()}\n")
            chunks.append(f"CPU temperature: {cpu_temp()} °C\nUptime: {system_uptime()} s\n")
            return {"rc": 0, "output": tail_text("\n".join(chunks), MAX_OUTPUT)}

        if action == "command":
            command = str(data.get("command", ""))
            argv = allowed_command(command)
            if argv is None:
                raise PermissionError("command is not in the BLE allowlist")
            return run(argv, timeout=25)

        if action in {"reboot", "shutdown", "bluetooth.restart"}:
            def delayed():
                time.sleep(1.5)
                if action == "reboot":
                    subprocess.run(["systemctl", "reboot"])
                elif action == "shutdown":
                    subprocess.run(["systemctl", "poweroff"])
                else:
                    subprocess.run(["systemctl", "restart", "bluetooth"])
            threading.Thread(target=delayed, daemon=True).start()
            return {"scheduled": True, "disconnect_expected": True}

        raise ValueError(f"unknown action: {action}")


class Service(dbus.service.Object):
    PATH_BASE = "/com/pwnagotchi/ble/service"

    def __init__(self, bus, index: int, uuid: str, primary: bool = True):
        self.path = f"{self.PATH_BASE}{index}"
        self.bus = bus
        self.uuid = uuid
        self.primary = primary
        self.characteristics = []
        super().__init__(bus, self.path)

    def add_characteristic(self, chrc):
        self.characteristics.append(chrc)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def get_characteristic_paths(self):
        return [c.get_path() for c in self.characteristics]

    def get_properties(self):
        return {GATT_SERVICE: {
            "UUID": self.uuid,
            "Primary": dbus.Boolean(self.primary),
            "Characteristics": dbus.Array(self.get_characteristic_paths(), signature="o"),
        }}

    @dbus.service.method(DBUS_PROP, in_signature="s", out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != GATT_SERVICE:
            raise InvalidArgs()
        return self.get_properties()[GATT_SERVICE]


class Characteristic(dbus.service.Object):
    def __init__(self, bus, index: int, uuid: str, flags: list[str], service: Service):
        self.path = f"{service.path}/char{index}"
        self.bus = bus
        self.uuid = uuid
        self.flags = flags
        self.service = service
        super().__init__(bus, self.path)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def get_properties(self):
        return {GATT_CHRC: {
            "Service": self.service.get_path(),
            "UUID": self.uuid,
            "Flags": dbus.Array(self.flags, signature="s"),
            "Descriptors": dbus.Array([], signature="o"),
        }}

    @dbus.service.method(DBUS_PROP, in_signature="s", out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != GATT_CHRC:
            raise InvalidArgs()
        return self.get_properties()[GATT_CHRC]

    @dbus.service.method(GATT_CHRC, in_signature="a{sv}", out_signature="ay")
    def ReadValue(self, options):
        raise NotSupported()

    @dbus.service.method(GATT_CHRC, in_signature="aya{sv}")
    def WriteValue(self, value, options):
        raise NotSupported()

    @dbus.service.method(GATT_CHRC)
    def StartNotify(self):
        raise NotSupported()

    @dbus.service.method(GATT_CHRC)
    def StopNotify(self):
        raise NotSupported()

    @dbus.service.signal(DBUS_PROP, signature="sa{sv}as")
    def PropertiesChanged(self, interface, changed, invalidated):
        pass


class TxCharacteristic(Characteristic):
    def __init__(self, bus, index, service):
        super().__init__(bus, index, TX_UUID, ["read", "notify"], service)
        self.notifying = False
        self.last_value = b""
        self._queue: queue.Queue[bytes] = queue.Queue()
        self._pump_active = False
        self._lock = threading.Lock()

    def ReadValue(self, options):
        return dbus_bytes(self.last_value[-TX_CHUNK:])

    def StartNotify(self):
        self.notifying = True
        self._ensure_pump()

    def StopNotify(self):
        self.notifying = False

    def send_json(self, obj: dict[str, Any]):
        line = (json.dumps(json_safe(obj), separators=(",", ":"), ensure_ascii=False) + "\n").encode("utf-8")
        for i in range(0, len(line), TX_CHUNK):
            self._queue.put(line[i:i + TX_CHUNK])
        GLib.idle_add(self._ensure_pump)

    def _ensure_pump(self):
        with self._lock:
            if not self._pump_active:
                self._pump_active = True
                GLib.timeout_add(7, self._pump)
        return False

    def _pump(self):
        if not self.notifying:
            with self._lock:
                self._pump_active = False
            return False
        try:
            chunk = self._queue.get_nowait()
        except queue.Empty:
            with self._lock:
                self._pump_active = False
            return False
        self.last_value = chunk
        self.PropertiesChanged(GATT_CHRC, {"Value": dbus_bytes(chunk)}, [])
        return True


class RxCharacteristic(Characteristic):
    def __init__(self, bus, index, service, controller_factory):
        super().__init__(bus, index, RX_UUID, ["write", "write-without-response"], service)
        self.buffer = bytearray()
        self.controller_factory = controller_factory

    def WriteValue(self, value, options):
        try:
            chunk = bytes(int(x) for x in value)
            self.buffer.extend(chunk)
            if len(self.buffer) > MAX_RX_BUFFER:
                self.buffer.clear()
                raise Failed("request buffer too large")
            while b"\n" in self.buffer:
                line, rest = self.buffer.split(b"\n", 1)
                self.buffer = bytearray(rest)
                if not line.strip():
                    continue
                req = json.loads(line.decode("utf-8"))
                if not isinstance(req, dict):
                    raise ValueError("request must be a JSON object")
                self.controller_factory().handle_async(req)
        except dbus.exceptions.DBusException:
            raise
        except Exception as e:
            LOG.warning("Bad BLE request: %s", e)
            raise Failed(str(e))


class PwnService(Service):
    def __init__(self, bus, index, token):
        super().__init__(bus, index, SERVICE_UUID, True)
        self.tx = TxCharacteristic(bus, 0, self)
        self._controller = Controller(token, self.tx)
        self.rx = RxCharacteristic(bus, 1, self, lambda: self._controller)
        self.add_characteristic(self.tx)
        self.add_characteristic(self.rx)


class Application(dbus.service.Object):
    def __init__(self, bus, token):
        self.path = "/com/pwnagotchi/ble"
        self.services = [PwnService(bus, 0, token)]
        super().__init__(bus, self.path)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    @dbus.service.method(DBUS_OM, out_signature="a{oa{sa{sv}}}")
    def GetManagedObjects(self):
        objects = {}
        for service in self.services:
            objects[service.get_path()] = service.get_properties()
            for chrc in service.characteristics:
                objects[chrc.get_path()] = chrc.get_properties()
        return objects


class Advertisement(dbus.service.Object):
    def __init__(self, bus, index: int, name: str):
        self.path = f"/com/pwnagotchi/ble/advertisement{index}"
        self.name = name[:20]
        super().__init__(bus, self.path)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def get_properties(self):
        return {LE_ADV: {
            "Type": "peripheral",
            "ServiceUUIDs": dbus.Array([SERVICE_UUID], signature="s"),
            "LocalName": dbus.String(self.name),
        }}

    @dbus.service.method(DBUS_PROP, in_signature="s", out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != LE_ADV:
            raise InvalidArgs()
        return self.get_properties()[LE_ADV]

    @dbus.service.method(LE_ADV, in_signature="", out_signature="")
    def Release(self):
        LOG.info("Advertisement released")


def find_adapter(bus):
    om = dbus.Interface(bus.get_object(BLUEZ, "/"), DBUS_OM)
    objects = om.GetManagedObjects()
    for path, props in objects.items():
        if GATT_MANAGER in props and LE_ADV_MANAGER in props:
            return path
    return None


def load_settings() -> dict[str, Any]:
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if SETTINGS_FILE.exists():
        try:
            data = json.loads(SETTINGS_FILE.read_text())
            if data.get("token"):
                return data
        except Exception:
            pass
    data = {
        "token": secrets.token_urlsafe(18),
        "name": "Pwnagotchi BLE",
        "created": dt.datetime.now().isoformat(timespec="seconds"),
    }
    SETTINGS_FILE.write_text(json.dumps(data, indent=2) + "\n")
    os.chmod(SETTINGS_FILE, 0o600)
    return data


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--show-token", action="store_true")
    parser.add_argument("--name", default=None)
    args = parser.parse_args()

    settings = load_settings()
    if args.show_token:
        print(settings["token"])
        return 0

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()
    adapter = find_adapter(bus)
    if not adapter:
        LOG.error("No adapter with GATT + LE advertising support found")
        return 2

    props = dbus.Interface(bus.get_object(BLUEZ, adapter), DBUS_PROP)
    props.Set(ADAPTER_IFACE, "Powered", dbus.Boolean(True))
    try:
        props.Set(ADAPTER_IFACE, "Discoverable", dbus.Boolean(True))
    except Exception:
        pass

    app = Application(bus, settings["token"])
    adv = Advertisement(bus, 0, args.name or settings.get("name", "Pwnagotchi BLE"))
    gatt = dbus.Interface(bus.get_object(BLUEZ, adapter), GATT_MANAGER)
    adman = dbus.Interface(bus.get_object(BLUEZ, adapter), LE_ADV_MANAGER)
    loop = GLib.MainLoop()

    def fail(error):
        LOG.error("BlueZ registration failed: %s", error)
        loop.quit()

    gatt.RegisterApplication(app.get_path(), {},
                             reply_handler=lambda: LOG.info("GATT application registered"),
                             error_handler=fail)
    adman.RegisterAdvertisement(adv.get_path(), {},
                                reply_handler=lambda: LOG.info("BLE advertising as %s", adv.name),
                                error_handler=fail)

    LOG.info("Pwnagotchi BLE control ready; PAN/tethering is not used")
    try:
        loop.run()
    except KeyboardInterrupt:
        pass
    try:
        adman.UnregisterAdvertisement(adv.get_path())
    except Exception:
        pass
    try:
        gatt.UnregisterApplication(app.get_path())
    except Exception:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
