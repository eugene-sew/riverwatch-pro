import React, { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { getAlertStyle } from '../utils/alertColors'
import { format } from 'date-fns'

const DEFAULT_CENTER = [5.6, 0.2]
const DEFAULT_ZOOM = 13

function RecenterMap({ lat, lng }) {
  const map = useMap()
  React.useEffect(() => {
    if (lat && lng) map.setView([lat, lng], DEFAULT_ZOOM)
  }, [lat, lng, map])
  return null
}

export default function MapView({ reading }) {
  const gpsStatus = reading?.gps_status ?? reading?.gpsStatus ?? 0
  const lat = reading?.lat ?? 0
  const lng = reading?.lng ?? 0
  const hasFix = gpsStatus === 2 && lat !== 0 && lng !== 0
  const style = getAlertStyle(reading?.alert)
  const ts = reading?.timestamp ? format(new Date(reading.timestamp), 'HH:mm:ss') : '--'

  const center = hasFix ? [lat, lng] : DEFAULT_CENTER

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 12,
        left: 12,
        zIndex: 1000,
        background: 'rgba(13, 27, 42, 0.9)',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#00d4aa',
        borderTop: '2px solid #00d4aa',
      }}>📍 GPS Map</div>

      {!hasFix && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(10, 15, 30, 0.6)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }}>
          <div style={{
            background: '#0d1b2a',
            border: '1px solid #1e3a5f',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#64748b',
          }}>📡 Waiting for GPS fix...</div>
        </div>
      )}

      <MapContainer
        center={center}
        zoom={DEFAULT_ZOOM}
        style={{ height: '320px', width: '100%', background: '#0a0f1e' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        {hasFix && (
          <>
            <RecenterMap lat={lat} lng={lng} />
            <CircleMarker
              center={[lat, lng]}
              radius={12}
              fillColor={style.border}
              color={style.text}
              weight={2}
              fillOpacity={0.8}
            >
              <Popup>
                <div style={{ fontFamily: 'Courier New, monospace', fontSize: '13px', minWidth: '160px' }}>
                  <div><strong>💧 Water:</strong> {reading?.water ?? '--'} cm</div>
                  <div><strong>⚠️ Alert:</strong> {reading?.alert ?? '--'}</div>
                  <div><strong>🕐 Time:</strong> {ts}</div>
                  <div><strong>📍 Lat:</strong> {lat.toFixed(6)}</div>
                  <div><strong>📍 Lng:</strong> {lng.toFixed(6)}</div>
                </div>
              </Popup>
            </CircleMarker>
          </>
        )}
      </MapContainer>
    </div>
  )
}
