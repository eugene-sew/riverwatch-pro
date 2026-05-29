/**
 * useSimulator — manages simulated sensor values with auto-simulation engine
 *
 * Manual controls: water level, rain analog, humidity
 * Auto-sim: cycles through 5 phases with smooth interpolation
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTO_SIM_PHASES, SCENARIO_PRESETS, SimPhase } from '../constants/thresholds';
import { resetRiskBuffer } from '../utils/riskEngine';

export interface SimulatorState {
  water: number;        // cm 0-100
  rainAnalog: number;   // ADC 0-4095
  humidity: number;     // % 0-100
  nightMode: boolean;   // override light/dark

  autoSimEnabled: boolean;
  currentPhase: string;
  phaseIndex: number;

  // Setters
  setWater: (v: number) => void;
  setRainAnalog: (v: number) => void;
  setHumidity: (v: number) => void;
  setNightMode: (v: boolean) => void;
  toggleAutoSim: () => void;
  loadPreset: (presetId: string) => void;
}

const TICK_MS = 500; // interpolation tick

export function useSimulator(): SimulatorState {
  const [water, setWaterRaw] = useState(12);
  const [rainAnalog, setRainAnalogRaw] = useState(3800);
  const [humidity, setHumidityRaw] = useState(48);
  const [nightMode, setNightMode] = useState(false);
  const [autoSimEnabled, setAutoSimEnabled] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Use refs so interval can access latest values without re-registering
  const waterRef = useRef(water);
  const rainRef = useRef(rainAnalog);
  const humidityRef = useRef(humidity);
  const phaseIndexRef = useRef(0);
  const phaseElapsedRef = useRef(0);
  const lastTickRef = useRef(Date.now());

  waterRef.current = water;
  rainRef.current = rainAnalog;
  humidityRef.current = humidity;

  const currentPhase = AUTO_SIM_PHASES[phaseIndex]?.name ?? 'Calm';

  const setWater = useCallback((v: number) => {
    setWaterRaw(Math.max(0, Math.min(100, v)));
  }, []);

  const setRainAnalog = useCallback((v: number) => {
    setRainAnalogRaw(Math.max(0, Math.min(4095, v)));
  }, []);

  const setHumidity = useCallback((v: number) => {
    setHumidityRaw(Math.max(0, Math.min(100, v)));
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setWater(preset.water);
    setRainAnalog(preset.rainAnalog);
    setHumidity(preset.humidity);
    resetRiskBuffer(); // clear trend history for clean restart
  }, []);

  const toggleAutoSim = useCallback(() => {
    setAutoSimEnabled((prev) => {
      if (!prev) {
        // Reset to phase 0 on start
        phaseIndexRef.current = 0;
        phaseElapsedRef.current = 0;
        lastTickRef.current = Date.now();
        setPhaseIndex(0);
        resetRiskBuffer();
      }
      return !prev;
    });
  }, []);

  // Auto-simulation interpolation loop
  useEffect(() => {
    if (!autoSimEnabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTickRef.current;
      lastTickRef.current = now;

      const phase: SimPhase = AUTO_SIM_PHASES[phaseIndexRef.current];
      phaseElapsedRef.current += delta;

      const t = Math.min(1, phaseElapsedRef.current / phase.durationMs);

      // Smooth lerp toward targets
      const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
      const eased = easeInOut(t);

      const newWater = lerp(waterRef.current, phase.targetWater, eased * 0.08);
      const newRain = lerp(rainRef.current, phase.targetRainAnalog, eased * 0.06);
      const newHumidity = lerp(humidityRef.current, phase.targetHumidity, eased * 0.06);

      setWater(newWater);
      setRainAnalog(newRain);
      setHumidity(newHumidity);

      // Advance phase
      if (phaseElapsedRef.current >= phase.durationMs) {
        const nextIndex = (phaseIndexRef.current + 1) % AUTO_SIM_PHASES.length;
        phaseIndexRef.current = nextIndex;
        phaseElapsedRef.current = 0;
        setPhaseIndex(nextIndex);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [autoSimEnabled]);

  return {
    water,
    rainAnalog,
    humidity,
    nightMode,
    autoSimEnabled,
    currentPhase,
    phaseIndex,
    setWater,
    setRainAnalog,
    setHumidity,
    setNightMode,
    toggleAutoSim,
    loadPreset,
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
