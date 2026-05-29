import { useEffect, useRef, useState } from 'react'
import Pusher from 'pusher-js'

const PUSHER_KEY = import.meta.env.VITE_PUSHER_KEY || ''
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'mt1'

export function usePusher({ onSOS, onAlert, onSOSResolved }) {
  const pusherRef = useRef(null)
  const channelRef = useRef(null)
  const [connected, setConnected] = useState(false)

  const onSOSRef = useRef(onSOS)
  const onAlertRef = useRef(onAlert)
  const onSOSResolvedRef = useRef(onSOSResolved)

  useEffect(() => { onSOSRef.current = onSOS }, [onSOS])
  useEffect(() => { onAlertRef.current = onAlert }, [onAlert])
  useEffect(() => { onSOSResolvedRef.current = onSOSResolved }, [onSOSResolved])

  useEffect(() => {
    if (!PUSHER_KEY) {
      console.warn('[Pusher] No VITE_PUSHER_KEY set — real-time push disabled')
      return
    }

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER })
    pusherRef.current = pusher

    pusher.connection.bind('connected', () => setConnected(true))
    pusher.connection.bind('disconnected', () => setConnected(false))
    pusher.connection.bind('error', () => setConnected(false))

    const channel = pusher.subscribe('riverwatch')
    channelRef.current = channel

    channel.bind('sos', (data) => {
      console.log('[Pusher] SOS received:', data)
      onSOSRef.current?.(data)
    })

    channel.bind('alert', (data) => {
      console.log('[Pusher] Alert received:', data)
      onAlertRef.current?.(data)
    })

    channel.bind('sos_resolved', (data) => {
      console.log('[Pusher] SOS resolved:', data)
      onSOSResolvedRef.current?.(data)
    })

    return () => {
      channel.unbind_all()
      pusher.unsubscribe('riverwatch')
      pusher.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { pusherConnected: connected }
}
