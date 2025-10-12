import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

const BG = '#F7F0E2';
const TEXT = '#311C0C';
const ACCENT = '#C86A2E';

export default function TabsLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets(); // 👈 Obté alçada del notch i barra inferior

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: '#8B7355',
        tabBarStyle: {
          backgroundColor: BG,
          borderTopColor: 'rgba(200, 106, 46, 0.2)',
          borderTopWidth: 1,
          height: 50 + insets.bottom, // 👈 Afegeix espai segons el dispositiu
          paddingBottom: 12 + insets.bottom / 2, // 👈 Evita que s’encavalqui
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('search'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t('map'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cat" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
