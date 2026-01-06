import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { EventCard } from '../components/EventCard2';
import { getSavedEvents, getEventById } from '../api';

/**
 * Tipus que retorna /saved-events
 */
interface SavedEvent {
  event_id: number;
  state: 'attended' | 'wishlist' | 'wantToGo';
  attendance_date: string | null;
  created_at: string;
}

export default function PreviousEventsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPreviousEvents = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch attended saved events
      const savedEvents: SavedEvent[] = await getSavedEvents('attended');

      // Fetch full event details in parallel
      const detailedEvents = (
        await Promise.all(
          (savedEvents || []).map(async (e) => {
            try {
              const ev = await getEventById(e.event_id);
              return { ev, meta: e };
            } catch (err) {
              return null; // Skip if not found
            }
          }),
        )
      ).filter(Boolean) as { ev: any; meta: SavedEvent }[];

      // Sort by when it was marked attended (created_at desc)
      detailedEvents.sort((a, b) => {
        const da = new Date(a.meta.created_at).getTime();
        const db = new Date(b.meta.created_at).getTime();
        return db - da;
      });

      // Keep only event objects for rendering
      setEvents(detailedEvents.map((d) => d.ev));
    } catch (error) {
      console.error('❌ Error loading previous events:', error);
      setError(t('Failed to load attended events'));
    } finally {
      setLoading(false);
    }
  };

  // Recarregar cada cop que entres a la pantalla
  useFocusEffect(
    useCallback(() => {
      loadPreviousEvents();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPreviousEvents();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: Colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/profile')}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: Colors.text }]}>{t('Previous events')}</Text>

        {/* Spacer per centrar el títol */}
        <View style={{ width: 24 }} />
      </View>
      {error ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity onPress={loadPreviousEvents} style={{ marginTop: 12 }}>
            <Text style={{ color: Colors.accent, fontWeight: '600' }}>{t('Retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (events ?? []).length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
            {t('No attended events yet')}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')} style={{ marginTop: 12 }}>
            <Text style={{ color: Colors.accent, fontWeight: '600' }}>{t('Discover events')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={events ?? []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <EventCard item={item} router={router} Colors={Colors} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
