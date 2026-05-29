import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { ALERT_LEVELS, scoreToAlertLevel } from '../constants/alertLevels';

interface RiskGaugeProps {
  score: number;
}

const SIZE = 180;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function scoreToColor(score: number): string {
  const level = scoreToAlertLevel(score);
  const def = ALERT_LEVELS.find((a) => a.level === level);
  return def?.color ?? '#00e5b0';
}

export function RiskGauge({ score }: RiskGaugeProps) {
  const clampedScore = Math.max(0, Math.min(100, score));
  // Arc covers 270° (from 135° to 405° = bottom-left to bottom-right)
  const arcRatio = clampedScore / 100;
  const strokeDashoffset = CIRCUMFERENCE * (1 - arcRatio * 0.75);
  const color = scoreToColor(clampedScore);

  const level = scoreToAlertLevel(clampedScore);
  const label = ALERT_LEVELS.find((a) => a.level === level)?.label ?? 'ALL CLEAR';

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Defs>
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.6} />
            <Stop offset="100%" stopColor={color} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#1a2540"
          strokeWidth={STROKE}
          strokeDasharray={`${CIRCUMFERENCE * 0.75} ${CIRCUMFERENCE}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(135, ${SIZE / 2}, ${SIZE / 2})`}
        />
        {/* Active arc */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth={STROKE}
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(135, ${SIZE / 2}, ${SIZE / 2})`}
        />
      </Svg>
      {/* Center text */}
      <View style={styles.center}>
        <Text style={[styles.scoreNum, { color }]}>{clampedScore}</Text>
        <Text style={styles.scoreLabel}>RISK</Text>
        <Text style={[styles.levelLabel, { color }]} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    marginTop: 16,
  },
  scoreNum: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreLabel: {
    color: '#4a5568',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: -4,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },
});
