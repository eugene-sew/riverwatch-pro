import React, { useMemo } from 'react'
import AlertBanner from './components/AlertBanner'
import SensorCard from './components/SensorCard'
import WaterLevelChart from './components/WaterLevelChart'
import RainHumidityChart from './components/RainHumidityChart'
import MapView from './components/MapView'
import AlertLog from './components/AlertLog'
import StatusBar from './components/StatusBar'
import { useSocket } from './hooks/useSocket'
import { useHistory } from './hooks/useHistory'

export default function App() {
  const { latestReading, alertLog, connected } = useSocket()
  const { history, historyAlerts, loading, backendOnline } = useHistory(connected)

  // Merge socket latest with history for chart data
  const chartHistory = useMemo(() => {
    if (!latestReading) return history
    // Prepend if not already in history
    if (history.length > 0 && history[0].timestamp === latestReading.timestamp) return history
    return [latestReading, ...history].slice(0, 100)
  }, [latestReading, history])

  // Merge alert logs: socket alerts + history alerts (dedup by timestamp)
  const mergedAlerts = useMemo(() => {
    const all = [...alertLog, ...historyAlerts]
    const seen = new Set()
    return all.filter((a) => {
      const key = a.timestamp + a.level
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 50)
  }, [alertLog, historyAlerts])

  const reading = latestReading || (history.length > 0 ? history[0] : null)
  const level = reading?.alert || 'SAFE'
  const isRaining = reading?.raining === 1
  const riseRate = reading?.riseRate ?? reading?.rise_rate ?? null

  return (
    <>
      <div className="app-container">
        {/* Offline banner */}
        {!backendOnline && (
          <div className="offline-banner">
            <span>⚠️</span>
            <span><strong>Backend offline</strong> — Unable to reach http://localhost:5000. Showing last known data.</span>
          </div>
        )}

        {/* Row 1: Alert Banner */}
        <AlertBanner reading={reading} />

        {/* Row 2: Sensor Cards */}
        <div className="sensor-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          <SensorCard
            title="Water Level"
            value={reading?.water ?? '--'}
            unit="cm"
            icon="💧"
            subtitle={
              riseRate === null ? 'Rise: --' :
              riseRate > 0.05  ? `Rise: +${riseRate.toFixed(2)} cm/min` :
              riseRate < -0.05 ? `Fall: ${riseRate.toFixed(2)} cm/min` :
              'Stable'
            }
            borderColor={
              level === 'CRITICAL' ? '#dc2626' :
              level === 'DANGER'   ? '#ef4444' :
              level === 'WARNING'  ? '#f97316' :
              level === 'WATCH'    ? '#ca8a04' : '#00d4aa'
            }
          />
          <SensorCard
            title="Risk Score"
            value={reading?.risk ?? '--'}
            unit="/ 100"
            icon="⚠️"
            subtitle={
              typeof (reading?.eta) === 'number' && reading.eta > 0 && reading.eta < 120
                ? `ETA: ${Math.round(reading.eta)} min`
                : riseRate !== null ? `Rate: ${riseRate.toFixed(2)} cm/min` : '--'
            }
            borderColor={
              typeof reading?.risk === 'number' && reading.risk >= 75 ? '#dc2626' :
              typeof reading?.risk === 'number' && reading.risk >= 50 ? '#ef4444' :
              typeof reading?.risk === 'number' && reading.risk >= 25 ? '#f97316' : '#00d4aa'
            }
          />
          <SensorCard
            title="Temperature"
            value={reading?.temp === -1 ? 'ERR' : (reading?.temp ?? '--')}
            unit={reading?.temp !== -1 ? '°C' : ''}
            icon="🌡️"
            subtitle={reading?.temp === -1 ? 'Sensor error' : null}
          />
          <SensorCard
            title="Humidity"
            value={reading?.humidity === -1 ? 'ERR' : (reading?.humidity ?? '--')}
            unit={reading?.humidity !== -1 ? '%' : ''}
            icon="💦"
            subtitle={reading?.humidity === -1 ? 'Sensor error' : null}
          />
          <SensorCard
            title="Rain Status"
            value={isRaining ? 'RAIN' : 'DRY'}
            unit=""
            icon={isRaining ? '🌧️' : '☀️'}
            subtitle={`ADC: ${reading?.rain_analog ?? reading?.rainAnalog ?? '--'}`}
            borderColor={isRaining ? '#3b82f6' : '#00d4aa'}
          />
        </div>

        {/* Row 3: Water Chart + Map */}
        <div className="charts-row">
          <WaterLevelChart history={chartHistory} latestAlert={level} />
          <MapView reading={reading} />
        </div>

        {/* Row 4: Rain/Humidity Chart + Alert Log */}
        <div className="bottom-row">
          <RainHumidityChart history={chartHistory} />
          <AlertLog alerts={mergedAlerts} />
        </div>
      </div>

      <StatusBar
        connected={connected}
        reading={reading}
        readingCount={chartHistory.length}
      />
    </>
  )
}
