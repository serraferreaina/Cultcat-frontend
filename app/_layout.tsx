// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeContext';
import { EventStatusProvider } from '../context/EventStatus'; // añadir import

export default function RootLayout() {
  return (
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
  );
}
