import { Tabs, Redirect } from 'expo-router'
import { useTranslation } from 'react-i18next'
//import { useAuth } from '../../hooks/useAuth';

export default function TabsLayout() {
  //const { user } = useAuth();
  //if (!user) return <Redirect href="/(auth)/login" />;

  const { t } = useTranslation()

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: t('home') }} />
      <Tabs.Screen name="profile" options={{ title: t('profile') }} />
    </Tabs>
  )
}
