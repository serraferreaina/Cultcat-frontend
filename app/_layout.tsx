// app/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import { NotificationsProvider } from '../context/NotificationContext';
import DevAuthWrapper from './(auth)/DevAuthWrapper';
import UserLoader from './UserLoader';

export default function RootLayout() {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    // Cargar idioma guardado al iniciar la app
    (async () => {
      try {
        const storedLang = await AsyncStorage.getItem('appLanguage');
        if (storedLang && ['en', 'es', 'ca'].includes(storedLang)) {
          await i18n.changeLanguage(storedLang);
        }
        setIsReady(true);
      } catch (e) {
        console.error('Error cargando idioma:', e);
        setIsReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const isLogged = await AsyncStorage.getItem('isLoggedIn');

      setLogged(!!token && isLogged === 'true');
      setIsReady(true);
    };
    bootstrap();
  }, []);

  if (!isReady) {
    return null; // o un componente de carga/splash
  }

  if (!logged) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <DevAuthWrapper>
      <UserLoader>
        <ThemeProvider>
          <NotificationsProvider>
            <EventStatusProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)" />
              </Stack>
            </EventStatusProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </UserLoader>
    </DevAuthWrapper>
  );
}
