import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { SOSState } from '../hooks/useSOS';

interface SOSButtonProps {
  state: SOSState;
  countdown: number;
  onPressIn: () => void;
  onPressOut: () => void;
}

export function SOSButton({ state, countdown, onPressIn, onPressOut }: SOSButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (state === 'countdown') {
      // Scale down slightly to indicate pressing down
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      // Scale back to normal
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [state, scaleAnim]);

  // Pulse animation when SOS is active
  useEffect(() => {
    if (state === 'active') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [state, pulseAnim]);

  const getButtonText = () => {
    if (state === 'countdown') {
      return `${3 - Math.floor(countdown)}`;
    }
    if (state === 'sending') {
      return 'SENDING';
    }
    if (state === 'active') {
      return 'SOS ACTIVE';
    }
    if (state === 'failed') {
      return 'RETRY';
    }
    return 'SOS';
  };

  const getButtonBg = () => {
    if (state === 'countdown') return '#b91c1c';
    if (state === 'sending') return '#d97706';
    if (state === 'active') return '#dc2626';
    if (state === 'failed') return '#b91c1c';
    return '#dc2626';
  };

  return (
    <View style={styles.container}>
      {/* Pulsing Backing Ring for Active State */}
      {state === 'active' && (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.25],
                outputRange: [0.6, 0],
              }),
            },
          ]}
        />
      )}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: getButtonBg(),
              shadowOpacity: pressed ? 0.3 : 0.6,
            },
          ]}
        >
          <Text style={styles.buttonText}>{getButtonText()}</Text>
          {state === 'idle' && (
            <Text style={styles.subText}>HOLD 3s</Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  button: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  pulseRing: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#dc2626',
    zIndex: -1,
  },
});
