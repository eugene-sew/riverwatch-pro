import React from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap } from 'react-leaflet'
import { format } from 'date-fns'

const DEFAULT_CENTER = [5.6, 0.2]
const DEFAULT_ZOOM = 13

function RecenterMap({ lat, lng, activeSOS }) {
  const map = useMap()
  React.useEffect(() => {
    if (activeSOS && activeSOS.lat && activeSOS.lng) {
      map.setView([activeSOS.lat, activeSOS.lng], DEFAULT_ZOOM)
    } else if (lat && lng) {
      map.setView([lat, lng], DEFAULT_ZOOM)
    }
  }, [lat, lng, activeSOS?.lat, activeSOS?.lng, map])
  return null
}

function alertColor(level) {
  const l = (level || 'SAFE').toUpperCase()
  if (l === 'CRITICAL') return '#dc2626'
  if (l === 'DANGER')   return '#ef4444'
  if (l === 'WARNING')  return '#f97316'
  if (l === 'WATCH')    return '#ca8a04'
  return '#00d4aa'
}

export default function MapView({ reading, sosEvents = [], onResolveSOS }) {
  const gpsStatus = reading?.gps_status ?? reading?.gpsStatus ?? 0
  const lat = reading?.lat ?? 0
  const lng = reading?.lng ?? 0
  const hasFix = gpsStatus === 2 && lat !== 0 && lng !== 0
  const color = alertColor(reading?.alert)
  const ts = reading?.timestamp ? format(new Date(reading.timestamp), 'HH:mm:ss') : '--'

  const activeSOS = sosEvents.find((e) => !e.resolved)

  const center = activeSOS && activeSOS.lat && activeSOS.lng
    ? [activeSOS.lat, activeSOS.lng]
    : (hasFix ? [lat, lng] : DEFAULT_CENTER)

  return (
    <div className="panel map-panel" style={{ height: '100%', minHeight: 0 }}>
      <div className="panel-header">📍 INFRASTRUCTURE COVERAGE MAP</div>
      <div style={{ height: 'calc(100% - 34px)', width: '100%', position: 'relative' }}>
        {!hasFix && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            pointerEvents: 'none',
          }}>
            <div style={{
              background: 'rgba(10, 22, 40, 0.9)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '9px',
              fontFamily: 'var(--font-mono)',
              color: '#ef4444',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{
                display: 'inline-block',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: '#ef4444',
                boxShadow: '0 0 6px #ef4444',
                animation: 'pulseDot 2s ease-in-out infinite'
              }} />
              STATION GPS AWAITING SYNC...
            </div>
          </div>
        )}

        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%', background: '#060d1a' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />

          <RecenterMap lat={hasFix ? lat : null} lng={hasFix ? lng : null} activeSOS={activeSOS} />

          {hasFix && (
            <>
              {/* 500m Dashed Coverage Boundary */}
              <Circle
                center={[lat, lng]}
                radius={500}
                pathOptions={{
                  color: '#00d4aa',
                  fillColor: '#00d4aa',
                  fillOpacity: 0.04,
                  weight: 1.5,
                  dashArray: '5, 5'
                }}
              />

              {/* Pulsing Alert Ring for Danger/Critical alerts */}
              {(reading?.alert === 'DANGER' || reading?.alert === 'CRITICAL') && (
                <CircleMarker
                  center={[lat, lng]}
                  radius={22}
                  pathOptions={{
                    fillColor: '#dc2626',
                    color: '#dc2626',
                    weight: 0,
                    fillOpacity: 0.25
                  }}
                />
              )}

              {/* Primary Station Marker */}
              <CircleMarker
                center={[lat, lng]}
                radius={10}
                pathOptions={{
                  fillColor: color,
                  color: '#e8f4f8',
                  weight: 1.5,
                  fillOpacity: 0.95
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', minWidth: '160px', color: '#060d1a' }}>
                    <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '4px' }}>📡 Volta Station #1</div>
                    <div><strong>💧 Head:</strong> {reading?.water ?? '--'} cm</div>
                    <div><strong>⚠️ Alert:</strong> {reading?.alert ?? '--'}</div>
                    <div><strong>🕐 Time:</strong> {ts}</div>
                    <div><strong>📍 Lat:</strong> {lat.toFixed(5)}</div>
                    <div><strong>📍 Lng:</strong> {lng.toFixed(5)}</div>
                  </div>
                </Popup>
              </CircleMarker>
            </>
          )}

          {/* SOS Event Markers */}
          {sosEvents.map((sos) => {
            if (sos.resolved) return null
            const sosLat = sos.lat
            const sosLng = sos.lng
            if (!sosLat || !sosLng) return null

            return (
              <React.Fragment key={sos.id}>
                {/* Outer Red Pulse Ring */}
                <CircleMarker
                  center={[sosLat, sosLng]}
                  radius={26}
                  pathOptions={{
                    fillColor: '#ef4444',
                    color: '#ef4444',
                    weight: 0,
                    fillOpacity: 0.3
                  }}
                />
                {/* Inner Alert Marker */}
                <CircleMarker
                  center={[sosLat, sosLng]}
                  radius={8}
                  pathOptions={{
                    fillColor: '#ef4444',
                    color: '#060d1a',
                    weight: 1.5,
                    fillOpacity: 0.95
                  }}
                >
                  <Popup>
                    <div className="sos-popup">
                      <div className="sos-popup-title">🚨 ACTIVE EMERGENCY SOS</div>
                      <div style={{ marginBottom: 4 }}><strong>Device:</strong> {sos.deviceId || 'Unknown'}</div>
                      <div style={{ marginBottom: 4 }}><strong>Accuracy:</strong> {sos.accuracy?.toFixed(1) || '--'}m</div>
                      <div style={{ marginBottom: 4 }}><strong>Message:</strong> {sos.message || 'No msg provided'}</div>
                      <div style={{ marginBottom: 4 }}><strong>Water Head:</strong> {sos.water ?? '--'} cm</div>
                      <div style={{ marginBottom: 4 }}><strong>GPS:</strong> {sosLat.toFixed(5)}, {sosLng.toFixed(5)}</div>
                      <button
                        className="sos-resolve-btn"
                        onClick={() => onResolveSOS && onResolveSOS(sos.id)}
                      >
                        MARK RESOLVED
                      </button>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
