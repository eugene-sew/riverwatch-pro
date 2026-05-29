import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { useApp } from './_layout';
import { WaterLevelSlider } from '../components/WaterLevelSlider';
import { RainSlider } from '../components/RainSlider';
import { SCENARIO_PRESETS, AUTO_SIM_PHASES } from '../constants/thresholds';
import Slider from '@react-native-community/slider';

export default function SimulateScreen() {
  const { simulator, risk } = useApp();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Auto-Simulation Engine */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>⚡ Auto-Simulation Engine</Text>
          <Switch
            value={simulator.autoSimEnabled}
            onValueChange={simulator.toggleAutoSim}
            thumbColor={simulator.autoSimEnabled ? '#00e5b0' : '#4a5568'}
            trackColor={{ false: '#1a2540', true: '#00e5b040' }}
          />
        </View>
        <Text style={styles.cardSub}>
          {simulator.autoSimEnabled
            ? `Phase ${simulator.phaseIndex + 1}/5: ${simulator.currentPhase}`
            : 'Disabled — manual controls active'}
        </Text>

        {/* Phase indicator */}
        <View style={styles.phases}>
          {AUTO_SIM_PHASES.map((phase, i) => (
            <View
              key={phase.name}
              style={[
                styles.phaseChip,
                i === simulator.phaseIndex && simulator.autoSimEnabled && styles.phaseChipActive,
              ]}
            >
              <Text
                style={[
                  styles.phaseText,
                  i === simulator.phaseIndex && simulator.autoSimEnabled && styles.phaseTextActive,
                ]}
              >
                {phase.name}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Night Mode Toggle */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>🌙 Night Mode</Text>
            <Text style={styles.cardSub}>Forces dark = 1, light = 0 in payload</Text>
          </View>
          <Switch
            value={simulator.nightMode}
            onValueChange={simulator.setNightMode}
            thumbColor={simulator.nightMode ? '#a78bfa' : '#4a5568'}
            trackColor={{ false: '#1a2540', true: '#a78bfa40' }}
          />
        </View>
      </View>

      {/* Sliders */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MANUAL CONTROLS</Text>
      </View>

      <WaterLevelSlider
        value={simulator.water}
        onChange={simulator.setWater}
        disabled={simulator.autoSimEnabled}
      />

      <RainSlider
        value={simulator.rainAnalog}
        onChange={simulator.setRainAnalog}
        disabled={simulator.autoSimEnabled}
      />

      {/* Humidity Slider */}
      <View style={[styles.card, { marginBottom: 12 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>💨 Humidity</Text>
          <Text style={styles.valueText}>{simulator.humidity.toFixed(0)}%</Text>
        </View>
        <Slider
          style={{ height: 40 }}
          minimumValue={0}
          maximumValue={100}
          step={1}
          value={simulator.humidity}
          onValueChange={simulator.setHumidity}
          minimumTrackTintColor="#a78bfa"
          maximumTrackTintColor="#1a2540"
          thumbTintColor="#a78bfa"
          disabled={simulator.autoSimEnabled}
        />
      </View>

      {/* Risk Summary */}
      <View style={styles.riskRow}>
        <View style={styles.riskItem}>
          <Text style={styles.riskLabel}>Score</Text>
          <Text style={[styles.riskValue, { color: '#00e5b0' }]}>{risk.score}</Text>
        </View>
        <View style={styles.riskItem}>
          <Text style={styles.riskLabel}>Alert</Text>
          <Text style={[styles.riskValue, { color: '#ff8c00' }]}>{risk.alert}</Text>
        </View>
        <View style={styles.riskItem}>
          <Text style={styles.riskLabel}>Rise Rate</Text>
          <Text style={[styles.riskValue, { color: '#4da8ff' }]}>{risk.riseRate.toFixed(2)}</Text>
        </View>
      </View>

      {/* Scenario Presets */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>SCENARIO PRESETS</Text>
      </View>

      <View style={styles.presets}>
        {SCENARIO_PRESETS.map((preset) => (
          <Pressable
            key={preset.id}
            style={({ pressed }) => [
              styles.preset,
              pressed && styles.presetPressed,
            ]}
            onPress={() => {
              if (simulator.autoSimEnabled) simulator.toggleAutoSim(); // turn off auto-sim
              simulator.loadPreset(preset.id);
            }}
          >
            <Text style={styles.presetIcon}>{preset.icon}</Text>
            <Text style={styles.presetName}>{preset.name}</Text>
            <Text style={styles.presetDesc}>{preset.description}</Text>
            <Text style={styles.presetStats}>
              W:{preset.water}cm · H:{preset.humidity}%
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: 20 }} />
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
  card: {
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1a2540',
    marginBottom: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#e0e6f0',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    color: '#4a5568',
    fontSize: 12,
  },
  valueText: {
    color: '#a78bfa',
    fontSize: 22,
    fontWeight: '800',
  },
  phases: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  phaseChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#0d1526',
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  phaseChipActive: {
    borderColor: '#00e5b0',
    backgroundColor: '#00e5b015',
  },
  phaseText: {
    color: '#4a5568',
    fontSize: 11,
    fontWeight: '600',
  },
  phaseTextActive: {
    color: '#00e5b0',
  },
  section: {
    marginTop: 4,
    marginBottom: 10,
  },
  sectionLabel: {
    color: '#4a5568',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  riskRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  riskItem: {
    flex: 1,
    backgroundColor: '#0d1526',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a2540',
  },
  riskLabel: {
    color: '#4a5568',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  riskValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  preset: {
    width: '47%',
    backgroundColor: '#0d1526',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1a2540',
    gap: 3,
  },
  presetPressed: {
    borderColor: '#00e5b0',
    backgroundColor: '#00e5b010',
  },
  presetIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  presetName: {
    color: '#e0e6f0',
    fontSize: 13,
    fontWeight: '700',
  },
  presetDesc: {
    color: '#4a5568',
    fontSize: 11,
  },
  presetStats: {
    color: '#6b7fa3',
    fontSize: 10,
    marginTop: 2,
    fontFamily: 'monospace',
  },
});
