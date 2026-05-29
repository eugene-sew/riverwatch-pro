/**
 * useRiskEngine — reactive wrapper around the risk engine utility
 * Recomputes whenever sensor or simulator state changes.
 */

import { useMemo } from 'react';
import { computeRisk, RiskResult } from '../utils/riskEngine';
import { SensorReadings } from './useSensors';
import { SimulatorState } from './useSimulator';
import { luxToLightDark } from '../utils/payload';

export interface RiskEngineOutput extends RiskResult {}

export function useRiskEngine(
  sensors: SensorReadings,
  simulator: SimulatorState,
): RiskEngineOutput {
  return useMemo(() => {
    // Derive temperature from barometer pressure if available
    // Standard atmosphere: 15°C at sea level, -0.65°C per 100m altitude
    let temp = 22; // fallback default
    if (sensors.pressureHPa !== null) {
      const altitude = 44330 * (1 - Math.pow(sensors.pressureHPa / 1013.25, 0.1903));
      temp = 15 - altitude * 0.0065;
      temp = Math.round(temp * 10) / 10;
    }

    return computeRisk({
      water: simulator.water,
      rainAnalog: simulator.rainAnalog,
      temp,
      humidity: simulator.humidity,
    });
  }, [simulator.water, simulator.rainAnalog, simulator.humidity, sensors.pressureHPa]);
}
