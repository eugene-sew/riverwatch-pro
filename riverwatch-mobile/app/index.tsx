import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from './_layout';
import { AlertBanner } from '../components/AlertBanner';
import { RiskGauge } from '../components/RiskGauge';
import { SensorCard } from '../components/SensorCard';
import { TransmitLog } from '../components/TransmitLog';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { luxToLightDark } from '../utils/payload';

// Central SOS & Pusher Integrations
import { useSOS } from '../hooks/useSOS';
import { usePusherMobile } from '../hooks/usePusherMobile';
import { SOSButton } from '../components/SOSButton';
import { SOSModal } from '../components/SOSModal';
import { AlertBannerPusher } from '../components/AlertBannerPusher';

export default function DashboardScreen() {
  const { sensors, simulator, risk, transmitter } = useApp();

  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerData, setBannerData] = useState<any>(null);

  const {
    sosState,
    countdown,
    coords,
    startCountdown,
    cancelCountdown,
    resolveSOS,
  } = useSOS();

  usePusherMobile({
    onAlert: (data) => {
      setBannerData(data);
      setBannerVisible(true);
    },
    onSOSResolved: (data) => {
      resolveSOS();
    },
  });

  const { light, dark } = luxToLightDark(sensors.luxValue ?? (simulator.nightMode ? 0 : 200));
  const isDay = !simulator.nightMode && light === 1;

  // Derive temperature from barometer or fallback
  const temp = sensors.pressureHPa !== null
    ? Math.round((15 - 44330 * (1 - Math.pow(sensors.pressureHPa / 1013.25, 0.1903)) * 0.0065) * 10) / 10
    : 22;

  const raining = simulator.rainAnalog < 2500;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header status */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.deviceTitle}>🛰️ RiverWatch PRO</Text>
          <Text style={styles.deviceSub}>Mobile Simulator · {simulator.autoSimEnabled ? `Auto: ${simulator.currentPhase}` : 'Manual'}</Text>
        </View>
        <ConnectionStatus
          isConnected={transmitter.isConnected}
          isRunning={transmitter.isRunning}
          txCount={transmitter.txCount}
          errorCount={transmitter.errorCount}
        />
      </View>

      {/* Alert Banner */}
      <AlertBanner risk={risk} water={simulator.water} />

      {/* Gauge + TX Button row */}
      <View style={styles.gaugeRow}>
        <RiskGauge score={risk.score} />
        <View style={styles.gaugeActions}>
          <Pressable
            style={[styles.txButton, transmitter.isRunning ? styles.txButtonStop : styles.txButtonStart]}
            onPress={transmitter.isRunning ? transmitter.stopTransmitting : transmitter.startTransmitting}
          >
            <Ionicons
              name={transmitter.isRunning ? 'stop-circle' : 'radio'}
              size={22}
              color={transmitter.isRunning ? '#ff3b1e' : '#00e5b0'}
            />
            <Text style={[styles.txButtonText, { color: transmitter.isRunning ? '#ff3b1e' : '#00e5b0' }]}>
              {transmitter.isRunning ? 'STOP TX' : 'START TX'}
            </Text>
          </Pressable>

          <Pressable style={styles.nowButton} onPress={transmitter.sendNow}>
            <Ionicons name="send" size={16} color="#6b7fa3" />
            <Text style={styles.nowButtonText}>Send Now</Text>
          </Pressable>

          <View style={styles.txStats}>
            <Text style={styles.txStatLabel}>Sent: <Text style={styles.txStatVal}>{transmitter.txCount}</Text></Text>
            <Text style={styles.txStatLabel}>Errors: <Text style={[styles.txStatVal, { color: transmitter.errorCount > 0 ? '#ff3b1e' : '#4a5568' }]}>{transmitter.errorCount}</Text></Text>
            {transmitter.lastTxTime && (
              <Text style={styles.txStatLabel}>Last: <Text style={styles.txStatVal}>{transmitter.lastTxTime}</Text></Text>
            )}
          </View>
        </View>
      </View>

      {/* Sensor grid */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionText}>SENSOR READINGS</Text>
      </View>

      <View style={styles.cardRow}>
        <SensorCard
          label="Water Level"
          value={simulator.water}
          unit="cm"
          icon="💧"
          accentColor="#4da8ff"
          subtitle="HC-SR04 equiv."
        />
        <SensorCard
          label="Rise Rate"
          value={risk.riseRate}
          unit="cm/min"
          icon="📈"
          accentColor={risk.riseRate > 2 ? '#ff3b1e' : risk.riseRate > 0.5 ? '#ff8c00' : '#00e5b0'}
          subtitle={risk.etaMinutes !== null ? `ETA ${risk.etaMinutes.toFixed(1)}min` : 'Stable'}
        />
      </View>

      <View style={styles.cardRow}>
        <SensorCard
          label="Temperature"
          value={temp}
          unit="°C"
          icon="🌡️"
          accentColor="#ff8c00"
          subtitle={sensors.baroAvailable ? 'Barometer' : 'Estimated'}
        />
        <SensorCard
          label="Humidity"
          value={simulator.humidity}
          unit="%"
          icon="💨"
          accentColor="#a78bfa"
          subtitle="Simulated"
        />
      </View>

      <View style={styles.cardRow}>
        <SensorCard
          label="Rain"
          value={raining ? 'YES' : 'NO'}
          icon="🌧️"
          accentColor={raining ? '#4da8ff' : '#4a5568'}
          subtitle={`ADC: ${Math.round(simulator.rainAnalog)}`}
        />
        <SensorCard
          label="Light"
          value={isDay ? 'DAY' : 'NIGHT'}
          icon={isDay ? '☀️' : '🌙'}
          accentColor={isDay ? '#f5d800' : '#a78bfa'}
          subtitle={sensors.lightAvailable ? `${sensors.luxValue?.toFixed(0)} lux` : 'Manual mode'}
        />
      </View>

      <View style={styles.cardRow}>
        <SensorCard
          label="GPS"
          value={sensors.gpsStatus === 1 ? 'FIX' : 'NO FIX'}
          icon="📍"
          accentColor={sensors.gpsStatus === 1 ? '#00e5b0' : '#4a5568'}
          subtitle={sensors.lat !== null ? `${sensors.lat?.toFixed(4)}°, ${sensors.lng?.toFixed(4)}°` : 'No location'}
        />
        <SensorCard
          label="Satellites"
          value={sensors.sats}
          icon="🛰️"
          accentColor="#00e5b0"
          subtitle={sensors.gpsPermission ? 'GPS active' : 'Permission denied'}
        />
      </View>

      {/* SOS Button Trigger Section */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionText}>EMERGENCY PROTOCOL</Text>
      </View>
      <SOSButton
        state={sosState}
        countdown={countdown}
        onPressIn={startCountdown}
        onPressOut={cancelCountdown}
      />

      {/* Transmit log */}
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionText}>TRANSMISSION LOG</Text>
      </View>
      <TransmitLog entries={transmitter.log} />

      <View style={{ height: 20 }} />

      {/* Full-screen Emergency SOS Overlay */}
      <SOSModal
        visible={sosState === 'sending' || sosState === 'active' || sosState === 'failed'}
        state={sosState}
        coords={coords}
        onResolve={resolveSOS}
      />

      {/* Live Warning Banner from central registry */}
      <AlertBannerPusher
        visible={bannerVisible}
        alertData={bannerData}
        onClose={() => setBannerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070d1a',
  },
  content: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  deviceTitle: {
    color: '#e0e6f0',
    fontSize: 17,
    fontWeight: '800',
  },
  deviceSub: {
    color: '#4a5568',
    fontSize: 11,
    marginTop: 2,
  },
  gaugeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 16,
    backgroundColor: '#0d1526',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  gaugeActions: {
    flex: 1,
    gap: 10,
  },
  txButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  txButtonStart: {
    borderColor: '#00e5b0',
    backgroundColor: '#00e5b015',
  },
  txButtonStop: {
    borderColor: '#ff3b1e',
    backgroundColor: '#ff3b1e15',
  },
  txButtonText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1a2540',
    backgroundColor: '#0d1526',
  },
  nowButtonText: {
    color: '#6b7fa3',
    fontSize: 12,
    fontWeight: '600',
  },
  txStats: {
    gap: 2,
  },
  txStatLabel: {
    color: '#4a5568',
    fontSize: 11,
  },
  txStatVal: {
    color: '#6b7fa3',
    fontWeight: '700',
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 10,
  },
  sectionText: {
    color: '#4a5568',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
});
