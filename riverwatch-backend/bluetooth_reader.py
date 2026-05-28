import sys
import os
import json
import time
import threading
import logging
from datetime import datetime, timezone
import serial
import serial.tools.list_ports
import requests

logger = logging.getLogger(__name__)


class BluetoothReader:
    """Reads JSON lines from ESP32 RiverWatch_PRO device over Bluetooth SPP serial.
    Kept for backward compatibility with local app.py imports.
    """

    def __init__(self, port: str, baud_rate: int = 9600, callback=None):
        self._port = port
        self._baud_rate = baud_rate
        self._callback = callback
        self._running = False
        self._thread = None
        self._serial = None
        self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    def register_callback(self, callback):
        """Register a function to be called with each parsed reading dict."""
        self._callback = callback

    def start(self):
        """Start the background reader thread."""
        if self._thread and self._thread.is_alive():
            logger.warning("BluetoothReader already running.")
            return
        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()
        logger.info(f"BluetoothReader compatibility mode started on port {self._port}.")

    def stop(self):
        """Stop the background reader thread."""
        self._running = False
        self._connected = False
        if self._serial and self._serial.is_open:
            try:
                self._serial.close()
            except Exception:
                pass
        if self._thread:
            self._thread.join(timeout=3)
        logger.info("BluetoothReader compatibility mode stopped.")

    def _read_loop(self):
        while self._running:
            try:
                self._serial = serial.Serial(self._port, self._baud_rate, timeout=1)
                self._connected = True
                while self._running:
                    raw = self._serial.readline()
                    if not raw:
                        continue
                    line = raw.decode('utf-8', errors='replace').strip()
                    if not line:
                        continue

                    data = None
                    if line.startswith("{"):
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError:
                            pass

                    # Parse custom format: W:7.4cm | T:1.6C | H:15% | Rain:NO(4095) | Light:1466 | GPS:SEARCHING
                    if not data:
                        try:
                            parts = [p.strip() for p in line.split("|")]
                            parsed = {}
                            for p in parts:
                                if ":" in p:
                                    k, v = p.split(":", 1)
                                    parsed[k.strip()] = v.strip()

                            water_str = parsed.get("W", "0").replace("cm", "")
                            temp_str = parsed.get("T", "0").replace("C", "")
                            hum_str = parsed.get("H", "0").replace("%", "")
                            rain_raw = parsed.get("Rain", "NO(4095)")
                            raining = 1 if "YES" in rain_raw else 0
                            rain_analog = 4095
                            if "(" in rain_raw:
                                try:
                                    rain_analog = int(rain_raw.split("(")[1].split(")")[0])
                                except Exception:
                                    pass

                            light = int(parsed.get("Light", "4095"))
                            gps = parsed.get("GPS", "SEARCHING")
                            gps_status = 1 if gps == "FIXED" else 0

                            data = {
                                "water": float(water_str),
                                "temp": float(temp_str),
                                "humidity": float(hum_str),
                                "raining": raining,
                                "rainAnalog": rain_analog,
                                "light": light,
                                "dark": 1 if light > 2000 else 0,
                                "gpsStatus": gps_status,
                                "alert": "SAFE" if float(water_str) < 15.0 else "WATCH"
                            }
                        except Exception:
                            continue

                    if 'timestamp' not in data:
                        now = datetime.now(timezone.utc)
                        data['timestamp'] = now.strftime('%Y-%m-%dT%H:%M:%S.') + f"{now.microsecond // 1000:03d}Z"

                    if self._callback:
                        try:
                            self._callback(data)
                        except Exception as cb_err:
                            logger.error(f"Callback error: {cb_err}")

            except Exception as e:
                logger.error(f"Reader connection error: {e}")
                self._connected = False
            finally:
                if self._serial and self._serial.is_open:
                    try:
                        self._serial.close()
                    except Exception:
                        pass
                self._connected = False

            if self._running:
                time.sleep(5)


