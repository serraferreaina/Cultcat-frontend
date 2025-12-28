import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
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

  const loadPreviousEvents = async () => {
    try {
      setLoading(true);

      // 1️⃣ Obtenir saved-events (IDs)
      const savedEvents: SavedEvent[] = await getSavedEvents();

      // 2️⃣ Carregar el detall complet de cada event
      const detailedEvents = await Promise.all(savedEvents.map((e) => getEventById(e.event_id)));

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 3️⃣ Filtrar events ja passats (AQUÍ ÉS LA CLAU)
      const pastEvents = detailedEvents.filter((event) => {
        if (!event.data_fi && !event.data_inici) return false;

        const endDate = event.data_fi ? new Date(event.data_fi) : new Date(event.data_inici);

        endDate.setHours(0, 0, 0, 0);
        return endDate < today;
      });

      setEvents(pastEvents);
    } catch (error) {
      console.error('❌ Error loading previous events:', error);
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

        <Text style={[styles.headerTitle, { color: Colors.text }]}>{t('Previus events')}</Text>

        {/* Spacer per centrar el títol */}
        <View style={{ width: 24 }} />
      </View>

      {events.length === 0 ? (
        <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
          {t('No previous events')}
        </Text>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <EventCard item={item} router={router} Colors={Colors} />}
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
