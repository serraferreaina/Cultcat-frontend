// app/_layout.tsx
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import { NotificationsProvider } from '../context/NotificationContext';
import { LanguageProvider } from '../context/LanguageContext';
import { restoreBackendPreferences } from '../hooks/usePreferencesSync';
import {
  setupNotificationChannel,
  registerForPushNotifications,
  setupNotificationListeners,
} from '../services/pushNotifications';

import i18n from '../i18n';

function RootLayoutContent() {
  const [isReady, setIsReady] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();
  const listeners = useRef<any>(null);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // Restore backend preferences if there's an active session
        await restoreBackendPreferences(i18n, setTheme);

        // If no backend preferences, use local ones
        const storedLang = await AsyncStorage.getItem('appLanguage');
        if (storedLang && ['en', 'es', 'ca'].includes(storedLang)) {
          await i18n.changeLanguage(storedLang);
        }
      } catch (e) {
        console.error('Bootstrap error', e);
      } finally {
        setIsReady(true);
      }
    };

    bootstrap();
  }, []);

  // Inicialitzar notificacions push
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Configurar canal d'Android
        await setupNotificationChannel();

        // Comprovar si té notificacions activades
        const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
        const authToken = await AsyncStorage.getItem('authToken');

        // Si té notificacions activades i està autenticat, registrar token
        if (notifEnabled === 'true' && authToken) {
          await registerForPushNotifications();
        }

        // Configurar listeners
        listeners.current = setupNotificationListeners(
          // Quan arriba una notificació mentre l'app està oberta
          (notification) => {
            // Aquí pots mostrar un toast, actualitzar badge, etc.
          },
          // Quan l'usuari toca la notificació
          (response) => {
            const data = response.notification.request.content.data;

            // Navegar segons el tipus de notificació
            if (
              data.type === 'event' ||
              data.type === 'event_soon' ||
              data.type === 'event_review_pending'
            ) {
              const eventId = data.eventId || data.reference_id;
              if (eventId) {
                router.push(`/events/${eventId}`);
              }
            } else if (data.type === 'reward' || data.type === 'reward_unlocked') {
              router.push('/rewards');
            } else if (
              data.type === 'connection_request_received' ||
              data.type === 'connection_request'
            ) {
              const userId = data.userId || data.from_user_id;
              if (userId) {
                router.push(`/user/${userId}`);
              }
            } else if (data.type === 'comment' || data.type === 'review') {
              if (data.eventId) {
                router.push(`/events/${data.eventId}`);
              }
            }
          },
        );
      } catch (error) {
        console.error('❌ Error inicialitzant notificacions:', error);
      }
    };

    if (isReady) {
      initNotifications();
    }

    // Cleanup
    return () => {
      if (listeners.current) {
        listeners.current.listener1.remove();
        listeners.current.listener2.remove();
      }
    };
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <NotificationsProvider>
          <EventStatusProvider>
            <RootLayoutContent />
          </EventStatusProvider>
        </NotificationsProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
