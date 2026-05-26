import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:9100'
const MAX_ALERTS = 50

export function useSocket() {
  const [latestReading, setLatestReading] = useState(null)
  const [alertLog, setAlertLog] = useState([])
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected')
      setConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
      setConnected(false)
    })

    socket.on('reading', (data) => {
      setLatestReading(data)
    })

    socket.on('alert', (data) => {
      setAlertLog((prev) => [data, ...prev].slice(0, MAX_ALERTS))
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return { latestReading, alertLog, connected }
}
