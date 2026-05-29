import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAlertLevelDef } from '../constants/alertLevels';
import { RiskEngineOutput } from '../hooks/useRiskEngine';

interface AlertBannerProps {
  risk: RiskEngineOutput;
  water: number;
}

export function AlertBanner({ risk, water }: AlertBannerProps) {
  const def = getAlertLevelDef(risk.alert);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const isCritical = risk.alert === 'CRITICAL' || risk.alert === 'FLOOD';

  useEffect(() => {
    if (isCritical) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCritical]);

  const etaText = risk.etaMinutes !== null
    ? risk.etaMinutes === 0
      ? 'FLOOD LEVEL REACHED'
      : `Flood threshold in ~${risk.etaMinutes.toFixed(1)} min`
    : risk.riseRate > 0
    ? `Rising at ${risk.riseRate.toFixed(2)} cm/min`
    : 'Level stable';

  return (
    <View style={[styles.container, { backgroundColor: def.bgColor, borderColor: def.color }]}>
      <Animated.View style={[styles.iconWrap, { opacity: isCritical ? pulseAnim : 1 }]}>
        <Ionicons name={def.icon as any} size={28} color={def.color} />
      </Animated.View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.level, { color: def.color }]}>{def.label}</Text>
          <View style={[styles.scoreBadge, { borderColor: def.color }]}>
            <Text style={[styles.scoreText, { color: def.color }]}>{risk.score}</Text>
          </View>
        </View>
        <Text style={styles.description}>{def.description}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>
            💧 {water.toFixed(1)} cm
          </Text>
          <Text style={styles.stat}>
            📈 {etaText}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 12,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  level: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    color: '#8899aa',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  stat: {
    color: '#aabbcc',
    fontSize: 11,
    fontWeight: '500',
  },
});
