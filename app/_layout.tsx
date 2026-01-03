// app/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import { NotificationsProvider } from '../context/NotificationContext';
import { LanguageProvider } from '../context/LanguageContext';
import { restoreBackendPreferences } from '../hooks/usePreferencesSync';

import i18n from '../i18n';

function RootLayoutContent() {
  const [isReady, setIsReady] = useState(false);
  const { setTheme } = useTheme();

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
