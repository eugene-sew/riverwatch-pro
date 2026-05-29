import React from 'react';
import { Modal, StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SOSCoords, SOSState } from '../hooks/useSOS';

interface SOSModalProps {
  visible: boolean;
  state: SOSState;
  coords: SOSCoords | null;
  onResolve: () => void;
}

export function SOSModal({ visible, state, coords, onResolve }: SOSModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Siren Warning Icon */}
        <View style={styles.header}>
          <Ionicons name="alert-circle" size={80} color="#ef4444" style={styles.icon} />
          <Text style={styles.alertTitle}>🚨 EMERGENCY BEACON</Text>
        </View>

        {/* State Indicators */}
        <View style={styles.body}>
          {state === 'sending' && (
            <View style={styles.statusBox}>
              <ActivityIndicator size="large" color="#f59e0b" style={{ marginBottom: 12 }} />
              <Text style={styles.statusText}>TRANSMITTING ENCRYPTED BEACON...</Text>
            </View>
          )}

          {state === 'failed' && (
            <View style={styles.statusBox}>
              <Ionicons name="warning" size={32} color="#dc2626" style={{ marginBottom: 12 }} />
              <Text style={[styles.statusText, { color: '#ef4444' }]}>
                BEACON PACKET LOST — RETRYING...
              </Text>
            </View>
          )}

          {state === 'active' && (
            <View style={styles.statusBox}>
              <Ionicons name="checkmark-circle" size={32} color="#00d4aa" style={{ marginBottom: 12 }} />
              <Text style={[styles.statusText, { color: '#00d4aa' }]}>
                BROADCAST ACTIVE — STATION DISPATCHED
              </Text>
            </View>
          )}

          {/* Coordinates Block */}
          {coords ? (
            <View style={styles.coordsBox}>
              <Text style={styles.coordsLabel}>LIVE GPS COORDINATES</Text>
              <Text style={styles.coordsText}>
                {coords.lat.toFixed(6)}°, {coords.lng.toFixed(6)}°
              </Text>
              
              <View
                style={[
                  styles.accuracyPill,
                  {
                    borderColor: coords.accuracy < 10 ? '#00d4aa' : '#f59e0b',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.accuracyText,
                    {
                      color: coords.accuracy < 10 ? '#00d4aa' : '#f59e0b',
                    },
                  ]}
                >
                  GPS DEV: ±{coords.accuracy.toFixed(1)}m
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.coordsBox}>
              <ActivityIndicator size="small" color="#e2e8f0" style={{ marginBottom: 8 }} />
              <Text style={styles.coordsLabel}>LOCKING POSITION SENSORS...</Text>
            </View>
          )}

          <Text style={styles.footerWarning}>
            * This mobile station is actively reporting coordinates to the RiverWatch PRO central registry.
          </Text>
        </View>

        {/* Resolve SOS Actions */}
        <View style={styles.actions}>
          <Pressable
            onPress={onResolve}
            style={({ pressed }) => [
              styles.resolveBtn,
              {
                opacity: pressed ? 0.85 : 1.0,
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
            <Text style={styles.resolveBtnText}>RESOLVE EMERGENCY SOS</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0202',
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  icon: {
    textShadowColor: 'rgba(239, 68, 68, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 16,
  },
  alertTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  body: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 24,
  },
  statusBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  coordsBox: {
    backgroundColor: '#160808',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a1010',
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  coordsLabel: {
    color: '#a0aec0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  coordsText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    fontFamily: 'Courier',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  accuracyPill: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  accuracyText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerWarning: {
    color: '#718096',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 14,
  },
  actions: {
    marginBottom: 40,
  },
  resolveBtn: {
    backgroundColor: '#00d4aa',
    borderRadius: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#00d4aa',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  resolveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
