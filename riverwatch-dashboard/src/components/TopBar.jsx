import React, { useState, useEffect } from 'react'
import {
  MapPin, NavigationArrow, BluetoothConnected, BluetoothX,
  DeviceMobile, Cpu, Warning
} from '@phosphor-icons/react'

function alertClass(level) {
  const l = (level || 'SAFE').toUpperCase()
  if (l === 'CRITICAL') return 'alert-critical'
  if (l === 'DANGER')   return 'alert-danger'
  if (l === 'WARNING')  return 'alert-warning'
  if (l === 'WATCH')    return 'alert-watch'
  return 'alert-safe'
}

export default function TopBar({ reading, connected, isStale }) {
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toTimeString().slice(0, 8))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const level = reading?.alert || 'SAFE'
  const risk = reading?.risk ?? '--'
  const lat = reading?.lat
  const lng = reading?.lng
  const gpsOk = reading?.gps_status === 2 || reading?.gpsStatus === 2
  const source = reading?.source || (reading?.btPaired ? 'ESP32' : 'MOBILE')

  return (
    <div className="topbar">
      {/* Left */}
      <span className="topbar-wordmark">RiverWatch</span>
      <span className="topbar-pro-badge">PRO</span>
      <span className="topbar-sep" />
      <span className="topbar-location">
        <MapPin weight="duotone" size={14} />
        Volta Region, Ghana
      </span>

      {/* Center */}
      <div className="topbar-center">
        {isStale && (
          <div className="stale-warning">
            <Warning size={12} />
            DATA STALE
          </div>
        )}
        <span className={`alert-pill ${alertClass(level)}`}>{level}</span>
        <span className="risk-score">RISK {risk}/100</span>
      </div>

      {/* Right */}
      <div className="topbar-right">
        <span className="topbar-item">
          <NavigationArrow weight="duotone" size={14} />
          {gpsOk && lat && lng ? `${lat.toFixed(4)}°, ${lng.toFixed(4)}°` : 'Acquiring'}
        </span>
        <span className="topbar-item">
          {connected
            ? <BluetoothConnected weight="duotone" size={14} color="#00d4aa" />
            : <BluetoothX weight="duotone" size={14} color="#ef4444" />}
        </span>
        <span className="topbar-item">
          {source === 'ESP32'
            ? <Cpu weight="duotone" size={14} />
            : <DeviceMobile weight="duotone" size={14} />}
          {source}
        </span>
        <span className="topbar-item" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-primary)' }}>
          {clock}
        </span>
        <div className={`connection-dot ${connected ? 'live' : 'offline'}`} />
      </div>
    </div>
  )
}
