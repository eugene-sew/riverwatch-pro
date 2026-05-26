import React from 'react'
import { format } from 'date-fns'

function gpsStatusText(status) {
  if (status === 2) return null // will show sats instead
  if (status === 1) return 'Searching...'
  if (status === 0) return 'No module'
  return 'Unknown'
}

export default function StatusBar({ connected, reading, readingCount }) {
  const gpsStatus = reading?.gps_status ?? reading?.gpsStatus ?? 0
  const sats = reading?.sats ?? 0
  const ts = reading?.timestamp ? format(new Date(reading.timestamp), 'HH:mm:ss') : '--'

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#060b18',
      borderTop: '1px solid #1e3a5f',
      padding: '8px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      fontSize: '12px',
      color: '#64748b',
      zIndex: 1000,
      fontFamily: 'Courier New, monospace',
    }}>
      {/* BT Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: connected ? '#22c55e' : '#ef4444',
          display: 'inline-block',
          boxShadow: connected ? '0 0 6px #22c55e' : '0 0 6px #ef4444',
        }} />
        <span style={{ color: connected ? '#22c55e' : '#ef4444' }}>
          {connected ? 'BT Connected' : 'BT Disconnected'}
        </span>
      </div>

      {/* GPS Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>📡</span>
        <span>
          {gpsStatus === 2
            ? <span style={{ color: '#00d4aa' }}>Fix: {sats} sats</span>
            : <span style={{ color: '#64748b' }}>{gpsStatusText(gpsStatus)}</span>
          }
        </span>
      </div>

      {/* Last Update */}
      <div>🕐 {ts}</div>

      {/* Reading count */}
      <div style={{ marginLeft: 'auto' }}>Readings: <span style={{ color: '#00d4aa' }}>{readingCount ?? 0}</span></div>
    </div>
  )
}