def setup_config():
    print("\n" + "=" * 60)
    print("  RiverWatch PRO — Standalone Local Forwarder Setup")
    print("=" * 60)

    # 1. Backend URL
    backend_url = input("\nEnter RiverWatch PRO Backend URL\n(e.g., https://riverwatch-pro.up.railway.app or http://localhost:5000)\n[http://localhost:5000]: ").strip()
    if not backend_url:
        backend_url = "http://localhost:5000"
    if backend_url.endswith("/"):
        backend_url = backend_url[:-1]

    # 2. Ingest Key
    ingest_key = input("\nEnter Ingest Key (shared secret)\n[riverwatch-demo]: ").strip()
    if not ingest_key:
        ingest_key = "riverwatch-demo"

    # 3. Serial Port
    print("\nScanning for available serial ports...")
    ports = list(serial.tools.list_ports.comports())

    recommended_index = -1
    if ports:
        print("\nAvailable ports:")
        for idx, p in enumerate(ports):
            desc = p.description.lower()
            device = p.device.lower()
            is_recommended = any(k in desc or k in device for k in ("riverwatch", "rfcomm", "usb", "bluetooth"))
            rec_str = " (Recommended)" if is_recommended else ""
            if is_recommended and recommended_index == -1:
                recommended_index = idx
            print(f"  [{idx + 1}] {p.device} - {p.description}{rec_str}")
    else:
        print("  No serial ports detected automatically.")

    port_choice = ""
    while not port_choice:
        if ports:
            default_val = str(recommended_index + 1) if recommended_index != -1 else "1"
            choice = input(f"\nSelect port number [1-{len(ports)}] or type custom port path [{default_val}]: ").strip()
            if not choice:
                choice = default_val

            if choice.isdigit() and 1 <= int(choice) <= len(ports):
                port_choice = ports[int(choice) - 1].device
            else:
                port_choice = choice
        else:
            port_choice = input("\nEnter serial port path (e.g., COM6 or /dev/cu.RiverWatch_PRO): ").strip()

    # 4. Save config
    config = {
        "backend_url": backend_url,
        "ingest_key": ingest_key,
        "port": port_choice,
        "baud_rate": 9600
    }

    with open("config.json", "w") as f:
        json.dump(config, f, indent=2)
    print(f"\nConfiguration saved to config.json! Running forwarder...")
    time.sleep(1.5)
    return config


