import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import { NotificationsProvider } from '../context/NotificationContext';

export default function RootLayout() {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
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

  // ⏳ pots posar splash si vols
  if (!isReady) {
    return null;
  }

  // 🚀 SEMPRE renderitza l’arbre
  return (
    <ThemeProvider>
      <NotificationsProvider>
        <EventStatusProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </EventStatusProvider>
      </NotificationsProvider>
    </ThemeProvider>
  );
}
