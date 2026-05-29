import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

interface SensorCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  icon?: string;
  accentColor?: string;
  style?: ViewStyle;
}

export function SensorCard({
  label,
  value,
  unit,
  subtitle,
  icon,
  accentColor = '#00e5b0',
  style,
}: SensorCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Text style={styles.label}>{icon ? `${icon} ${label}` : label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color: accentColor }]}>
          {typeof value === 'number' ? value.toFixed?.(value >= 100 ? 0 : 1) ?? value : value}
        </Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    flex: 1,
    minWidth: 100,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  label: {
    color: '#6b7fa3',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  value: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  unit: {
    color: '#6b7fa3',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  subtitle: {
    color: '#4a5568',
    fontSize: 11,
    marginTop: 2,
  },
});
