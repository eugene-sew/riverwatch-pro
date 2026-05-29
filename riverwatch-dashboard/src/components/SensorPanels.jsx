import React from 'react'
import {
  Compass, Thermometer, Drop, CloudRain,
  ShieldCheck, ShieldWarning, Warning
} from '@phosphor-icons/react'

export default function SensorPanels({ reading }) {
  const gpsStatus = reading?.gps_status ?? reading?.gpsStatus ?? 0
  const sats = reading?.sats ?? 0
  const temp = reading?.temp ?? 0
  const humidity = reading?.humidity ?? 0
  const rainAnalog = reading?.rain_analog ?? reading?.rainAnalog ?? 4095
  const isRaining = reading?.raining ?? (rainAnalog < 2500 ? 1 : 0)
  const gpsOk = gpsStatus === 2

  return (
    <>
      {/* Column 1: GPS Tracking */}
      <div className="panel">
        <div className="panel-header">
          <Compass weight="duotone" size={14} color="#00d4aa" />
          GPS TRACKING
        </div>
        <div className="panel-body sensor-mini">
          <div className="sensor-mini-value" style={{ color: gpsOk ? '#00d4aa' : '#f97316' }}>
            {gpsOk ? 'FIXED' : 'ACQUIRING'}
          </div>
          <div>
            <div className="sensor-mini-sub">{sats} SATELLITES LINKED</div>
            <div
              className="status-pill"
              style={{
                borderColor: gpsOk ? '#00d4aa' : '#f97316',
                color: gpsOk ? '#00d4aa' : '#f97316',
                background: gpsOk ? 'rgba(0,212,170,0.1)' : 'rgba(249,115,22,0.1)',
                marginTop: 4
              }}
            >
              {gpsOk ? '3D FIX OK' : 'NO ACQUISITION'}
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Thermometer */}
      <div className="panel">
        <div className="panel-header">
          <Thermometer weight="duotone" size={14} color="#00d4aa" />
          THERMOMETER
        </div>
        <div className="panel-body sensor-mini">
          <div className="sensor-mini-value">
            {temp === -1 ? 'ERR' : `${temp.toFixed(1)}°C`}
          </div>
          <div>
            <div className="sensor-mini-sub">ESP32 TEMPERATURE</div>
            <div
              className="status-pill"
              style={{
                borderColor: '#00d4aa',
                color: '#00d4aa',
                background: 'rgba(0,212,170,0.1)',
                marginTop: 4
              }}
            >
              OPTIMAL
            </div>
          </div>
        </div>
      </div>

      {/* Column 3: Hygrometer */}
      <div className="panel">
        <div className="panel-header">
          <Drop weight="duotone" size={14} color="#00d4aa" />
          HYGROMETER
        </div>
        <div className="panel-body sensor-mini">
          <div className="sensor-mini-value">
            {humidity === -1 ? 'ERR' : `${humidity.toFixed(0)}%`}
          </div>
          <div>
            <div className="sensor-mini-sub">RELATIVE AIR HUMIDITY</div>
            <div
              className="status-pill"
              style={{
                borderColor: humidity > 80 ? '#3b82f6' : '#00d4aa',
                color: humidity > 80 ? '#3b82f6' : '#00d4aa',
                background: humidity > 80 ? 'rgba(59,130,246,0.1)' : 'rgba(0,212,170,0.1)',
                marginTop: 4
              }}
            >
              {humidity > 80 ? 'SATURATED' : 'STABLE'}
            </div>
          </div>
        </div>
      </div>

      {/* Column 4: Rain Detector */}
      <div className="panel">
        <div className="panel-header">
          <CloudRain weight="duotone" size={14} color="#00d4aa" />
          RAIN DETECTOR
        </div>
        <div className="panel-body sensor-mini">
          <div className="sensor-mini-value" style={{ color: isRaining ? '#3b82f6' : '#00d4aa' }}>
            {isRaining ? 'PRECIP' : 'DRY'}
          </div>
          <div>
            <div className="sensor-mini-sub">ADC INDEX: {rainAnalog}</div>
            <div
              className="status-pill"
              style={{
                borderColor: isRaining ? '#3b82f6' : '#00d4aa',
                color: isRaining ? '#3b82f6' : '#00d4aa',
                background: isRaining ? 'rgba(59,130,246,0.1)' : 'rgba(0,212,170,0.1)',
                marginTop: 4
              }}
            >
              {isRaining ? 'RAINING' : 'STANDBY'}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
