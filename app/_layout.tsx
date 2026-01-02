// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import { NotificationsProvider } from '../context/NotificationContext';
import { LanguageProvider } from '../context/LanguageContext';
import { restoreBackendPreferences } from '../hooks/usePreferencesSync';

function RootLayoutContent() {
  const { i18n } = useTranslation();
  const { setTheme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        // 🔥 PRIMERO: Restaurar preferencias del backend si hay sesión activa
        await restoreBackendPreferences(i18n, setTheme);

        // Si no hay preferencias del backend, usar las locales
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
