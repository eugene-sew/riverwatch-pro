import React, { useState, useEffect, useMemo } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import axios from 'axios'

import BootScreen from './components/BootScreen'
import TopBar from './components/TopBar'
import WaterPanel from './components/WaterPanel'
import RiskGauge from './components/RiskGauge'
import MapView from './components/MapView'
import SensorPanels from './components/SensorPanels'
import ChartPanel from './components/ChartPanel'
import AlertLog from './components/AlertLog'
import TransmitFeed from './components/TransmitFeed'
import SOSOverlay from './components/SOSOverlay'

import { useSocket } from './hooks/useSocket'
import { useHistory } from './hooks/useHistory'
import { usePusher } from './hooks/usePusher'
import { playSOSAlert, playAlertTone } from './utils/audioAlert'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:9100'

export default function App() {
  const [booting, setBooting] = useState(true)
  const [sosEvents, setSosEvents] = useState([])
  const [activeSOSEvent, setActiveSOSEvent] = useState(null)
  const [isStale, setIsStale] = useState(false)
  const [pusherReading, setPusherReading] = useState(null)
  const [pusherAlertLog, setPusherAlertLog] = useState([])

  const { latestReading: socketReading, alertLog: socketAlertLog, connected: socketConnected } = useSocket()
  const { history, historyAlerts, loading, backendOnline } = useHistory(socketConnected)

  // Merge Socket.IO reading and Pusher reading, taking the newest
  const latestReading = useMemo(() => {
    if (!socketReading && !pusherReading) return null
    if (!socketReading) return pusherReading
    if (!pusherReading) return socketReading
    const tSocket = new Date(socketReading.timestamp || 0).getTime()
    const tPusher = new Date(pusherReading.timestamp || 0).getTime()
    return tSocket >= tPusher ? socketReading : pusherReading
  }, [socketReading, pusherReading])

  const reading = latestReading || (history.length > 0 ? history[0] : null)

  // Fetch initial SOS events on mount
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/sos`)
      .then((res) => {
        const events = res.data.events || []
        setSosEvents(events)
      })
      .catch((e) => console.error('[REST] SOS load failed:', e))
  }, [])

  // Pusher Real-Time Events Bindings
  const { pusherConnected } = usePusher({
    onReading: (data) => {
      console.log('[App] New reading via Pusher:', data)
      setPusherReading(data)
    },
    onSOS: (data) => {
      const isExisting = sosEvents.some((e) => e.id === data.id) || !!data.isUpdate

      setSosEvents((prev) => {
        if (prev.some((e) => e.id === data.id)) {
          return prev.map((e) => (e.id === data.id ? { ...e, ...data } : e))
        }
        return [data, ...prev]
      })

      // Open or update Emergency Modal
      setActiveSOSEvent(data)

      // Only trigger sound/toast notifications if this is a BRAND-NEW SOS trigger!
      if (!isExisting) {
        // Sound alert synthesis
        playSOSAlert()
        // Custom Hot Toast alert
        toast.error(`🚨 EMERGENCY SOS BROADCAST FROM ${data.deviceId || 'NODE'}!`, {
          duration: 8000,
          position: 'top-right',
          style: {
            background: '#7f1d1d',
            color: '#fca5a5',
            border: '2px solid #ef4444',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            fontSize: '11px',
          }
        })
      }
    },
    onAlert: (data) => {
      playAlertTone()
      setPusherAlertLog((prev) => [data, ...prev].slice(0, 50))
      toast.error(`⚠️ STATION ALERT INCOMING: [${data.level}]`, {
        duration: 5000,
        position: 'top-center',
        style: {
          background: '#0a1628',
          color: '#e8f4f8',
          border: `1px solid ${data.level === 'CRITICAL' || data.level === 'DANGER' ? '#ef4444' : '#f97316'}`,
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }
      })
    },
    onSOSResolved: (data) => {
      setSosEvents((prev) =>
        prev.map((e) => (e.id === data.id ? { ...e, resolved: 1 } : e))
      )
      setActiveSOSEvent((prev) => (prev && prev.id === data.id ? null : prev))
      toast.success(`✅ SOS Event #${data.id} resolved.`, {
        style: {
          background: '#0a1628',
          color: '#00d4aa',
          border: '1px solid #00d4aa',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
        }
      })
    }
  })

  const connected = socketConnected || pusherConnected

  // Staleness Monitor (Flags data as stale if > 15s since last update)
  useEffect(() => {
    const checkStale = () => {
      if (!reading || !reading.timestamp) return
      const diff = Date.now() - new Date(reading.timestamp).getTime()
      setIsStale(diff > 15000)
    }
    checkStale()
    const id = setInterval(checkStale, 3000)
    return () => clearInterval(id)
  }, [reading])

  // Favicon dynamic drawing according to threat level
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    const ctx = canvas.getContext('2d')
    if (ctx && reading) {
      const alert = reading.alert || 'SAFE'
      ctx.fillStyle = alert === 'CRITICAL' || alert === 'DANGER' ? '#ef4444' :
                      alert === 'WARNING' || alert === 'WATCH' ? '#f97316' : '#00d4aa'
      ctx.beginPath()
      ctx.arc(8, 8, 8, 0, 2 * Math.PI)
      ctx.fill()
      
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link')
      link.type = 'image/x-icon'
      link.rel = 'icon'
      link.href = canvas.toDataURL()
      document.getElementsByTagName('head')[0].appendChild(link)
    }
  }, [reading?.alert])

  // Resolve Emergency SOS Endpoint Call
  const handleResolveSOS = async (id) => {
    try {
      await axios.post(`${BACKEND_URL}/api/sos/${id}/resolve`)
      // State is locally updated (and reinforced by the Pusher payload)
      setSosEvents((prev) =>
        prev.map((e) => (e.id === id ? { ...e, resolved: 1 } : e))
      )
      if (activeSOSEvent && activeSOSEvent.id === id) {
        setActiveSOSEvent(null)
      }
    } catch (err) {
      toast.error('Resolution broadcast failed')
    }
  }

  // Merge socket history and REST history
  const chartHistory = useMemo(() => {
    if (!latestReading) return history
    if (history.length > 0 && history[0].timestamp === latestReading.timestamp) return history
    return [latestReading, ...history].slice(0, 100)
  }, [latestReading, history])

  // Merge alert logs (SocketIO + REST alerts + Pusher alerts, deduped by timestamp)
  const mergedAlerts = useMemo(() => {
    const all = [...socketAlertLog, ...pusherAlertLog, ...historyAlerts]
    const seen = new Set()
    return all.filter((a) => {
      const key = (a.timestamp || '') + (a.level || a.alert || '')
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, 50)
  }, [socketAlertLog, pusherAlertLog, historyAlerts])

  if (booting) {
    return <BootScreen onDone={() => setBooting(false)} />
  }

  return (
    <>
      <Toaster />
      <div className="dashboard">
        {/* Topbar status ribbon */}
        <TopBar reading={reading} connected={connected && backendOnline} isStale={isStale} />

        {/* Main telemetry deck */}
        <div className="main-row">
          <WaterPanel reading={reading} />
          <RiskGauge reading={reading} />
          <MapView
            reading={reading}
            sosEvents={sosEvents}
            onResolveSOS={handleResolveSOS}
          />
        </div>

        {/* Sensor mini panels */}
        <div className="sensors-row">
          <SensorPanels reading={reading} />
        </div>

        {/* Charting module */}
        <div className="chart-row">
          <ChartPanel history={chartHistory} />
        </div>

        {/* Alert logs + telemetry activity stream */}
        <div className="bottom-row">
          <AlertLog alerts={mergedAlerts} />
          <TransmitFeed history={chartHistory} />
        </div>
      </div>

      {/* Full-screen Emergency SOS Overlay */}
      {activeSOSEvent && (
        <SOSOverlay
          activeSOS={activeSOSEvent}
          onResolve={handleResolveSOS}
          onClose={() => setActiveSOSEvent(null)}
        />
      )}
    </>
  )
}
