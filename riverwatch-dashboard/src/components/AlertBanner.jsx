import React from 'react'
import { getAlertStyle } from '../utils/alertColors'
import { safeFormatDate } from '../utils/safeDate'

export default function AlertBanner({ reading }) {
  const level = reading?.alert || 'SAFE'
  const style = getAlertStyle(level)
  const water = reading?.water ?? '--'
  const riseRate = reading?.riseRate ?? reading?.rise_rate ?? null
  const eta = reading?.eta ?? -1
  const risk = reading?.risk ?? '--'
  const ts = safeFormatDate(reading?.timestamp, 'HH:mm:ss')

  return (
    <div
      style={{
        background: style.bg,
        borderBottom: `3px solid ${style.border}`,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        borderRadius: '12px',
        marginBottom: '16px',
        animation: style.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '2rem' }}>
          {level === 'SAFE'     ? '🟢' :
           level === 'WATCH'    ? '🟡' :
           level === 'WARNING'  ? '🟠' :
           level === 'DANGER'   ? '🔴' : '🚨'}
        </span>
        <div>
          <div style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            color: style.text,
            opacity: 0.8,
            marginBottom: '2px',
          }}>Alert Level</div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 700,
            color: style.text,
            fontFamily: 'Courier New, monospace',
            letterSpacing: '2px',
          }}>{level}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        <Stat label="Water Level" value={water === '--' ? '--' : `${water} cm`} color={style.text} />
        <Stat
          label="Rise Rate"
          value={
            riseRate === null ? '--' :
            riseRate > 0.05  ? `↑ ${riseRate.toFixed(2)} cm/min` :
            riseRate < -0.05 ? `↓ ${Math.abs(riseRate).toFixed(2)} cm/min` :
            'Stable'
          }
          color={riseRate > 0.05 ? '#f97316' : riseRate < -0.05 ? '#22c55e' : '#94a3b8'}
        />
        <Stat label="Risk Score" value={`${risk}/100`} color={
          typeof risk === 'number' && risk >= 75 ? '#dc2626' :
          typeof risk === 'number' && risk >= 50 ? '#ef4444' :
          typeof risk === 'number' && risk >= 25 ? '#f97316' : '#22c55e'
        } />
        {typeof eta === 'number' && eta > 0 && eta < 120 && (
          <Stat
            label="⏱ ETA to next level"
            value={`${Math.round(eta)} min`}
            color='#fca5a5'
          />
        )}
        <Stat label="Last Update" value={ts} color="#94a3b8" />
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, color, fontFamily: 'Courier New, monospace' }}>{value}</div>
    </div>
  )
}
