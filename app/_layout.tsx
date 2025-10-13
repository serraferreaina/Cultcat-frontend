// app/_layout.tsx
import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeContext'; // import your context

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </ThemeProvider>
  );
}
