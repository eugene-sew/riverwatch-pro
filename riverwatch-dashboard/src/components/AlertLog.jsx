import React from 'react'
import { getAlertStyle } from '../utils/alertColors'
import { format } from 'date-fns'

export default function AlertLog({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '320px' }}>
        <div className="card-title">🚨 Alert Log</div>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          fontSize: '14px',
        }}>No alerts recorded.</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="card-title">🚨 Alert Log</div>
      <div style={{
        overflowY: 'auto',
        maxHeight: '280px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}>
        {alerts.map((alert, i) => {
          const style = getAlertStyle(alert.level)
          const ts = alert.timestamp ? format(new Date(alert.timestamp), 'HH:mm:ss') : '--'
          const hasCoords = alert.lat && alert.lng && alert.lat !== 0 && alert.lng !== 0
          return (
            <div
              key={alert.id || i}
              style={{
                background: style.bgLight,
                border: `1px solid ${style.border}`,
                borderRadius: '6px',
                padding: '8px 12px',
                fontSize: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '3px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  background: style.border,
                  color: '#fff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '1px',
                }}>{alert.level}</span>
                <span style={{ color: '#64748b', fontFamily: 'Courier New, monospace' }}>{ts}</span>
              </div>
              <div style={{ color: '#94a3b8', fontFamily: 'Courier New, monospace' }}>
                💧 {alert.water ?? '--'} cm
                {hasCoords && (
                  <span style={{ marginLeft: '8px', color: '#475569' }}>
                    📍 {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
