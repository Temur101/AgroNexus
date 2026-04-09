import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { DarkTheme } from '@react-navigation/native';
import TrackingNotification from './src/components/TrackingNotification';
import GPSTracker from './src/components/GPSTracker';
import GeofenceMonitor from './src/components/GeofenceMonitor';
import { registerForPushNotificationsAsync } from './src/utils/notifications';
import { supabase } from './supabase';

export default function App() {
  React.useEffect(() => {
    const setupNotifications = async () => {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ expo_push_token: token })
            .eq('id', user.id);
        }
      }
    };
    
    setupNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={DarkTheme}>
        <AppNavigator />
        {/* Глобальные сервисы */}
        <GPSTracker />
        <GeofenceMonitor />
        <TrackingNotification />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
