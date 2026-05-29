import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { WATER_THRESHOLDS } from '../constants/thresholds';
import { scoreToAlertLevel, getAlertLevelDef } from '../constants/alertLevels';

interface WaterLevelSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

function waterToZoneColor(water: number): string {
  if (water >= WATER_THRESHOLDS.CRITICAL) return '#ff0055';
  if (water >= WATER_THRESHOLDS.FLOOD) return '#ff3b1e';
  if (water >= WATER_THRESHOLDS.WARNING) return '#ff8c00';
  if (water >= WATER_THRESHOLDS.WATCH) return '#f5d800';
  return '#00e5b0';
}

function waterToZoneLabel(water: number): string {
  if (water >= WATER_THRESHOLDS.CRITICAL) return 'CRITICAL';
  if (water >= WATER_THRESHOLDS.FLOOD) return 'FLOOD';
  if (water >= WATER_THRESHOLDS.WARNING) return 'WARNING';
  if (water >= WATER_THRESHOLDS.WATCH) return 'WATCH';
  return 'SAFE';
}

export function WaterLevelSlider({ value, onChange, disabled }: WaterLevelSliderProps) {
  const color = waterToZoneColor(value);
  const zoneLabel = waterToZoneLabel(value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>💧 Water Level</Text>
        <View style={[styles.badge, { borderColor: color }]}>
          <Text style={[styles.badgeText, { color }]}>{zoneLabel}</Text>
        </View>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value.toFixed(1)}</Text>
        <Text style={styles.unit}>cm</Text>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={100}
        step={0.5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#1a2540"
        thumbTintColor={color}
        disabled={disabled}
      />
      <View style={styles.markers}>
        <Text style={styles.marker}>0</Text>
        <Text style={[styles.marker, { color: '#f5d800' }]}>30↑</Text>
        <Text style={[styles.marker, { color: '#ff8c00' }]}>60↑</Text>
        <Text style={[styles.marker, { color: '#ff3b1e' }]}>80↑</Text>
        <Text style={styles.marker}>100cm</Text>
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
    gap: 4,
    marginBottom: 8,
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
