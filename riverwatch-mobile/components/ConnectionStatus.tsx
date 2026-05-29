import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConnectionStatusProps {
  isConnected: boolean;
  isRunning: boolean;
  txCount: number;
  errorCount: number;
}

export function ConnectionStatus({ isConnected, isRunning, txCount, errorCount }: ConnectionStatusProps) {
  const color = isConnected ? '#00e5b0' : '#ff3b1e';
  const icon = isConnected ? 'wifi' : 'wifi-outline';
  const label = isRunning
    ? isConnected
      ? 'LIVE'
      : 'RETRY'
    : 'IDLE';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: isRunning ? color : '#4a5568' }]} />
      <Ionicons name={icon as any} size={14} color={isRunning ? color : '#4a5568'} />
      <Text style={[styles.label, { color: isRunning ? color : '#4a5568' }]}>{label}</Text>
      {isRunning && (
        <Text style={styles.counts}>
          {txCount}↑ {errorCount > 0 ? `${errorCount}✗` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#0d1526',
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  counts: {
    color: '#4a5568',
    fontSize: 10,
    marginLeft: 2,
  },
});
