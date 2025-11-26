import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStatus } from '../context/EventStatus';
import EventCard from '../components/EventCard';

export default function CercaScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const router = useRouter();
  const { goingEvents, savedEvents, toggleGoing, toggleSaved, loadingSaved } = useEventStatus();

  const [eventsByDate, setEventsByDate] = React.useState<Record<string, any[]>>({});
  const [noDateEvents, setNoDateEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Función para esperar token
  const waitForToken = async (): Promise<string> => {
    while (!global.authToken) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return global.authToken;
  };

  React.useEffect(() => {
    const fetchEvents = async () => {
      if (!Object.keys(savedEvents).length) return;

      setLoading(true);
      try {
        const token = await waitForToken();

        const res = await fetch('http://nattech.fib.upc.edu:40490/events', {
          headers: { Authorization: `Token ${token}` },
        });

        if (!res.ok) {
          console.error('Error fetching events', res.status);
          setEventsByDate({});
          setNoDateEvents([]);
          return;
        }

        const data = await res.json();
        const filtered = data.filter((e: any) => savedEvents[e.id]);

        const byDate: Record<string, any[]> = {};
        const withoutDate: any[] = [];

        filtered.forEach((e: any) => {
          if (!e.data_inici) {
            withoutDate.push(e);
          } else {
            const day = e.data_inici.slice(0, 10);
            if (!byDate[day]) byDate[day] = [];
            byDate[day].push(e);
          }
        });

        setEventsByDate(byDate);
        setNoDateEvents(withoutDate);
      } catch (e) {
        console.error('Error fetching events', e);
        setEventsByDate({});
        setNoDateEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [savedEvents]);

  if (loading || loadingSaved) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>{t('Saved events')}</Text>
        <View style={{ width: 24 }} /> {/* placeholder for spacing */}
      </View>

      {/* Events grouped by date */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}>
        {Object.keys(eventsByDate).length === 0 && noDateEvents.length === 0 && (
          <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.text }}>
            {t('No saved events')}
          </Text>
        )}

        {Object.keys(eventsByDate).sort().map(date => (
          <View key={date}>
            <Text style={[styles.dateHeader, { color: Colors.text }]}>
              {new Date(date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            {eventsByDate[date].map(event => (
              <EventCard key={event.id} item={event} />
            ))}
          </View>
        ))}

        {noDateEvents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t('No date')}</Text>
            {noDateEvents.map(event => (
              <EventCard key={event.id} item={event} />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ----------  STYLES  ---------- */
const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
});
