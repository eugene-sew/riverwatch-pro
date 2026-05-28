import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:9100'
const POLL_INTERVAL_MS = 3000

export function useHistory(connected) {
  const [history, setHistory] = useState([])
  const [historyAlerts, setHistoryAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [backendOnline, setBackendOnline] = useState(true)
  const pollRef = useRef(null)

  const fetchHistory = useCallback(async () => {
    try {
      const [histRes, alertRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/history?limit=100`, { timeout: 3000 }),
        axios.get(`${BACKEND_URL}/api/alerts?limit=50`, { timeout: 3000 }),
      ])
      setHistory(histRes.data.readings || [])
      setHistoryAlerts(alertRes.data.alerts || [])
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchLatest = useCallback(async () => {
    if (connected) return // WebSocket handles this
    try {
      const res = await axios.get(`${BACKEND_URL}/api/latest`, { timeout: 3000 })
      // Parent will handle via latestReading from socket; here just track online status
      setBackendOnline(true)
    } catch {
      setBackendOnline(false)
    }
  }, [connected])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Periodically refresh the full historical dataset every 20 seconds to keep charts in sync
  useEffect(() => {
    const interval = setInterval(fetchHistory, 20000)
    return () => clearInterval(interval)
  }, [fetchHistory])

  // Poll /api/latest as fallback when WebSocket not connected
  useEffect(() => {
    if (!connected) {
      pollRef.current = setInterval(fetchLatest, POLL_INTERVAL_MS)
    } else {
      clearInterval(pollRef.current)
    }
    return () => clearInterval(pollRef.current)
  }, [connected, fetchLatest])

  return { history, historyAlerts, loading, backendOnline }
}
