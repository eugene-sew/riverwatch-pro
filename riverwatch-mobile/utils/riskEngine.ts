/**
 * Risk Engine — TypeScript port of ESP32 C++ risk scoring firmware
 *
 * Computes a 0-100 risk score from sensor readings using:
 *  - Water level (50% weight)
 *  - Rise rate trend via linear regression over rolling buffer (30% weight)
 *  - Rain intensity (15% weight)
 *  - Temperature anomaly (5% weight)
 */

import {
  WATER_THRESHOLDS,
  RISE_RATE_THRESHOLDS,
  RISK_WEIGHTS,
  RISK_BUFFER_SIZE,
  RAIN_ADC_THRESHOLDS,
} from '../constants/thresholds';
import { scoreToAlertLevel, AlertLevel } from '../constants/alertLevels';

export interface RiskInput {
  water: number;       // cm
  rainAnalog: number;  // ADC 0-4095 (lower = wetter)
  temp: number;        // °C
  humidity: number;    // %
}

export interface RiskResult {
  score: number;         // 0-100
  alert: AlertLevel;
  riseRate: number;      // cm/min
  etaMinutes: number | null; // minutes until FLOOD threshold, null if not rising
  waterComponent: number;
  riseRateComponent: number;
  rainComponent: number;
  tempComponent: number;
}

interface BufferEntry {
  time: number;  // Date.now()
  water: number;
}

/** Rolling buffer for trend analysis */
const _buffer: BufferEntry[] = [];

/** Add a reading to the rolling buffer */
function addToBuffer(water: number): void {
  const now = Date.now();
  _buffer.push({ time: now, water });
  if (_buffer.length > RISK_BUFFER_SIZE) {
    _buffer.shift();
  }
}

/**
 * Linear regression over buffer to get rise rate (cm/min)
 * Returns 0 if fewer than 2 readings available.
 */
function computeRiseRate(): number {
  if (_buffer.length < 2) return 0;

  const n = _buffer.length;
  const t0 = _buffer[0].time;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (const entry of _buffer) {
    const x = (entry.time - t0) / 60_000; // minutes
    const y = entry.water;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (Math.abs(denom) < 1e-9) return 0;

  const slope = (n * sumXY - sumX * sumY) / denom;
  return Math.round(slope * 100) / 100; // cm/min, 2dp
}

/** Score water level component (0-100) */
function scoreWater(water: number): number {
  if (water >= WATER_THRESHOLDS.CRITICAL) return 100;
  if (water >= WATER_THRESHOLDS.FLOOD) {
    return 75 + ((water - WATER_THRESHOLDS.FLOOD) / (WATER_THRESHOLDS.CRITICAL - WATER_THRESHOLDS.FLOOD)) * 25;
  }
  if (water >= WATER_THRESHOLDS.WARNING) {
    return 50 + ((water - WATER_THRESHOLDS.WARNING) / (WATER_THRESHOLDS.FLOOD - WATER_THRESHOLDS.WARNING)) * 25;
  }
  if (water >= WATER_THRESHOLDS.WATCH) {
    return 25 + ((water - WATER_THRESHOLDS.WATCH) / (WATER_THRESHOLDS.WARNING - WATER_THRESHOLDS.WATCH)) * 25;
  }
  return (water / WATER_THRESHOLDS.WATCH) * 25;
}

/** Score rise rate component (0-100) */
function scoreRiseRate(riseRate: number): number {
  if (riseRate <= 0) return 0;
  if (riseRate >= RISE_RATE_THRESHOLDS.EXTREME) return 100;
  if (riseRate >= RISE_RATE_THRESHOLDS.RAPID) {
    return 75 + ((riseRate - RISE_RATE_THRESHOLDS.RAPID) / (RISE_RATE_THRESHOLDS.EXTREME - RISE_RATE_THRESHOLDS.RAPID)) * 25;
  }
  if (riseRate >= RISE_RATE_THRESHOLDS.ELEVATED) {
    return 25 + ((riseRate - RISE_RATE_THRESHOLDS.ELEVATED) / (RISE_RATE_THRESHOLDS.RAPID - RISE_RATE_THRESHOLDS.ELEVATED)) * 50;
  }
  return (riseRate / RISE_RATE_THRESHOLDS.ELEVATED) * 25;
}

/** Score rain intensity from ADC reading (0-100, lower ADC = higher rain) */
function scoreRain(rainAnalog: number): number {
  // Invert: lower ADC = more rain
  const rain = Math.max(0, RAIN_ADC_THRESHOLDS.DRY - rainAnalog);
  const max = RAIN_ADC_THRESHOLDS.DRY - RAIN_ADC_THRESHOLDS.EXTREME;
  return Math.min(100, (rain / max) * 100);
}

/** Score temperature anomaly (0-100, extreme cold or heat = higher score) */
function scoreTemp(temp: number): number {
  if (temp < 5) return 60;   // near-freezing → snowmelt risk
  if (temp > 38) return 40;  // heat wave → evapotranspiration reduced
  return 10;                 // normal
}

/** Compute ETA until FLOOD threshold at current rise rate */
function computeETA(water: number, riseRate: number): number | null {
  if (riseRate <= 0) return null;
  const gap = WATER_THRESHOLDS.FLOOD - water;
  if (gap <= 0) return 0;
  return Math.round((gap / riseRate) * 10) / 10; // minutes, 1dp
}

/**
 * Main entry point. Call once per reading cycle.
 * Adds to rolling buffer and returns RiskResult.
 */
export function computeRisk(input: RiskInput): RiskResult {
  addToBuffer(input.water);

  const riseRate = computeRiseRate();

  const waterComponent = scoreWater(input.water);
  const riseRateComponent = scoreRiseRate(riseRate);
  const rainComponent = scoreRain(input.rainAnalog);
  const tempComponent = scoreTemp(input.temp);

  const rawScore =
    waterComponent * RISK_WEIGHTS.waterLevel +
    riseRateComponent * RISK_WEIGHTS.riseRate +
    rainComponent * RISK_WEIGHTS.rainIntensity +
    tempComponent * RISK_WEIGHTS.temperature;

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));
  const alert = scoreToAlertLevel(score);
  const etaMinutes = computeETA(input.water, riseRate);

  return {
    score,
    alert,
    riseRate,
    etaMinutes,
    waterComponent,
    riseRateComponent,
    rainComponent,
    tempComponent,
  };
}

/** Reset rolling buffer (e.g., when loading a scenario preset) */
export function resetRiskBuffer(): void {
  _buffer.splice(0, _buffer.length);
}
