import { Stack, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus';
import UserLoader from './UserLoader';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const isLogged = await AsyncStorage.getItem('isLoggedIn');

      setLogged(!!token && isLogged === 'true');
      setReady(true);
    };

    bootstrap();
  }, []);

  if (!ready) return null; // ⛔ BLOQUEJA TOT

  if (!logged) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <ThemeProvider>
      <EventStatusProvider>
        <UserLoader>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </UserLoader>
      </EventStatusProvider>
    </ThemeProvider>
  );
}
