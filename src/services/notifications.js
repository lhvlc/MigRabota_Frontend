import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateProfile } from './api';

// Настройка как показывать уведомления когда приложение открыто
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Получить токен телефона и сохранить в БД
export const registerForPushNotifications = async (userId) => {
  if (!Device.isDevice) {
    console.log('Push работает только на реальном устройстве');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Разрешение на уведомления не получено');
    return null;
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[PUSH] Токен получен:', token);

    // Сохранить токен в базу данных
    await savePushToken(userId, token);
    return token;
  } catch (e) {
    console.error('[PUSH] Ошибка получения токена:', e);
    return null;
  }
};

// Сохранить токен в БД
const savePushToken = async (userId, token) => {
  const res = await fetch(
    `https://asap-horeca-backend-k6q2.onrender.com/users/${userId}/push-token`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken: token }),
    }
  );
  return res.json();
};