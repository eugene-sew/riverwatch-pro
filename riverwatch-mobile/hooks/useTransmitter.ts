/**
 * useTransmitter — handles periodic POSTing of sensor payload to Railway backend
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { buildPayload, generateDeviceId, luxToLightDark, waterToDistance, rainAnalogToBoolean } from '../utils/payload';
import { SensorReadings } from './useSensors';
import { SimulatorState } from './useSimulator';
import { RiskEngineOutput } from './useRiskEngine';
import { AlertLevel } from '../constants/alertLevels';
import { DEFAULT_BACKEND_URL, DEFAULT_INGEST_PATH, DEFAULT_TX_INTERVAL_MS, DEFAULT_API_KEY } from '../constants/thresholds';

const DEVICE_ID_KEY = 'rw_device_id';
const BACKEND_URL_KEY = 'rw_backend_url';
const API_KEY_STORE_KEY = 'rw_api_key';
const MAX_LOG_ENTRIES = 50;

export interface TransmitLogEntry {
  id: number;
  timestamp: string;
  status: 'ok' | 'error' | 'pending';
  httpStatus?: number;
  alert: AlertLevel;
  water: number;
  riskScore: number;
  ms: number;
}

export interface TransmitterState {
  isRunning: boolean;
  isConnected: boolean;
  lastTxTime: string | null;
  txCount: number;
  errorCount: number;
  log: TransmitLogEntry[];
  intervalMs: number;
  backendUrl: string;
  apiKey: string;

  startTransmitting: () => void;
  stopTransmitting: () => void;
  setIntervalMs: (ms: number) => void;
  setBackendUrl: (url: string) => void;
  setApiKey: (key: string) => void;
  testConnection: () => Promise<boolean>;
  sendNow: () => Promise<void>;
}

let _logIdCounter = 0;

export function useTransmitter(
  sensors: SensorReadings,
  simulator: SimulatorState,
  risk: RiskEngineOutput,
): TransmitterState {
  const [isRunning, setIsRunning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastTxTime, setLastTxTime] = useState<string | null>(null);
  const [txCount, setTxCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [log, setLog] = useState<TransmitLogEntry[]>([]);
  const [intervalMs, setIntervalMs] = useState(DEFAULT_TX_INTERVAL_MS);
  const [backendUrl, setBackendUrl] = useState(DEFAULT_BACKEND_URL);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);

  const deviceIdRef = useRef<string>('');
  const sensorRef = useRef(sensors);
  const simulatorRef = useRef(simulator);
  const riskRef = useRef(risk);
  const backendUrlRef = useRef(backendUrl);
  const apiKeyRef = useRef(apiKey);

  sensorRef.current = sensors;
  simulatorRef.current = simulator;
  riskRef.current = risk;
  backendUrlRef.current = backendUrl;
  apiKeyRef.current = apiKey;

  // Load device ID and settings from secure store
  useEffect(() => {
    async function loadSettings() {
      try {
        let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (!id) {
          id = generateDeviceId();
          await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
        }
        deviceIdRef.current = id;

        const savedUrl = await SecureStore.getItemAsync(BACKEND_URL_KEY);
        if (savedUrl) setBackendUrl(savedUrl);

        const savedKey = await SecureStore.getItemAsync(API_KEY_STORE_KEY);
        if (savedKey !== null) {
          setApiKey(savedKey);
        } else {
          setApiKey(DEFAULT_API_KEY);
        }
      } catch {}
    }
    loadSettings();
  }, []);

  // Persist URL changes
  useEffect(() => {
    SecureStore.setItemAsync(BACKEND_URL_KEY, backendUrl).catch(() => {});
    backendUrlRef.current = backendUrl;
  }, [backendUrl]);

  // Persist API key changes
  useEffect(() => {
    SecureStore.setItemAsync(API_KEY_STORE_KEY, apiKey).catch(() => {});
    apiKeyRef.current = apiKey;
  }, [apiKey]);

  const doTransmit = useCallback(async (): Promise<boolean> => {
    const s = sensorRef.current;
    const sim = simulatorRef.current;
    const r = riskRef.current;
    const url = `${backendUrlRef.current}${DEFAULT_INGEST_PATH}`;
    const startMs = Date.now();

    const { light, dark } = luxToLightDark(s.luxValue ?? (sim.nightMode ? 0 : 200));

    const payload = buildPayload(
      {
        lat: s.lat,
        lng: s.lng,
        gpsStatus: s.gpsStatus,
        sats: s.sats,
        temp: s.pressureHPa
          ? Math.round((15 - 44330 * (1 - Math.pow(s.pressureHPa / 1013.25, 0.1903)) * 0.0065) * 10) / 10
          : 22,
        humidity: sim.humidity,
        light: sim.nightMode ? 0 : light,
        dark: sim.nightMode ? 1 : dark,
        water: sim.water,
        distance: waterToDistance(sim.water),
        rainAnalog: sim.rainAnalog,
        raining: rainAnalogToBoolean(sim.rainAnalog),
      },
      { alert: r.alert, score: r.score },
      { deviceId: deviceIdRef.current || 'mobile-simulator' },
    );

    const entryId = ++_logIdCounter;
    const timestamp = new Date().toISOString();

    // Add pending entry
    setLog((prev) => [
      {
        id: entryId,
        timestamp,
        status: 'pending',
        alert: r.alert,
        water: sim.water,
        riskScore: r.score,
        ms: 0,
      },
      ...prev.slice(0, MAX_LOG_ENTRIES - 1),
    ]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (apiKeyRef.current) {
        headers['X-API-Key'] = apiKeyRef.current;
        headers['X-RiverWatch-Key'] = apiKeyRef.current;
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const ms = Date.now() - startMs;
      const ok = resp.ok;

      setLog((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, status: ok ? 'ok' : 'error', httpStatus: resp.status, ms }
            : e,
        ),
      );

      if (ok) {
        setTxCount((c) => c + 1);
        setIsConnected(true);
        setLastTxTime(new Date().toLocaleTimeString());
      } else {
        setErrorCount((c) => c + 1);
      }
      return ok;
    } catch (err) {
      const ms = Date.now() - startMs;
      setLog((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, status: 'error', ms } : e,
        ),
      );
      setErrorCount((c) => c + 1);
      setIsConnected(false);
      return false;
    }
  }, []);

  // Periodic transmit loop
  useEffect(() => {
    if (!isRunning) return;
    doTransmit(); // send immediately on start
    const timer = setInterval(doTransmit, intervalMs);
    return () => clearInterval(timer);
  }, [isRunning, intervalMs, doTransmit]);

  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const resp = await fetch(`${backendUrlRef.current}/api/status`);
      const ok = resp.ok;
      setIsConnected(ok);
      return ok;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  return {
    isRunning,
    isConnected,
    lastTxTime,
    txCount,
    errorCount,
    log,
    intervalMs,
    backendUrl,
    apiKey,
    startTransmitting: () => setIsRunning(true),
    stopTransmitting: () => setIsRunning(false),
    setIntervalMs,
    setBackendUrl,
    setApiKey,
    testConnection,
    sendNow: async () => { await doTransmit(); },
  };
}
