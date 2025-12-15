// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus'; // añadir import
import DevAuthWrapper from './(auth)/DevAuthWrapper';
import UserLoader from './UserLoader';

//"scheme": "com.googleusercontent.apps.883633704420-rbd97nlhmkna7mqjklr0bh3h295etjrj" --> pk surti google.com

export default function RootLayout() {
  return (
    <DevAuthWrapper>
      <UserLoader>
        <ThemeProvider>
          <EventStatusProvider>
            {/* envolver toda la app con esto */}
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
            </Stack>
          </EventStatusProvider>
        </ThemeProvider>
      </UserLoader>
    </DevAuthWrapper>
  );
}
