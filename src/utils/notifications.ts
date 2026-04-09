import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Настройка того, как уведомления отображаются, когда приложение открыто
Notifications.setNotificationHandler({
  handleNotification: (notification: any) => {
    return Promise.resolve({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  },
});

export async function registerForPushNotificationsAsync() {
  // В новых версиях Expo Go (SDK 53+) пуши удалены.
  // Возвращаем null, если мы в Expo Go, чтобы не было ошибок и зависаний.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    console.log('Skipping push token registration in Expo Go');
    return null;
  }

  let token;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    // Project ID из app.json необходим для получения токена в новых версиях Expo
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'bed0dd64-4f7a-42f7-aecc-29fd4be499ba'
    })).data;
  } catch (e) {
    console.log('Error getting push token:', e);
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B00',
    });
  }

  return token;
}

export async function sendLocalNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { data: 'goes here' },
      sound: true,
    },
    trigger: null, // немедленно
  });
}
