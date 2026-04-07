import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/theme';
import { supabase } from '../../supabase';
import { Session } from '@supabase/supabase-js';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import AboutScreen from '../screens/AboutScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import HerdScreen from '../screens/HerdScreen';
import AIVetScreen from '../screens/AIVetScreen';
import AnimalDetailsScreen from '../screens/AnimalDetailsScreen';
import AddAnimalScreen from '../screens/AddAnimalScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { Home, Map, Layers, Cpu } from 'lucide-react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      id="MainTabs"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 12, marginBottom: 8 },
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1A1A1A',
          height: 85,
          paddingTop: 10,
          paddingBottom: 20,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Главная',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          tabBarLabel: 'Карта',
          tabBarIcon: ({ color, size }) => <Map size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="Herd" 
        component={HerdScreen} 
        options={{
          tabBarLabel: 'Стадо',
          tabBarIcon: ({ color, size }) => <Layers size={size} color={color} />,
        }}
      />
      <Tab.Screen 
        name="AI" 
        component={AIVetScreen} 
        options={{
          tabBarLabel: 'AI Ветеринар',
          tabBarIcon: ({ color, size }) => <Cpu size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Проверяем текущую сессию
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Слушаем изменения состояния авторизации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator id="AppStack" screenOptions={{ headerShown: false }}>
      {session ? (
        // Внутренние экраны для авторизованных
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="AnimalDetails" component={AnimalDetailsScreen} />
          <Stack.Screen name="AIVet" component={AIVetScreen} />
          <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
        </>
      ) : (
        // Экраны авторизации
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
