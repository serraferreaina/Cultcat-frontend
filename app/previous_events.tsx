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

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch attended and wantToGo saved events
      const [attended, wantToGo] = await Promise.all([
        getSavedEvents('attended'),
        getSavedEvents('wantToGo'),
      ]);

      // Filter wantToGo with attendance_date before today
      const expiredWantToGo = (wantToGo || []).filter((e) => {
        if (!e.attendance_date) return false;
        const d = new Date(e.attendance_date);
        d.setHours(0, 0, 0, 0);
        return d < today;
      });

      // Combine both sets with a type marker
      const combined = [
        ...((attended || []).map((e) => ({ type: 'attended' as const, meta: e }))),
        ...expiredWantToGo.map((e) => ({ type: 'expired_wantToGo' as const, meta: e })),
      ];

      // Fetch full event details
      const detailed = (
        await Promise.all(
          combined.map(async (entry) => {
            try {
              const ev = await getEventById(entry.meta.event_id);
              return { ev, meta: entry.meta, type: entry.type };
            } catch {
              return null;
            }
          }),
        )
      ).filter(Boolean) as { ev: any; meta: SavedEvent; type: 'attended' | 'expired_wantToGo' }[];

      // Deduplicate by event id in case of overlaps
      const byId = new Map<number, { ev: any; meta: SavedEvent; type: 'attended' | 'expired_wantToGo' }>();
      detailed.forEach((d) => {
        if (!byId.has(d.ev.id)) byId.set(d.ev.id, d);
      });

      const unique = Array.from(byId.values());

      // Sort by effective date: attendance_date if present, else created_at
      unique.sort((a, b) => {
        const daStr = a.meta.attendance_date || a.meta.created_at;
        const dbStr = b.meta.attendance_date || b.meta.created_at;
        const da = new Date(daStr).getTime();
        const db = new Date(dbStr).getTime();
        return db - da;
      });

      setEvents(unique.map((u) => u.ev));
    } catch (error) {
      console.error('❌ Error loading previous events:', error);
      setError(t('There was a problem fetching events'));
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
