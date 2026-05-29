import React, { createContext, useContext, useRef } from 'react';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { useSensors } from '../hooks/useSensors';
import { useSimulator } from '../hooks/useSimulator';
import { useRiskEngine } from '../hooks/useRiskEngine';
import { useTransmitter } from '../hooks/useTransmitter';

// ─── Global Context ────────────────────────────────────────────────
// Hoist all hooks to root so all tabs share the same state.

interface AppContextValue {
  sensors: ReturnType<typeof useSensors>;
  simulator: ReturnType<typeof useSimulator>;
  risk: ReturnType<typeof useRiskEngine>;
  transmitter: ReturnType<typeof useTransmitter>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const sensors = useSensors();
  const simulator = useSimulator();
  const risk = useRiskEngine(sensors, simulator);
  const transmitter = useTransmitter(sensors, simulator, risk);

  return (
    <AppContext.Provider value={{ sensors, simulator, risk, transmitter }}>
      {children}
    </AppContext.Provider>
  );
}

// ─── Tab Layout ────────────────────────────────────────────────────

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: true,
          tabBarStyle: {
            backgroundColor: '#070d1a',
            borderTopColor: '#1a2540',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#00e5b0',
          tabBarInactiveTintColor: '#4a5568',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
            letterSpacing: 0.5,
          },
          headerStyle: {
            backgroundColor: '#070d1a',
            borderBottomColor: '#1a2540',
            borderBottomWidth: 1,
          },
          headerTintColor: '#e0e6f0',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="analytics" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="simulate"
          options={{
            title: 'Simulate',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="options" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AppProvider>
  );
}
