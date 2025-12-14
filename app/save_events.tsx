import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { EventCard } from '../components/EventCard2';
import { api } from '../api';

interface Events {
  id: number;
  titol: string;
  descripcio: string | null;
  imgApp: string | null;
  imatges: string | null;
}

interface SavedEventResponse {
  event_id: string;
  event_title: string;
  state: string;
  created_at: string;
}

export default function SavedEventsScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [events, setEvents] = useState<Events[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSavedEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const savedData: SavedEventResponse[] = await api('/saved-events/?state=wishlist');

      if (savedData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const basicEvents: Events[] = savedData.map((item) => ({
        id: parseInt(item.event_id),
        titol: item.event_title,
        descripcio: null,
        imgApp: null,
        imatges: null,
      }));

      setEvents(basicEvents);
      setLoading(false);

      const eventIds = savedData.map((item) => item.event_id);

      const eventsPromises = eventIds.map(async (id) => {
        try {
          const eventData = await api(`/events/${id}/`);
          return eventData;
        } catch (err: any) {
          console.error(`❌ Error loading event ${id}:`, err.message || err);
          const basicEvent = basicEvents.find((e) => e.id === parseInt(id));
          return basicEvent || null;
        }
      });

      const eventsData = await Promise.all(eventsPromises);
      const validEvents = eventsData.filter((event) => event !== null);

      if (validEvents.length > 0) {
        setEvents(validEvents);
      }
    } catch (err: any) {
      console.error('❌ Error loading saved events:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSavedEvents();
  }, []);

  // Recargar eventos cada vez que la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadSavedEvents();
    }, []),
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
        <Text style={{ color: Colors.text, marginBottom: 16 }}>
          {t('Error loading events')}: {error}
        </Text>
        <TouchableOpacity
          onPress={loadSavedEvents}
          style={{
            backgroundColor: Colors.accent,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
          }}
        >
          <Text style={{ color: Colors.card, fontWeight: '600' }}>{t('Retry')}</Text>
        </TouchableOpacity>
      </View>
    );

  if (events.length === 0)
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
        data={events}
        keyExtractor={(item, index) => item?.id?.toString() || `event-${index}`}
        renderItem={({ item }) => {
          return (
            <EventCard
              item={item}
              router={router}
              Colors={Colors}
              onUnsaved={(eventId) => {
                setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
              }}
            />
          );
        }}
        contentContainerStyle={{ paddingBottom: 60, marginTop: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
