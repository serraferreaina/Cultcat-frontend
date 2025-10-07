import { Tabs, Redirect } from 'expo-router';
//import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  //const { user } = useAuth();
  //if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
