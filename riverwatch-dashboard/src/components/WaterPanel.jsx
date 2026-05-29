import React from 'react'
import { Waves, TrendUp, TrendDown, ArrowsHorizontal, Timer } from '@phosphor-icons/react'

const THRESHOLDS = [
  { level: 75, label: 'CRIT',  color: '#dc2626' },
  { level: 60, label: 'DNGR',  color: '#ef4444' },
  { level: 40, label: 'WARN',  color: '#f97316' },
  { level: 20, label: 'WTCH',  color: '#ca8a04' },
]

function alertColor(level) {
  const l = (level || 'SAFE').toUpperCase()
  if (l === 'CRITICAL') return '#dc2626'
  if (l === 'DANGER')   return '#ef4444'
  if (l === 'WARNING')  return '#f97316'
  if (l === 'WATCH')    return '#ca8a04'
  return '#00d4aa'
}

export default function WaterPanel({ reading }) {
  const water = reading?.water ?? null
  const alert = reading?.alert || 'SAFE'
  const riseRate = reading?.riseRate ?? reading?.rise_rate ?? 0
  const eta = reading?.eta ?? -1
  const color = alertColor(alert)
  
  // Percent from 0 to 100 cm
  const fillPct = water !== null ? Math.min(100, Math.max(0, (water / 100) * 100)) : 0

  const rateClass = riseRate > 0.05 ? 'rising' : riseRate < -0.05 ? 'falling' : ''
  const showEta = riseRate > 0 && eta > 0 && eta < 120
  const etaClass = showEta && eta < 30 ? 'critical-eta' : 'danger'

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <Waves weight="duotone" size={16} color="#00d4aa" />
        WATER LEVEL
      </div>
      <div className="panel-body">
        <div className="water-reading-row">
          <div className="water-value-block">
            <div>
              <span className="water-number" style={{ color }}>
                {water !== null ? water.toFixed(1) : '--'}
              </span>
              <span className="water-unit">cm</span>
            </div>
            <div className="water-meta">
              <div className={`water-meta-row ${rateClass}`}>
                {riseRate > 0.05 ? (
                  <>
                    <TrendUp size={14} />
                    <span>RISING (+{riseRate.toFixed(2)} cm/m)</span>
                  </>
                ) : riseRate < -0.05 ? (
                  <>
                    <TrendDown size={14} />
                    <span>FALLING ({riseRate.toFixed(2)} cm/m)</span>
                  </>
                ) : (
                  <>
                    <ArrowsHorizontal size={14} />
                    <span>STABLE</span>
                  </>
                )}
              </div>
              {showEta && (
                <div className={`water-meta-row ${etaClass}`}>
                  <Timer size={14} />
                  <span>ETA CRIT: {Math.round(eta)} MINS</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="gauge-bar-wrap">
            <div className="gauge-bar-track">
              <div
                className="gauge-bar-fill"
                style={{
                  height: `${fillPct}%`,
                  background: color,
                }}
              />
              {THRESHOLDS.map((t) => (
                <div
                  key={t.level}
                  className="gauge-tick"
                  style={{ bottom: `${t.level}%` }}
                >
                  — {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
