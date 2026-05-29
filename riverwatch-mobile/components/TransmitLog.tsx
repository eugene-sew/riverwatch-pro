import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TransmitLogEntry } from '../hooks/useTransmitter';
import { getAlertLevelDef } from '../constants/alertLevels';

interface TransmitLogProps {
  entries: TransmitLogEntry[];
}

function StatusDot({ status }: { status: TransmitLogEntry['status'] }) {
  const color = status === 'ok' ? '#00e5b0' : status === 'error' ? '#ff3b1e' : '#f5d800';
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

export function TransmitLog({ entries }: TransmitLogProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No transmissions yet.</Text>
        <Text style={styles.emptySubtext}>Start transmitting to see log.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📡 Transmit Log</Text>
      {entries.slice(0, 8).map((entry) => {
        const alertDef = getAlertLevelDef(entry.alert);
        const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return (
          <View key={entry.id} style={styles.row}>
            <StatusDot status={entry.status} />
            <Text style={styles.time}>{time}</Text>
            <View style={[styles.alertBadge, { borderColor: alertDef.color }]}>
              <Text style={[styles.alertText, { color: alertDef.color }]}>
                {entry.alert}
              </Text>
            </View>
            <Text style={styles.water}>{entry.water.toFixed(0)}cm</Text>
            {entry.httpStatus ? (
              <Text style={[styles.http, entry.status === 'ok' ? styles.httpOk : styles.httpErr]}>
                {entry.httpStatus}
              </Text>
            ) : entry.status === 'pending' ? (
              <Text style={styles.pending}>…</Text>
            ) : null}
            {entry.ms > 0 && (
              <Text style={styles.ms}>{entry.ms}ms</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1a2540',
    gap: 8,
  },
  title: {
    color: '#6b7fa3',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  time: {
    color: '#4a5568',
    fontSize: 11,
    fontFamily: 'monospace',
    width: 72,
  },
  alertBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  alertText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  water: {
    color: '#6b7fa3',
    fontSize: 11,
    width: 36,
    textAlign: 'right',
  },
  http: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  httpOk: { color: '#00e5b0' },
  httpErr: { color: '#ff3b1e' },
  pending: { color: '#f5d800', fontSize: 14 },
  ms: {
    color: '#4a5568',
    fontSize: 10,
    marginLeft: 'auto' as any,
  },
  empty: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2540',
    gap: 4,
  },
  emptyText: {
    color: '#6b7fa3',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#4a5568',
    fontSize: 12,
  },
});
