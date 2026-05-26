import serial
import json
import threading
import logging
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class BluetoothReader:
    """Reads JSON lines from ESP32 RiverWatch_PRO device over Bluetooth SPP serial."""

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
        logger.info(f"BluetoothReader started on port {self._port} at {self._baud_rate} baud.")

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
        logger.info("BluetoothReader stopped.")

    def _read_loop(self):
        """Background thread: open serial port, read lines, parse JSON, call callback."""
        while self._running:
            try:
                logger.info(f"Attempting to open serial port {self._port}...")
                self._serial = serial.Serial(self._port, self._baud_rate, timeout=1)
                self._connected = True
                logger.info(f"Serial port {self._port} opened successfully.")

                while self._running:
                    try:
                        raw = self._serial.readline()
                        if not raw:
                            continue
                        line = raw.decode('utf-8', errors='replace').strip()
                        if not line:
                            continue
                        try:
                            data = json.loads(line)
                        except json.JSONDecodeError as e:
                            logger.warning(f"JSON parse error: {e} | Raw: {line!r}")
                            continue

                        # Add server-side timestamp (ISO8601 UTC)
                        data['timestamp'] = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.') + \
                            f"{datetime.now(timezone.utc).microsecond // 1000:03d}Z"

                        if self._callback:
                            try:
                                self._callback(data)
                            except Exception as cb_err:
                                logger.error(f"Callback error: {cb_err}")

                    except serial.SerialException as e:
                        logger.error(f"Serial read error: {e}")
                        self._connected = False
                        break

            except serial.SerialException as e:
                logger.error(f"Cannot open serial port {self._port}: {e}")
                self._connected = False
            except Exception as e:
                logger.error(f"Unexpected error in BluetoothReader: {e}")
                self._connected = False
            finally:
                if self._serial and self._serial.is_open:
                    try:
                        self._serial.close()
                    except Exception:
                        pass
                self._connected = False

            if self._running:
                logger.info(f"Reconnecting in 5 seconds...")
                time.sleep(5)


if __name__ == '__main__':
    import os
    logging.basicConfig(level=logging.DEBUG)

    port = os.environ.get('BT_PORT', 'COM6')
    baud = int(os.environ.get('BT_BAUD', '9600'))

    def on_reading(data):
        print("Reading:", data)

    reader = BluetoothReader(port, baud, callback=on_reading)
    reader.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        reader.stop()
