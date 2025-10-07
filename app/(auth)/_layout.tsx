import { Stack, Redirect } from 'expo-router';
//import { useAuth } from '../../hooks/useAuth';

export default function AuthLayout() {
  //const { user } = useAuth();
  //if (user) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