def main():
    # Load or create config
    config_path = "config.json"
    if not os.path.exists(config_path):
        config = setup_config()
    else:
        try:
            with open(config_path) as f:
                config = json.load(f)
        except Exception as e:
            print(f"Error reading config.json: {e}")
            config = setup_config()

    backend_url = config.get("backend_url", "http://localhost:5000")
    ingest_key = config.get("ingest_key", "riverwatch-demo")
    port = config.get("port", "COM6")
    baud_rate = config.get("baud_rate", 9600)

    # Clean ANSI output colors
    GREEN = "\033[92m"
    RED = "\033[91m"
    YELLOW = "\033[93m"
    CYAN = "\033[96m"
    RESET = "\033[0m"

    # We can handle OS clear screen
    os_system = sys.platform

    def clear_screen():
        if os_system == "win32":
            os.system("cls")
        else:
            os.system("clear")

    forwarded_count = 0

    clear_screen()
    print("=" * 60)
    print(f"  {CYAN}RiverWatch PRO — Standalone Bluetooth Forwarder{RESET}")
    print("=" * 60)
    print(f"  Backend URL : {backend_url}")
    print(f"  Serial Port : {port} ({baud_rate} Baud)")
    print(f"  Ingest Key  : {'*' * len(ingest_key)} (loaded)")
    print("=" * 60)
    print("\nStarting forwarder loop. Press Ctrl+C to exit.\n")

    while True:
        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {YELLOW}Connecting to serial port {port}...{RESET}")
            ser = serial.Serial(port, baud_rate, timeout=1)
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {GREEN}Bluetooth serial connection established!{RESET}")

            while True:
                raw_line = ser.readline()
                if not raw_line:
                    continue

                line = raw_line.decode('utf-8', errors='replace').strip()
                if not line:
                    continue

                data = None
                if line.startswith("{"):
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        pass

                # Parse custom format: W:7.4cm | T:1.6C | H:15% | Rain:NO(4095) | Light:1466 | GPS:SEARCHING
                if not data:
                    try:
                        parts = [p.strip() for p in line.split("|")]
                        parsed = {}
                        for p in parts:
                            if ":" in p:
                                k, v = p.split(":", 1)
                                parsed[k.strip()] = v.strip()

                        water_str = parsed.get("W", "0").replace("cm", "")
                        temp_str = parsed.get("T", "0").replace("C", "")
                        hum_str = parsed.get("H", "0").replace("%", "")
                        rain_raw = parsed.get("Rain", "NO(4095)")
                        raining = 1 if "YES" in rain_raw else 0
                        rain_analog = 4095
                        if "(" in rain_raw:
                            try:
                                rain_analog = int(rain_raw.split("(")[1].split(")")[0])
                            except Exception:
                                pass

                        light = int(parsed.get("Light", "4095"))
                        gps = parsed.get("GPS", "SEARCHING")
                        gps_status = 1 if gps == "FIXED" else 0

                        data = {
                            "water": float(water_str),
                            "temp": float(temp_str),
                            "humidity": float(hum_str),
                            "raining": raining,
                            "rainAnalog": rain_analog,
                            "light": light,
                            "dark": 1 if light > 2000 else 0,
                            "gpsStatus": gps_status,
                            "alert": "SAFE" if float(water_str) < 15.0 else "WATCH"
                        }
                    except Exception:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {YELLOW}Skipped line (unsupported format): {line!r}{RESET}")
                        continue

                # Ensure timestamp exists
                if 'timestamp' not in data:
                    now = datetime.now(timezone.utc)
                    data['timestamp'] = now.strftime('%Y-%m-%dT%H:%M:%S.') + f"{now.microsecond // 1000:03d}Z"

                # HTTP POST Ingestion
                try:
                    headers = {
                        "Content-Type": "application/json",
                        "X-RiverWatch-Key": ingest_key
                    }
                    ingest_url = f"{backend_url}/api/ingest"
                    response = requests.post(ingest_url, json=data, headers=headers, timeout=5)

                    if response.status_code == 200:
                        forwarded_count += 1
                        alert = data.get("alert", "SAFE")
                        alert_color = GREEN if alert == "SAFE" else (RED if alert in ("DANGER", "CRITICAL") else YELLOW)
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {GREEN}✔ Sent #{forwarded_count}{RESET} | "
                              f"Water: {data.get('water')}cm | Temp: {data.get('temp')}C | Alert: {alert_color}{alert}{RESET}")
                    elif response.status_code == 401:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}✖ 401 Unauthorized! Check INGEST_KEY in config.json and Railway/Render.{RESET}")
                        time.sleep(5)
                    else:
                        print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}✖ Server error {response.status_code}: {response.text}{RESET}")
                except requests.exceptions.RequestException as req_err:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}✖ HTTP connection failed: {req_err}{RESET}")

        except serial.SerialException as ser_err:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}✖ Serial error: {ser_err}{RESET}")
        except KeyboardInterrupt:
            print(f"\n{YELLOW}Stopping RiverWatch PRO Forwarder. Goodbye!{RESET}")
            sys.exit(0)
        except Exception as err:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {RED}✖ Unexpected error: {err}{RESET}")

        print(f"[{datetime.now().strftime('%H:%M:%S')}] {YELLOW}Reconnecting in 5 seconds...{RESET}")
        time.sleep(5)


if __name__ == '__main__':
    main()
