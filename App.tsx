import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme } from '@react-navigation/native';
import TrackingNotification from './src/components/TrackingNotification';
import GPSTracker from './src/components/GPSTracker';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={DarkTheme}>
        <AppNavigator />
        {/* Глобальные сервисы */}
        <GPSTracker />
        <TrackingNotification />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
