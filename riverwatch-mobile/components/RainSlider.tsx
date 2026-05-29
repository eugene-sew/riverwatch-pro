import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { RAIN_ADC_THRESHOLDS } from '../constants/thresholds';

interface RainSliderProps {
  value: number;        // ADC 0-4095 (lower = more rain)
  onChange: (v: number) => void;
  disabled?: boolean;
}

function adcToIntensity(adc: number): { label: string; color: string; icon: string } {
  if (adc <= RAIN_ADC_THRESHOLDS.EXTREME) return { label: 'EXTREME', color: '#ff0055', icon: '🌊' };
  if (adc <= RAIN_ADC_THRESHOLDS.HEAVY)   return { label: 'HEAVY',   color: '#ff3b1e', icon: '🌧️' };
  if (adc <= RAIN_ADC_THRESHOLDS.MODERATE) return { label: 'MODERATE', color: '#ff8c00', icon: '🌦️' };
  if (adc <= RAIN_ADC_THRESHOLDS.LIGHT)   return { label: 'LIGHT',   color: '#f5d800', icon: '🌂' };
  return { label: 'DRY', color: '#00e5b0', icon: '☀️' };
}

export function RainSlider({ value, onChange, disabled }: RainSliderProps) {
  const { label, color, icon } = adcToIntensity(value);
  // Invert for display (0=dry → 100=heavy)
  const displayPct = Math.round(((4095 - value) / 4095) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>🌧️ Rain Intensity</Text>
        <View style={[styles.badge, { borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>{icon} {label}</Text>
        </View>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{displayPct}</Text>
        <Text style={styles.unit}>% intensity</Text>
      </View>
      <Text style={styles.adcText}>ADC: {Math.round(value)}</Text>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={4095}
        step={10}
        value={4095 - value}   // invert so right = more rain
        onValueChange={(v) => onChange(4095 - v)}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#1a2540"
        thumbTintColor={color}
        disabled={disabled}
      />
      <View style={styles.markers}>
        <Text style={styles.marker}>Dry</Text>
        <Text style={[styles.marker, { color: '#f5d800' }]}>Light</Text>
        <Text style={[styles.marker, { color: '#ff8c00' }]}>Moderate</Text>
        <Text style={[styles.marker, { color: '#ff3b1e' }]}>Heavy</Text>
        <Text style={[styles.marker, { color: '#ff0055' }]}>Extreme</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: '#6b7fa3',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
  },
  unit: {
    color: '#6b7fa3',
    fontSize: 14,
    marginBottom: 4,
  },
  adcText: {
    color: '#4a5568',
    fontSize: 10,
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  slider: {
    height: 40,
  },
  markers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  marker: {
    color: '#4a5568',
    fontSize: 9,
  },
});
