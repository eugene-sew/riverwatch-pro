export function getAlertStyle(level) {
  switch ((level || 'SAFE').toUpperCase()) {
    case 'SAFE':
      return {
        bg: '#14532d',
        border: '#22c55e',
        text: '#22c55e',
        pulse: false,
        bgLight: 'rgba(34, 197, 94, 0.12)',
      }
    case 'WATCH':
      return {
        bg: '#1c1917',
        border: '#a16207',
        text: '#ca8a04',
        pulse: false,
        bgLight: 'rgba(161, 98, 7, 0.12)',
      }
    case 'WARNING':
      return {
        bg: '#431407',
        border: '#c2410c',
        text: '#f97316',
        pulse: false,
        bgLight: 'rgba(194, 65, 12, 0.12)',
      }
    case 'DANGER':
      return {
        bg: '#450a0a',
        border: '#ef4444',
        text: '#ef4444',
        pulse: false,
        bgLight: 'rgba(239, 68, 68, 0.12)',
      }
    case 'CRITICAL':
      return {
        bg: '#450a0a',
        border: '#dc2626',
        text: '#fca5a5',
        pulse: true,
        bgLight: 'rgba(220, 38, 38, 0.12)',
      }
    default:
      return {
        bg: '#1e293b',
        border: '#64748b',
        text: '#94a3b8',
        pulse: false,
        bgLight: 'rgba(100, 116, 139, 0.12)',
      }
  }
}
