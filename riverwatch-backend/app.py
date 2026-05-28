"""
# =============================================================================
# RiverWatch PRO — Flask Backend
# =============================================================================
#
# SETUP INSTRUCTIONS
# ------------------
# 1. Install Python 3.10+
# 2. (Optional) Create a virtual environment:
#      python -m venv venv
# 3. Activate the virtual environment:
#      Windows:  venv\Scripts\activate
#      Linux:    source venv/bin/activate
#      macOS:    source venv/bin/activate
# 4. Install dependencies:
#      pip install -r requirements.txt
# 5. Copy .env.example to .env and edit as needed:
#      Windows:  copy .env.example .env
#      Linux/macOS: cp .env.example .env
# 6. Edit .env:
#      BT_PORT=COM6           (Windows)
#      BT_PORT=/dev/rfcomm0   (Linux)
#      BT_PORT=/dev/tty.RiverWatch_PRO-ESP32SPP  (macOS)
#      BT_BAUD=9600
#      FLASK_PORT=5000
# 7. Run the server:
#      python app.py
#
# PAIRING THE DEVICE
# ------------------
# Windows: Pair "RiverWatch_PRO" in Bluetooth settings. Check Device Manager
#          for the COM port number assigned.
# Linux:   sudo rfcomm bind /dev/rfcomm0 <MAC_ADDRESS>
# macOS:   Pair in System Preferences > Bluetooth. The port appears as
#          /dev/tty.RiverWatch_PRO-ESP32SPP automatically.
# =============================================================================
"""

import os
import logging
from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import datetime, timezone

import database
from bluetooth_reader import BluetoothReader

load_dotenv()

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Flask + SocketIO + CORS
# ---------------------------------------------------------------------------
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'riverwatch-secret-key')

CORS(app, origins='*')
socketio = SocketIO(app, cors_allowed_origins='*', async_mode='eventlet')

# ---------------------------------------------------------------------------
# Bluetooth Reader
# ---------------------------------------------------------------------------
BT_PORT = os.environ.get('BT_PORT', 'COM6')
BT_BAUD = int(os.environ.get('BT_BAUD', '9600'))

bt_reader = BluetoothReader(port=BT_PORT, baud_rate=BT_BAUD)


def on_new_reading(data: dict):
    """Called by BluetoothReader for every new reading from the ESP32."""
    # 1. Persist to database
    database.insert_reading(data)

    # 2. Emit reading event over WebSocket
    socketio.emit('reading', data)

    # 3. Emit alert event if not SAFE
    if data.get('alert', 'SAFE') != 'SAFE':
        socketio.emit('alert', {
            'level':     data.get('alert'),
            'water':     data.get('water'),
            'timestamp': data.get('timestamp'),
            'lat':       data.get('lat'),
            'lng':       data.get('lng'),
        })


# ---------------------------------------------------------------------------
# REST API Endpoints
# ---------------------------------------------------------------------------

@app.route('/api/status')
def api_status():
    return jsonify({
        'status':       'ok',
        'bt_connected': bt_reader.is_connected,
        'device':       'RiverWatch_PRO',
        'port':         BT_PORT,
    })


@app.route('/api/ingest', methods=['POST'])
def api_ingest():
    """Endpoint for local forwarder client to ingest ESP32 Bluetooth data."""
    # Validate the shared secret key
    client_key = request.headers.get('X-RiverWatch-Key')
    expected_key = os.environ.get('INGEST_KEY', 'riverwatch-demo')
    if not client_key or client_key != expected_key:
        return jsonify({'error': 'Unauthorized'}), 401

    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'Missing JSON body'}), 400

        # Ensure server-side UTC timestamp is present
        if 'timestamp' not in data:
            now = datetime.now(timezone.utc)
            data['timestamp'] = now.strftime('%Y-%m-%dT%H:%M:%S.') + f"{now.microsecond // 1000:03d}Z"

        # 1. Persist to SQLite DB
        database.insert_reading(data)

        # 2. Emit reading event over WebSocket
        socketio.emit('reading', data)

        # 3. Emit alert event if level is not SAFE/standby
        alert_level = data.get('alert', 'SAFE')
        if alert_level not in ('SAFE', 'standby'):
            socketio.emit('alert', {
                'level':     alert_level,
                'water':     data.get('water'),
                'timestamp': data.get('timestamp'),
                'lat':       data.get('lat'),
                'lng':       data.get('lng'),
            })

        return jsonify({'ok': True}), 200

    except Exception as e:
        logger.error(f"Error ingesting reading: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/latest')
def api_latest():
    reading = database.get_latest()
    if reading is None:
        return jsonify({'error': 'No data available yet'}), 404
    return jsonify(reading)


@app.route('/api/history')
def api_history():
    try:
        limit = int(request.args.get('limit', 100))
    except ValueError:
        limit = 100
    limit = max(1, min(limit, 500))
    readings = database.get_history(limit=limit)
    return jsonify({'readings': readings, 'count': len(readings)})


@app.route('/api/alerts')
def api_alerts():
    try:
        limit = int(request.args.get('limit', 50))
    except ValueError:
        limit = 50
    alerts = database.get_alerts(limit=limit)
    return jsonify({'alerts': alerts, 'count': len(alerts)})


@app.route('/api/stats')
def api_stats():
    stats = database.get_stats()
    return jsonify(stats)


# ---------------------------------------------------------------------------
# SocketIO Events
# ---------------------------------------------------------------------------

@socketio.on('connect')
def on_connect():
    logger.info(f"WebSocket client connected: {request.sid}")


@socketio.on('disconnect')
def on_disconnect():
    logger.info(f"WebSocket client disconnected: {request.sid}")


# ---------------------------------------------------------------------------
# Entry Point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    FLASK_PORT = int(os.environ.get('FLASK_PORT', 5000))

    # Initialize database
    database.init_db()

    # Register callback and start Bluetooth reader
    bt_reader.register_callback(on_new_reading)
    bt_reader.start()

    # Startup banner
    print()
    print('=' * 60)
    print('  RiverWatch PRO — Backend Server')
    print('=' * 60)
    print(f'  Bluetooth Port : {BT_PORT}')
    print(f'  Baud Rate      : {BT_BAUD}')
    print(f'  API URL        : http://localhost:{FLASK_PORT}')
    print(f'  WebSocket URL  : ws://localhost:{FLASK_PORT}')
    print('=' * 60)
    print()

    try:
        socketio.run(app, host='0.0.0.0', port=FLASK_PORT, debug=False)
    finally:
        bt_reader.stop()
