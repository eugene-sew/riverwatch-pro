import { useEffect, useRef, useState } from 'react';
import Pusher from 'pusher-js';
import * as Haptics from 'expo-haptics';
import { playAlertBeep } from '../utils/sosSound';

interface PusherMobileProps {
  onAlert?: (data: any) => void;
  onSOSResolved?: (data: any) => void;
}

const PUSHER_KEY = process.env.EXPO_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'mt1';

export function usePusherMobile({ onAlert, onSOSResolved }: PusherMobileProps = {}) {
  const [connected, setConnected] = useState(false);
  
  const onAlertRef = useRef(onAlert);
  const onSOSResolvedRef = useRef(onSOSResolved);
  
  onAlertRef.current = onAlert;
  onSOSResolvedRef.current = onSOSResolved;

  useEffect(() => {
    if (!PUSHER_KEY) {
      console.warn('[Pusher] EXPO_PUBLIC_PUSHER_KEY is not defined — push updates disabled');
      return;
    }

    // Configure Pusher connection
    console.log('[Pusher Debug] Imported Pusher:', Pusher);
    console.log('[Pusher Debug] Type of Pusher:', typeof Pusher);
    console.log('[Pusher Debug] Pusher keys:', Object.keys(Pusher || {}));
    if (Pusher && (Pusher as any).default) {
      console.log('[Pusher Debug] Type of Pusher.default:', typeof (Pusher as any).default);
    }

    let PusherConstructor: any = null;
    if (typeof Pusher === 'function') {
      PusherConstructor = Pusher;
    } else if (Pusher && typeof (Pusher as any).default === 'function') {
      PusherConstructor = (Pusher as any).default;
    } else if (Pusher && typeof (Pusher as any).Pusher === 'function') {
      PusherConstructor = (Pusher as any).Pusher;
    } else {
      console.error('[Pusher Debug] No valid Pusher constructor found!');
      PusherConstructor = Pusher; // Fallback
    }

    const pusher = new PusherConstructor(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      forceTLS: true,
    });

    pusher.connection.bind('connected', () => setConnected(true));
    pusher.connection.bind('disconnected', () => setConnected(false));
    pusher.connection.bind('error', () => setConnected(false));

    const channel = pusher.subscribe('riverwatch');

    // Handle station alert level updates
    channel.bind('alert', (data: any) => {
      console.log('[Pusher Mobile] Alert received:', data);
      
      // 1. Play warning tone
      playAlertBeep();
      
      // 2. Light haptic tap
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      // 3. Trigger callback for Banner slide-down
      if (onAlertRef.current) {
        onAlertRef.current(data);
      }
    });

    // Handle SOS resolution from central dashboard
    channel.bind('sos_resolved', (data: any) => {
      console.log('[Pusher Mobile] SOS resolved:', data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (onSOSResolvedRef.current) {
        onSOSResolvedRef.current(data);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('riverwatch');
      pusher.disconnect();
    };
  }, []);

  return { connected };
}
