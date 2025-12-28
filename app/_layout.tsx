// app/_layout.tsx
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { ThemeProvider } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import { NotificationsProvider } from '../context/NotificationContext';

export default function RootLayout() {
  const { i18n } = useTranslation();
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

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

  // Gestió de Deep Links
  useEffect(() => {
    // Només configurar deep links quan l'app estigui llesta
    if (!isReady) return;

    // Gestionar l'enllaç inicial (quan l'app s'obre des d'un enllaç)
    const getInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        console.log('📱 Deep Link inicial:', url);
        handleDeepLink(url);
      }
    };

    // Gestionar enllaços mentre l'app està oberta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('📱 Deep Link rebut:', url);
      handleDeepLink(url);
    });

    getInitialURL();

    return () => subscription.remove();
  }, [isReady]);

  const handleDeepLink = (url: string) => {
    try {
      // Parsejar l'URL
      const { hostname, path, queryParams } = Linking.parse(url);

      console.log('🔗 URL parsejat:', { hostname, path, queryParams });

      // Exemples d'enllaços que pot rebre:
      // cultcat://events/123
      // https://cultcat.app/events/123

      if (path?.includes('events/')) {
        // Extreure l'ID de l'esdeveniment
        const eventId = path.split('events/')[1]?.split('/')[0];

        if (eventId) {
          console.log('✅ Navegant a esdeveniment:', eventId);

          // Navegar a la pantalla de detall de l'esdeveniment
          // Petit delay per assegurar que l'app està completament carregada
          setTimeout(() => {
            router.push(`/events/${eventId}`);
          }, 100);
        }
      }
    } catch (error) {
      console.error('❌ Error processant deep link:', error);
    }
  };

  // ⏳ Splash mentre carrega
  if (!isReady) {
    return null;
  }

  // 🚀 Renderitzar l'arbre de navegació
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
