import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { COLORS } from '../theme/theme';

// Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import AboutScreen from '../screens/AboutScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import HerdScreen from '../screens/HerdScreen';
import AIVetScreen from '../screens/AIVetScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AnimalDetailsScreen from '../screens/AnimalDetailsScreen';
import AddAnimalScreen from '../screens/AddAnimalScreen';

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
          height: 80,
          paddingTop: 10,
        },
      }}
    >
      <Tab.Screen 
        name="Map" 
        component={MapScreen} 
        options={{
          tabBarLabel: 'Карта',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🌍</Text>,
        }}
      />
      <Tab.Screen 
        name="Herd" 
        component={HerdScreen} 
        options={{
          tabBarLabel: 'Стадо',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🐄</Text>,
        }}
      />
      <Tab.Screen 
        name="AI" 
        component={AIVetScreen} 
        options={{
          tabBarLabel: 'AI',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🤖</Text>,
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen} 
        options={{
          tabBarLabel: 'Алерты',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🔔</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Stack.Navigator id="AppStack" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="About" component={AboutScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="AnimalDetails" component={AnimalDetailsScreen} />
      <Stack.Screen name="AIVet" component={AIVetScreen} />
      <Stack.Screen name="AddAnimal" component={AddAnimalScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
