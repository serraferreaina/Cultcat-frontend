import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EventCard } from '../components/EventCard';
import { useEventStatus } from '../context/EventStatus';
import { LightColors, DarkColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import SearchBar from '../components/SearchBar';
import { useTranslation } from 'react-i18next';

export default function SearchResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ query?: string }>();
  const initialQuery = typeof params.query === 'string' ? params.query : '';
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const fetchEvents = async (search: string) => {
    if (!search.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/events?q=${encodeURIComponent(search)}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const textData = await res.text();
      const data = textData ? JSON.parse(textData) : [];

      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert(t('No events found'), t('No events match', { search }));
        setEvents([]);
        return;
      }

      setEvents(data);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'There was a problem fetching events.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) fetchEvents(initialQuery);
  }, [initialQuery]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 8, marginRight: 16 }}>
          <SearchBar
            onSearch={(query) => {
              setSearchQuery(query);
              fetchEvents(query);
            }}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : events.length === 0 ? (
        <Text style={styles.noEventsText}>{t('No events to display')}</Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <EventCard
              item={item}
              toggleGoing={toggleGoing}
              toggleSaved={toggleSaved}
              goingEvents={goingEvents}
              savedEvents={savedEvents}
              router={router}
              Colors={Colors}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: {
    paddingRight: 10,
    paddingTop: 10,
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  noEventsText: { textAlign: 'center', marginTop: 20, fontSize: 16 },
  eventRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  eventTitle: { fontSize: 16, fontWeight: '600' },
});
