import sqlite3
import logging
import os
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

DB_PATH = os.environ.get('DB_PATH', 'riverwatch.db')


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they do not exist."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS readings (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp   TEXT NOT NULL,
                water       REAL,
                rise_rate   REAL,
                eta         REAL,
                risk        INTEGER,
                temp        REAL,
                humidity    REAL,
                rain_analog INTEGER,
                raining     INTEGER,
                light       INTEGER,
                dark        INTEGER,
                alert       TEXT,
                gps_status  INTEGER,
                lat         REAL,
                lng         REAL,
                sats        INTEGER,
                bt_paired   INTEGER
            )
        ''')
        c.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp   TEXT NOT NULL,
                level       TEXT NOT NULL,
                water       REAL,
                lat         REAL,
                lng         REAL
            )
        ''')
        conn.commit()
        logger.info("Database initialized.")
    finally:
        conn.close()
    # Ensure SOS table exists (uses its own connection)
    init_sos_table()


def init_sos_table():
    """Create sos_events table if it does not exist."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('''
            CREATE TABLE IF NOT EXISTS sos_events (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp  TEXT NOT NULL,
                lat        REAL,
                lng        REAL,
                accuracy   REAL,
                device_id  TEXT,
                water      REAL,
                alert      TEXT,
                message    TEXT,
                resolved   INTEGER DEFAULT 0
            )
        ''')
        conn.commit()
        logger.info("SOS events table initialized.")
    finally:
        conn.close()


def insert_sos(data: dict) -> int:
    """Insert an SOS event. Returns the new row id."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('''
            INSERT INTO sos_events
                (timestamp, lat, lng, accuracy, device_id, water, alert, message)
            VALUES
                (:timestamp, :lat, :lng, :accuracy, :device_id, :water, :alert, :message)
        ''', {
            'timestamp': data.get('timestamp'),
            'lat':       data.get('lat'),
            'lng':       data.get('lng'),
            'accuracy':  data.get('accuracy'),
            'device_id': data.get('deviceId'),
            'water':     data.get('water'),
            'alert':     data.get('alert'),
            'message':   data.get('message', ''),
        })
        conn.commit()
        return c.lastrowid
    except Exception as e:
        logger.error(f"insert_sos error: {e}")
        conn.rollback()
        return -1
    finally:
        conn.close()


def get_sos_events(limit: int = 20, unresolved_only: bool = False) -> list:
    """Return SOS events as list of dicts."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        if unresolved_only:
            c.execute(
                'SELECT * FROM sos_events WHERE resolved=0 ORDER BY id DESC LIMIT ?',
                (limit,)
            )
        else:
            c.execute(
                'SELECT * FROM sos_events ORDER BY id DESC LIMIT ?',
                (limit,)
            )
        rows = c.fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


def update_sos_coords(sos_id: int, lat: float, lng: float, accuracy: float, message: str) -> bool:
    """Update coordinates and message of an existing SOS event. Returns True on success."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('''
            UPDATE sos_events
            SET lat=?, lng=?, accuracy=?, message=?
            WHERE id=?
        ''', (lat, lng, accuracy, message, sos_id))
        conn.commit()
        return c.rowcount > 0
    except Exception as e:
        logger.error(f"update_sos_coords error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def resolve_sos(sos_id: int) -> bool:
    """Mark an SOS event as resolved. Returns True on success."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('UPDATE sos_events SET resolved=1 WHERE id=?', (sos_id,))
        conn.commit()
        return c.rowcount > 0
    except Exception as e:
        logger.error(f"resolve_sos error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def insert_reading(data: dict):
    """Insert a reading row. Also inserts into alerts table if level is not SAFE."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('''
            INSERT INTO readings
                (timestamp, water, rise_rate, eta, risk, temp, humidity,
                 rain_analog, raining, light, dark, alert,
                 gps_status, lat, lng, sats, bt_paired)
            VALUES
                (:timestamp, :water, :rise_rate, :eta, :risk, :temp, :humidity,
                 :rain_analog, :raining, :light, :dark, :alert,
                 :gps_status, :lat, :lng, :sats, :bt_paired)
        ''', {
            'timestamp':   data.get('timestamp'),
            'water':       data.get('water'),
            'rise_rate':   data.get('riseRate', 0),
            'eta':         data.get('eta', -1),
            'risk':        data.get('risk', 0),
            'temp':        data.get('temp'),
            'humidity':    data.get('humidity'),
            'rain_analog': data.get('rainAnalog'),
            'raining':     data.get('raining'),
            'light':       data.get('light'),
            'dark':        data.get('dark'),
            'alert':       data.get('alert'),
            'gps_status':  data.get('gpsStatus'),
            'lat':         data.get('lat'),
            'lng':         data.get('lng'),
            'sats':        data.get('sats'),
            'bt_paired':   data.get('btPaired', 0),
        })

        alert_level = data.get('alert', 'SAFE')
        if alert_level not in ('SAFE',):  # WATCH/WARNING/DANGER/CRITICAL all trigger
            c.execute('''
                INSERT INTO alerts (timestamp, level, water, lat, lng)
                VALUES (:timestamp, :level, :water, :lat, :lng)
            ''', {
                'timestamp': data.get('timestamp'),
                'level':     alert_level,
                'water':     data.get('water'),
                'lat':       data.get('lat'),
                'lng':       data.get('lng'),
            })

        conn.commit()
    except Exception as e:
        logger.error(f"insert_reading error: {e}")
        conn.rollback()
    finally:
        conn.close()


def _row_to_dict(row) -> dict:
    return dict(row) if row else {}


def get_latest() -> Optional[dict]:
    """Return the most recent reading row as a dict, or None."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('SELECT * FROM readings ORDER BY id DESC LIMIT 1')
        row = c.fetchone()
        return _row_to_dict(row) if row else None
    finally:
        conn.close()


def get_history(limit: int = 100) -> list:
    """Return last N readings newest-first as list of dicts."""
    limit = min(limit, 500)
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('SELECT * FROM readings ORDER BY id DESC LIMIT ?', (limit,))
        rows = c.fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


def get_alerts(limit: int = 50) -> list:
    """Return last N alert rows as list of dicts."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        c.execute('SELECT * FROM alerts ORDER BY id DESC LIMIT ?', (limit,))
        rows = c.fetchall()
        return [_row_to_dict(r) for r in rows]
    finally:
        conn.close()


def get_stats() -> dict:
    """Return aggregate stats for the last 24 hours."""
    conn = _get_conn()
    try:
        c = conn.cursor()
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%S.000Z')

        c.execute('''
            SELECT
                MAX(water)   AS max_water_24h,
                AVG(water)   AS avg_water_24h,
                COUNT(*)     AS total_readings
            FROM readings
            WHERE timestamp >= ?
        ''', (cutoff,))
        row = c.fetchone()
        stats = _row_to_dict(row)

        c.execute('''
            SELECT COUNT(*) AS critical_events_24h
            FROM alerts
            WHERE level = 'CRITICAL' AND timestamp >= ?
        ''', (cutoff,))
        flood_row = c.fetchone()
        stats['critical_events_24h'] = flood_row['critical_events_24h'] if flood_row else 0

        # Round floats for cleanliness
        if stats.get('avg_water_24h') is not None:
            stats['avg_water_24h'] = round(stats['avg_water_24h'], 2)

        return stats
    finally:
        conn.close()
