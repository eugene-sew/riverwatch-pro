/**
 * useSensors — aggregates all available phone sensors
 *
 * Sources:
 *   GPS     → expo-location (lat, lng, sats approximation)
 *   Light   → expo-sensors LightSensor (lux)
 *   Baro    → expo-sensors Barometer (hPa → temp approximation)
 *   Accel   → expo-sensors Accelerometer (available check only)
 */

import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { Barometer, LightSensor } from 'expo-sensors';
import { Platform } from 'react-native';

export interface SensorReadings {
  // GPS
  lat: number | null;
  lng: number | null;
  gpsStatus: number;
  sats: number;
  gpsPermission: boolean;

  // Barometer
  pressureHPa: number | null;
  baroAvailable: boolean;

  // Light
  luxValue: number | null;
  lightAvailable: boolean;

  // Status
  isReady: boolean;
}

const DEFAULT_READINGS: SensorReadings = {
  lat: null,
  lng: null,
  gpsStatus: 0,
  sats: 0,
  gpsPermission: false,
  pressureHPa: null,
  baroAvailable: false,
  luxValue: null,
  lightAvailable: false,
  isReady: false,
};

export function useSensors(): SensorReadings {
  const [readings, setReadings] = useState<SensorReadings>(DEFAULT_READINGS);
  const baroSubRef = useRef<any>(null);
  const lightSubRef = useRef<any>(null);
  const locationSubRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function initSensors() {
      // ─── GPS ──────────────────────────────────────────────────
      let gpsPermission = false;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        gpsPermission = status === 'granted';
      } catch {}

      if (gpsPermission) {
        try {
          locationSubRef.current = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10_000,
              distanceInterval: 5,
            },
            (loc) => {
              if (!mounted) return;
              setReadings((prev) => ({
                ...prev,
                lat: loc.coords.latitude,
                lng: loc.coords.longitude,
                gpsStatus: 1,
                sats: Math.floor(Math.random() * 4) + 5, // 5-8 sats simulated
              }));
            },
          );
        } catch {}
      }

      // ─── Barometer ────────────────────────────────────────────
      let baroAvailable = false;
      try {
        baroAvailable = await Barometer.isAvailableAsync();
      } catch {}

      if (baroAvailable) {
        baroSubRef.current = Barometer.addListener((data) => {
          if (!mounted) return;
          setReadings((prev) => ({
            ...prev,
            pressureHPa: Math.round(data.pressure * 10) / 10,
            baroAvailable: true,
          }));
        });
        Barometer.setUpdateInterval(15_000);
      }

      // ─── Light Sensor ─────────────────────────────────────────
      let lightAvailable = false;
      // LightSensor only available on Android
      if (Platform.OS === 'android') {
        try {
          lightAvailable = await LightSensor.isAvailableAsync();
        } catch {}
      }

      if (lightAvailable) {
        lightSubRef.current = LightSensor.addListener((data) => {
          if (!mounted) return;
          setReadings((prev) => ({
            ...prev,
            luxValue: data.illuminance,
            lightAvailable: true,
          }));
        });
        LightSensor.setUpdateInterval(5_000);
      }

      if (mounted) {
        setReadings((prev) => ({
          ...prev,
          gpsPermission,
          baroAvailable,
          lightAvailable,
          isReady: true,
        }));
      }
    }

    initSensors();

    return () => {
      mounted = false;
      baroSubRef.current?.remove();
      lightSubRef.current?.remove();
      locationSubRef.current?.remove();
    };
  }, []);

  return readings;
}
