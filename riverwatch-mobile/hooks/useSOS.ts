import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import { playSOSSound, stopSOSSound } from '../utils/sosSound';

export type SOSState = 'idle' | 'countdown' | 'sending' | 'active' | 'failed';

export interface SOSCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

const DEVICE_ID_KEY = 'rw_device_id';
const BACKEND_URL_KEY = 'rw_backend_url';
const API_KEY_STORE_KEY = 'rw_api_key';

export function useSOS() {
  const [sosState, setSosState] = useState<SOSState>('idle');
  const [countdown, setCountdown] = useState<number>(0); // 0 to 3 seconds
  const [coords, setCoords] = useState<SOSCoords | null>(null);
  const [activeSosId, setActiveSosId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const liveTrackingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Retrieve storage configuration values helper
  const getAPIConfig = async () => {
    try {
      const deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY) || 'mobile-device';
      const backendUrl = await SecureStore.getItemAsync(BACKEND_URL_KEY) || 'http://localhost:9100';
      const apiKey = await SecureStore.getItemAsync(API_KEY_STORE_KEY) || 'riverwatch-demo';
      return { deviceId, backendUrl, apiKey };
    } catch {
      return { deviceId: 'mobile-device', backendUrl: 'http://localhost:9100', apiKey: 'riverwatch-demo' };
    }
  };

  const startCountdown = () => {
    if (sosState !== 'idle') return;
    setSosState('countdown');
    setCountdown(0);

    let current = 0;
    // Immediate haptic tap
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    countdownIntervalRef.current = setInterval(() => {
      current += 1;
      setCountdown(current);

      if (current === 1) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (current === 2) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (current >= 3) {
        clearInterval(countdownIntervalRef.current!);
        countdownIntervalRef.current = null;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        triggerSOS();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setSosState('idle');
    setCountdown(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Trigger the SOS REST alert
  const triggerSOS = async (messageText = 'SOS Emergency! Immediate assistance requested.') => {
    setSosState('sending');
    setErrorMsg(null);

    try {
      // 1. Request GPS foreground permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // 2. Fetch current exact coordinates
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const sosCoords: SOSCoords = {
        lat: currentLoc.coords.latitude,
        lng: currentLoc.coords.longitude,
        accuracy: currentLoc.coords.accuracy ?? 10,
      };
      setCoords(sosCoords);

      // 3. Retrieve endpoint info
      const { deviceId, backendUrl, apiKey } = await getAPIConfig();

      // 4. POST packet to backend
      const response = await fetch(`${backendUrl}/api/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RiverWatch-Key': apiKey,
        },
        body: JSON.stringify({
          lat: sosCoords.lat,
          lng: sosCoords.lng,
          accuracy: sosCoords.accuracy,
          deviceId: deviceId,
          timestamp: new Date().toISOString(),
          water: 0,
          alert: 'CRITICAL',
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const resData = await response.json();
      const sosId = resData.sosId;
      setActiveSosId(sosId);

      // 5. Sound the alarm sound locally
      await playSOSSound();

      // 6. Enter Active Tracking State
      setSosState('active');

      // 7. Subscribe to continuous live location updates
      watchSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // 10 meters
        },
        (loc) => {
          const updatedCoords = {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracy: loc.coords.accuracy ?? 10,
          };
          setCoords(updatedCoords);
          // Periodically POST updated coordinates to backend
          sendUpdateSOS(sosId, updatedCoords, messageText);
        }
      );

      // 8. Auto-expire live tracking after 60 seconds
      liveTrackingTimerRef.current = setTimeout(() => {
        stopLiveTrackingOnly();
      }, 60000);

    } catch (err: any) {
      console.warn('triggerSOS failed:', err);
      setErrorMsg(err.message || 'Failed to trigger SOS');
      setSosState('failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Helper to update coordinates dynamically
  const sendUpdateSOS = async (sosId: number, c: SOSCoords, msg: string) => {
    try {
      const { deviceId, backendUrl, apiKey } = await getAPIConfig();
      await fetch(`${backendUrl}/api/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-RiverWatch-Key': apiKey,
        },
        body: JSON.stringify({
          id: sosId,
          lat: c.lat,
          lng: c.lng,
          accuracy: c.accuracy,
          deviceId: deviceId,
          timestamp: new Date().toISOString(),
          water: 0,
          alert: 'CRITICAL',
          message: `${msg} (Live Update)`
        }),
      });
    } catch {}
  };

  const stopLiveTrackingOnly = () => {
    if (watchSubscriptionRef.current) {
      watchSubscriptionRef.current.remove();
      watchSubscriptionRef.current = null;
    }
  };

  // Resolve emergency broadcast
  const resolveSOS = async () => {
    stopLiveTrackingOnly();
    if (liveTrackingTimerRef.current) {
      clearTimeout(liveTrackingTimerRef.current);
      liveTrackingTimerRef.current = null;
    }
    
    // Stop local siren tone
    await stopSOSSound();

    if (activeSosId) {
      try {
        const { backendUrl } = await getAPIConfig();
        await fetch(`${backendUrl}/api/sos/${activeSosId}/resolve`, {
          method: 'POST',
        });
      } catch (err) {
        console.warn('Error broadcasting SOS resolution:', err);
      }
    }

    setSosState('idle');
    setCountdown(0);
    setActiveSosId(null);
    setCoords(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Clean up hooks on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      if (watchSubscriptionRef.current) watchSubscriptionRef.current.remove();
      if (liveTrackingTimerRef.current) clearTimeout(liveTrackingTimerRef.current);
      stopSOSSound().catch(() => {});
    };
  }, []);

  return {
    sosState,
    countdown,
    coords,
    activeSosId,
    errorMsg,
    startCountdown,
    cancelCountdown,
    resolveSOS,
  };
}
