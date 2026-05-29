import React from 'react'
import { Siren, MapPin, Copy, XCircle, CheckCircle } from '@phosphor-icons/react'
import { safeFormatDate } from '../utils/safeDate'
import toast from 'react-hot-toast'

export default function SOSOverlay({ activeSOS, onResolve, onClose }) {
  if (!activeSOS) return null

  const lat = activeSOS.lat ?? 0
  const lng = activeSOS.lng ?? 0
  const accuracy = activeSOS.accuracy ?? 0
  const ts = safeFormatDate(activeSOS.timestamp, 'HH:mm:ss')
  const deviceId = activeSOS.deviceId ?? activeSOS.device_id ?? 'Unknown'
  const water = activeSOS.water ?? '--'
  const alertVal = activeSOS.alert ?? 'UNKNOWN'
  const message = activeSOS.message ?? 'No message provided'

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`)
    toast.success('Coordinates copied to clipboard!', {
      style: {
        background: '#0d1e35',
        color: '#e8f4f8',
        border: '1px solid #00d4aa',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
      }
    })
  }

  return (
    <div className="sos-overlay-backdrop">
      <div className="sos-overlay-card">
        <div className="sos-overlay-icon">
          <Siren size={64} weight="duotone" />
        </div>
        <h2 className="sos-overlay-title">🚨 EMERGENCY SOS BROADCAST</h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)', marginBottom: 8 }}>
          EMERGENCY COORDINATES (CLICK TO COPY)
        </p>
        
        <div className="sos-coords" onClick={handleCopyCoords} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <span>{lat.toFixed(6)}°, {lng.toFixed(6)}°</span>
          <Copy size={16} color="var(--accent)" />
        </div>

        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="sos-maps-link">
          <MapPin size={16} />
          View on Google Maps
        </a>

        <div style={{ margin: '16px 0', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
          <div className="sos-detail-row">
            <span>DEVICE IDENTIFIER:</span>
            <span className="sos-detail-val">{deviceId}</span>
          </div>
          <div className="sos-detail-row">
            <span>SIGNAL TIMESTAMP:</span>
            <span className="sos-detail-val">{ts}</span>
          </div>
          <div className="sos-detail-row">
            <span>GPS ACCURACY DEV:</span>
            <span className="sos-detail-val">±{accuracy.toFixed(1)}m</span>
          </div>
          <div className="sos-detail-row">
            <span>LOCAL WATER HEIGHT:</span>
            <span className="sos-detail-val">{water} cm</span>
          </div>
          <div className="sos-detail-row">
            <span>THREAT STATUS:</span>
            <span className="sos-detail-val" style={{ color: '#ef4444', fontWeight: 'bold' }}>{alertVal}</span>
          </div>
          <div className="sos-detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', borderBottom: 'none', marginTop: 4 }}>
            <span style={{ marginBottom: 4 }}>EMERGENCY TRANSMISSION MESSAGE:</span>
            <span className="sos-detail-val" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', textAlign: 'left', fontSize: 12, marginTop: 2 }}>
              "{message}"
            </span>
          </div>
        </div>

        <div className="sos-btn-row">
          <button className="sos-btn sos-btn-danger" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <XCircle size={16} />
            VIEW MAP
          </button>
          <button className="sos-btn sos-btn-primary" onClick={() => onResolve(activeSOS.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <CheckCircle size={16} />
            RESOLVE SOS
          </button>
        </div>
      </div>
    </div>
  )
}
