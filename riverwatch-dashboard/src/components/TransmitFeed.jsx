import React from 'react'
import { Broadcast, CircuitBoard, DeviceMobile } from '@phosphor-icons/react'
import { format } from 'date-fns'

export default function TransmitFeed({ history = [] }) {
  // Take last 8 readings
  const transmissions = React.useMemo(() => {
    return history.slice(0, 8)
  }, [history])

  return (
    <div className="panel transmit-feed-panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <Broadcast weight="duotone" size={14} color="#00d4aa" />
        TELEMETRY TRANSMISSION FEED
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {(!transmissions || transmissions.length === 0) ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
          }}>
            Waiting for telemetry sync...
          </div>
        ) : (
          transmissions.map((t, idx) => {
            const isLatest = idx === 0
            const ts = t.timestamp ? format(new Date(t.timestamp), 'HH:mm:ss') : '--'
            const source = t.source || (t.bt_paired || t.btPaired ? 'ESP32' : 'MOBILE')
            const water = t.water !== undefined ? `${t.water.toFixed(0)}cm` : '0cm'
            const risk = t.risk !== undefined ? `R:${t.risk}` : 'R:0'
            const temp = t.temp !== undefined && t.temp !== -1 ? `${t.temp.toFixed(0)}°C` : 'ERR'
            const rain = t.rain_analog ?? t.rainAnalog ?? 4095

            return (
              <div key={`${t.timestamp}-${idx}`} className={`log-row ${isLatest ? 'latest' : ''}`}>
                <span style={{ color: isLatest ? 'var(--accent)' : 'var(--text-secondary)', width: '60px', flexShrink: 0 }}>
                  [{ts}]
                </span>
                <span className="source-badge" style={{ marginRight: 8, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  {source === 'ESP32' ? (
                    <CircuitBoard size={8} />
                  ) : (
                    <DeviceMobile size={8} />
                  )}
                  {source}
                </span>
                <span style={{ color: isLatest ? 'var(--text-primary)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '9px', flex: 1, letterSpacing: '0.2px' }}>
                  RX_PKT | W:{water} | {risk} | T:{temp} | ADC:{rain}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '8px' }}>
                  OK
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
