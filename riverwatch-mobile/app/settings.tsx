import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';

import { useApp } from './_layout';
import { DEFAULT_BACKEND_URL } from '../constants/thresholds';

const INTERVAL_OPTIONS = [
  { label: '5s', ms: 5_000 },
  { label: '10s', ms: 10_000 },
  { label: '15s', ms: 15_000 },
  { label: '30s', ms: 30_000 },
  { label: '60s', ms: 60_000 },
];

export default function SettingsScreen() {
  const { sensors, transmitter } = useApp();
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    try {
      const ok = await transmitter.testConnection();
      Alert.alert(
        ok ? '✅ Connected' : '❌ Connection Failed',
        ok
          ? `Successfully reached ${transmitter.backendUrl}`
          : `Could not reach ${transmitter.backendUrl}\n\nCheck the URL and your internet connection.`,
      );
    } finally {
      setTesting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* Backend Configuration */}
      <Text style={styles.sectionLabel}>BACKEND CONFIGURATION</Text>
      <View style={styles.card}>
        <Text style={styles.inputLabel}>Railway / Render URL</Text>
        <TextInput
          style={styles.input}
          value={transmitter.backendUrl}
          onChangeText={transmitter.setBackendUrl}
          placeholder={DEFAULT_BACKEND_URL}
          placeholderTextColor="#4a5568"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Text style={styles.inputLabel}>API Key (optional)</Text>
        <TextInput
          style={styles.input}
          value={transmitter.apiKey}
          onChangeText={transmitter.setApiKey}
          placeholder="Leave blank if not required"
          placeholderTextColor="#4a5568"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        <Pressable
          style={[styles.button, testing && styles.buttonDisabled]}
          onPress={testConnection}
          disabled={testing}
        >
          <Text style={styles.buttonText}>
            {testing ? 'Testing…' : '🔌 Test Connection'}
          </Text>
        </Pressable>
      </View>

      {/* Transmission Interval */}
      <Text style={styles.sectionLabel}>TRANSMISSION INTERVAL</Text>
      <View style={styles.card}>
        <View style={styles.intervalRow}>
          {INTERVAL_OPTIONS.map((opt) => (
            <Pressable
              key={opt.ms}
              style={[
                styles.intervalChip,
                transmitter.intervalMs === opt.ms && styles.intervalChipActive,
              ]}
              onPress={() => transmitter.setIntervalMs(opt.ms)}
            >
              <Text
                style={[
                  styles.intervalText,
                  transmitter.intervalMs === opt.ms && styles.intervalTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.cardSub}>
          Current: every {transmitter.intervalMs / 1000}s
          {transmitter.isRunning ? ' (active)' : ' (stopped)'}
        </Text>
      </View>

      {/* Sensor Permission Status */}
      <Text style={styles.sectionLabel}>SENSOR PERMISSIONS</Text>
      <View style={styles.card}>
        <PermRow
          label="📍 GPS / Location"
          granted={sensors.gpsPermission}
          detail={sensors.gpsStatus === 1 ? `Fix · ${sensors.sats} sats` : 'No fix'}
        />
        <PermRow
          label="📊 Barometer"
          granted={sensors.baroAvailable}
          detail={sensors.pressureHPa !== null ? `${sensors.pressureHPa} hPa` : 'Unavailable'}
        />
        <PermRow
          label="💡 Light Sensor"
          granted={sensors.lightAvailable}
          detail={sensors.luxValue !== null ? `${sensors.luxValue?.toFixed(0)} lux` : 'Android only'}
        />
      </View>

      {/* Device Info */}
      <Text style={styles.sectionLabel}>DEVICE INFO</Text>
      <View style={styles.card}>
        <InfoRow label="Model" value={Device.modelName ?? 'Unknown'} />
        <InfoRow label="OS" value={`${Device.osName} ${Device.osVersion}`} />
        <InfoRow label="Brand" value={Device.brand ?? 'Unknown'} />
        <InfoRow label="App Version" value={Application.nativeApplicationVersion ?? '1.0.0'} />
        <InfoRow label="Payload Source" value="mobile_simulator" mono />
      </View>

      {/* Stats */}
      <Text style={styles.sectionLabel}>SESSION STATS</Text>
      <View style={styles.card}>
        <InfoRow label="Transmissions" value={String(transmitter.txCount)} />
        <InfoRow label="Errors" value={String(transmitter.errorCount)} />
        <InfoRow label="Last TX" value={transmitter.lastTxTime ?? 'None'} />
      </View>

      {/* Emergency Section */}
      <Text style={styles.sectionLabel}>EMERGENCY SYSTEM</Text>
      <View style={styles.card}>
        <Pressable
          style={[styles.button, { borderColor: '#ef4444', backgroundColor: '#ef444415' }]}
          onPress={() => {
            Alert.alert(
              'Trigger Test SOS',
              'This will send a simulated test SOS packet directly to the active RiverWatch PRO central backend registry.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send Test',
                  style: 'destructive',
                  onPress: () => {
                    fetch(`${transmitter.backendUrl}/api/sos`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'X-RiverWatch-Key': transmitter.apiKey || 'riverwatch-demo',
                      },
                      body: JSON.stringify({
                        lat: 5.6037,
                        lng: -0.1870,
                        accuracy: 50,
                        deviceId: 'settings-test',
                        timestamp: new Date().toISOString(),
                        water: 0,
                        alert: 'SAFE',
                        message: 'TEST — DO NOT ACTION',
                      }),
                    })
                      .then(() => Alert.alert('Test SOS Sent', 'Check the dashboard.'))
                      .catch(() => Alert.alert('Failed', 'Could not reach backend.'));
                  },
                },
              ]
            );
          }}
        >
          <Text style={[styles.buttonText, { color: '#ef4444' }]}>⚠ Test SOS</Text>
        </Pressable>
        <InfoRow label="Pusher Cluster" value={process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'mt1'} />
        <InfoRow
          label="Pusher Key"
          value={process.env.EXPO_PUBLIC_PUSHER_KEY
            ? `****${process.env.EXPO_PUBLIC_PUSHER_KEY.slice(-4)}`
            : 'Not configured'}
          mono
        />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

function PermRow({ label, granted, detail }: { label: string; granted: boolean; detail?: string }) {
  return (
    <View style={styles.permRow}>
      <Text style={styles.permLabel}>{label}</Text>
      <View style={styles.permRight}>
        {detail ? <Text style={styles.permDetail}>{detail}</Text> : null}
        <View style={[styles.permBadge, { backgroundColor: granted ? '#00e5b020' : '#ff3b1e20', borderColor: granted ? '#00e5b0' : '#ff3b1e' }]}>
          <Text style={{ color: granted ? '#00e5b0' : '#ff3b1e', fontSize: 10, fontWeight: '700' }}>
            {granted ? 'OK' : 'DENIED'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.infoMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070d1a',
  },
  content: {
    padding: 16,
    gap: 0,
  },
  sectionLabel: {
    color: '#4a5568',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
    gap: 10,
    marginBottom: 4,
  },
  cardSub: {
    color: '#4a5568',
    fontSize: 12,
    marginTop: -4,
  },
  inputLabel: {
    color: '#6b7fa3',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: -4,
  },
  input: {
    backgroundColor: '#070d1a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a2540',
    color: '#e0e6f0',
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#00e5b015',
    borderWidth: 1,
    borderColor: '#00e5b0',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#00e5b0',
    fontWeight: '700',
    fontSize: 14,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  intervalChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a2540',
    backgroundColor: '#070d1a',
  },
  intervalChipActive: {
    borderColor: '#00e5b0',
    backgroundColor: '#00e5b015',
  },
  intervalText: {
    color: '#4a5568',
    fontWeight: '700',
    fontSize: 13,
  },
  intervalTextActive: {
    color: '#00e5b0',
  },
  permRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  permLabel: {
    color: '#e0e6f0',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  permRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permDetail: {
    color: '#4a5568',
    fontSize: 11,
  },
  permBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: '#6b7fa3',
    fontSize: 12,
    flex: 1,
  },
  infoValue: {
    color: '#e0e6f0',
    fontSize: 12,
    fontWeight: '600',
  },
  infoMono: {
    fontFamily: 'monospace',
    color: '#00e5b0',
  },
});
