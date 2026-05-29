import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AlertBannerPusherProps {
  visible: boolean;
  alertData: {
    level: string;
    risk?: number;
    water?: number;
  } | null;
  onClose: () => void;
}

export function AlertBannerPusher({ visible, alertData, onClose }: AlertBannerPusherProps) {
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible && alertData) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }).start();
      
      // Auto-hide after 6 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, alertData]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!alertData) return null;

  const level = (alertData.level || 'SAFE').toUpperCase();
  const risk = alertData.risk ?? 0;
  
  const getBorderColor = () => {
    if (level === 'CRITICAL' || level === 'DANGER') return '#ef4444';
    if (level === 'WARNING') return '#f59e0b';
    return '#ca8a04';
  };

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          transform: [{ translateY: slideAnim }],
          borderColor: getBorderColor(),
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name="warning" size={24} color="#ef4444" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>🚨 TELEMETRY ALERT LEVEL: {level}</Text>
          <Text style={styles.subtitle}>
            Critical surge index is {risk}/100. High-risk threat declared.
          </Text>
        </View>
        <Pressable onPress={handleDismiss} style={styles.closeBtn}>
          <Ionicons name="close-circle" size={20} color="#718096" />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#0a1628',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#a0aec0',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 12,
  },
  closeBtn: {
    paddingLeft: 8,
  },
});
