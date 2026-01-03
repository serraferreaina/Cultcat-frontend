// services/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BASE_URL = 'http://nattech.fib.upc.edu:40490';

// Configurar com es mostren les notificacions quan l'app està en primer pla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Configurar canal d'Android (obligatori per Android 8+)
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'CultCat Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }
}

// Registrar i obtenir Expo Push Token
export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('⚠️ Has d\'usar un dispositiu físic per Push Notifications');
    return null;
  }

  // Configurar canal d'Android
  if (Platform.OS === 'android') {
    await setupNotificationChannel();
  }

  try {
    // Demanar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permisos de notificacions denegats');
      return null;
    }

    // Obtenir Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '2244d658-5f13-4aef-ad90-49905e4184c0';
    
    const token = (
      await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      })
    ).data;
    
    console.log('✅ Expo Push Token obtingut:', token);
    
    // Guardar token localment
    await AsyncStorage.setItem('expoPushToken', token);
    
    // Enviar token al backend
    await sendTokenToBackend(token);
    
    return token;
  } catch (error) {
    console.error('❌ Error obtenint push token:', error);
    return null;
  }
}

// Enviar token al backend
async function sendTokenToBackend(token: string) {
  try {
    const authToken = await AsyncStorage.getItem('authToken');
    
    if (!authToken) {
      console.log('⚠️ No hi ha authToken, no es pot enviar el push token');
      return;
    }

    const response = await fetch(`${BASE_URL}/users/register-push-token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        expo_push_token: token,
        device_type: Platform.OS,
      }),
    });

    if (response.ok) {
      console.log('✅ Token enviat al backend correctament');
    } else {
      const error = await response.text();
    }
  } catch (error) {
    console.error('❌ Error de xarxa enviant token:', error);
  }
}

// Escoltar quan arriben notificacions
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Quan arriba una notificació (app oberta o en background)
  const listener1 = Notifications.addNotificationReceivedListener((notification) => {
    console.log('📩 Notificació rebuda:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Quan l'usuari toca la notificació
  const listener2 = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('👆 Notificació tocada:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  return {
    listener1,
    listener2,
  };
}

// Enviar notificació local (per testing)
export async function sendLocalNotification(title: string, body: string, data?: any) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // Immediatament
    });
    console.log('✅ Notificació local enviada');
  } catch (error) {
    console.error('❌ Error enviant notificació local:', error);
  }
}

// Testing - Enviar notificació de prova
export async function testPushNotification() {
  const token = await AsyncStorage.getItem('expoPushToken');
  
  if (!token) {
    console.log('❌ No hi ha token guardat');
    return;
  }

  try {
    const message = {
      to: token,
      sound: 'default',
      title: '🎉 Notificació de prova',
      body: 'Les notificacions funcionen correctament!',
      data: { test: true },
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    console.log('✅ Notificació de prova enviada:', result);
    return result;
  } catch (error) {
    console.error('❌ Error enviant notificació de prova:', error);
    return null;
  }
}