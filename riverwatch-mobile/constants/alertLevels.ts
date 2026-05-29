// Alert level definitions — mirrors ESP32 firmware thresholds
// Risk score → alert level → color scheme

export type AlertLevel = 'SAFE' | 'WATCH' | 'WARNING' | 'FLOOD' | 'CRITICAL';

export interface AlertLevelDef {
  level: AlertLevel;
  minScore: number;
  maxScore: number;
  label: string;
  color: string;
  bgColor: string;
  accentColor: string;
  icon: string;
  description: string;
}

export const ALERT_LEVELS: AlertLevelDef[] = [
  {
    level: 'SAFE',
    minScore: 0,
    maxScore: 24,
    label: 'ALL CLEAR',
    color: '#00e5b0',
    bgColor: '#003d30',
    accentColor: '#00ff9d',
    icon: 'checkmark-circle',
    description: 'Normal conditions. No flood risk detected.',
  },
  {
    level: 'WATCH',
    minScore: 25,
    maxScore: 49,
    label: 'FLOOD WATCH',
    color: '#f5d800',
    bgColor: '#3d3400',
    accentColor: '#ffe500',
    icon: 'eye',
    description: 'Elevated conditions. Monitor closely.',
  },
  {
    level: 'WARNING',
    minScore: 50,
    maxScore: 74,
    label: 'FLOOD WARNING',
    color: '#ff8c00',
    bgColor: '#3d2000',
    accentColor: '#ffa500',
    icon: 'warning',
    description: 'Dangerous conditions. Take precautions.',
  },
  {
    level: 'FLOOD',
    minScore: 75,
    maxScore: 89,
    label: 'FLOOD ACTIVE',
    color: '#ff3b1e',
    bgColor: '#3d0a00',
    accentColor: '#ff5533',
    icon: 'water',
    description: 'Flooding in progress. Seek higher ground.',
  },
  {
    level: 'CRITICAL',
    minScore: 90,
    maxScore: 100,
    label: '⚠ CRITICAL',
    color: '#ff0055',
    bgColor: '#3d0015',
    accentColor: '#ff1a6a',
    icon: 'alert-circle',
    description: 'Extreme flood event. Immediate evacuation required.',
  },
];

export function getAlertLevelDef(level: AlertLevel): AlertLevelDef {
  return ALERT_LEVELS.find(a => a.level === level) ?? ALERT_LEVELS[0];
}

export function scoreToAlertLevel(score: number): AlertLevel {
  if (score >= 90) return 'CRITICAL';
  if (score >= 75) return 'FLOOD';
  if (score >= 50) return 'WARNING';
  if (score >= 25) return 'WATCH';
  return 'SAFE';
}
