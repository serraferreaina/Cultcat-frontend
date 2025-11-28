import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useEventStatus } from '../context/EventStatus';
import { EventCard } from '../components/EventCard2';

interface Events {
  id: number;
  titol: string;
  descripcio: string | null;
  imgApp: string | null;
  imatges: string | null;
}

export default function SavedEventsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const { savedEvents, goingEvents, toggleSaved, toggleGoing } = useEventStatus();
  const router = useRouter();

  const [events, setEvents] = useState<Events[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://nattech.fib.upc.edu:40490/events');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data: Events[] = await res.json();
        setEvents(data);
      } catch (err: any) {
        console.error('Error loading events:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const savedEventsList = React.useMemo(
    () => events.filter((ev) => savedEvents[ev.id]),
    [events, savedEvents],
  );

  if (loading)
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );

  if (error)
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
        ]}
      >
        <Text style={{ color: Colors.text }}>
          {t('Error loading events')}: {error}
        </Text>
      </View>
    );

  if (savedEventsList.length === 0)
    return (
      <View
        style={[
          styles.container,
          { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
        ]}
      >
        <Ionicons name="bookmark-outline" size={48} color={Colors.placeholder} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12 }}>{t('No saved events')}</Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={28} color={Colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: Colors.text }]}>{t('Saved events')}</Text>

        <View style={{ width: 28 }} />
      </View>

      {/* Events list */}
      <FlatList
        data={savedEventsList}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <EventCard item={item} router={router} Colors={Colors} />}
        contentContainerStyle={{ paddingBottom: 60, marginTop: 20 }}
        extraData={savedEvents}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingTop: 45,
  },
  backButton: { width: 28, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
});
