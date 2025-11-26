// app/calendar.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useEventStatus } from '../context/EventStatus';
import { api } from '../api';
import { EventCard } from '../components/EventCard2';

/* ----------  TYPES  ---------- */
type SavedEvent = {
  event_id: string;
  event_title: string;
  state: string;
  created_at: string;
};

type EventDetail = {
  id: number;
  titol: string;
  data_inici: string | null;
  color?: string;
};

/* ----------  COMPONENT  ---------- */
export default function CalendarScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DarkColors : LightColors;
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();

  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState(today);
  const [goingByDate, setGoingByDate] = useState<Record<string, EventDetail[]>>({});
  const [noDateEvents, setNoDateEvents] = useState<EventDetail[]>([]);
  const [loading, setLoading] = useState(true);

  /* ----------  DATA  ---------- */
  useEffect(() => {
    fetchWantToGoEvents();
  }, [goingEvents]);

  async function fetchWantToGoEvents() {
    setLoading(true);
    try {
      const saved: SavedEvent[] = await api('/saved-events/?state=wantToGo');
      const details: EventDetail[] = await Promise.all(
        saved.map((se) => api(`/events/${se.event_id}/`)),
      );

      const withDate: Record<string, EventDetail[]> = {};
      const without: EventDetail[] = [];

      details.forEach((ev) => {
        if (!ev.data_inici) {
          without.push(ev);
        } else {
          const day = ev.data_inici.slice(0, 10);
          withDate[day] ??= [];
          withDate[day].push(ev);
        }
      });

      setGoingByDate(withDate);
      setNoDateEvents(without);
    } catch (err) {
      console.error('Error loading wantToGo events:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ----------  CALENDAR MARKINGS  ---------- */
  const markedDates: any = {};
  Object.keys(goingByDate).forEach((date) => {
    markedDates[date] = { marked: true, dotColor: colors.accent };
  });
  markedDates[selected] = {
    ...markedDates[selected],
    selected: true,
    selectedColor: colors.accent,
    selectedTextColor: colors.card,
  };

  const selectedEvents = goingByDate[selected] || [];

  /* ----------  RENDER  ---------- */
  if (loading) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('calendar')}</Text>
        <TouchableOpacity
          style={[styles.todayButton, { borderColor: colors.accent }]}
          onPress={() => setSelected(today)}
        >
          <Text style={[styles.todayButtonText, { color: colors.accent }]}>{t('today')}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        key={theme}
        onDayPress={(day: DateData) => setSelected(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.accent,
          selectedDayTextColor: colors.card,
          todayTextColor: colors.accent,
          dayTextColor: colors.text,
          textDisabledColor: colors.placeholder,
          dotColor: colors.accent,
          selectedDotColor: colors.card,
          arrowColor: colors.accent,
          monthTextColor: colors.text,
          textMonthFontWeight: 'bold',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        style={[styles.calendar, { borderBottomColor: colors.border }]}
      />

      {/* Events list */}
      <View style={styles.eventsContainer}>
        <Text style={[styles.dateHeader, { color: colors.text }]}>
          {new Date(selected + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <EventCard
                key={event.id}
                item={event}
                toggleGoing={toggleGoing}
                toggleSaved={toggleSaved}
                goingEvents={goingEvents}
                savedEvents={savedEvents}
                router={router}
                Colors={colors}
              />
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
              <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>
                {t('noEvents')}
              </Text>
            </View>
          )}

          {/* No-date events */}
          {noDateEvents.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('noDateEvents')}</Text>
              {noDateEvents.map((event) => (
                <EventCard
                  key={event.id}
                  item={event}
                  toggleGoing={toggleGoing}
                  toggleSaved={toggleSaved}
                  goingEvents={goingEvents}
                  savedEvents={savedEvents}
                  router={router}
                  Colors={colors}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>
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
    flex: 1,
    marginLeft: 12,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  calendar: {
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noEventsText: {
    fontSize: 16,
    marginTop: 12,
  },
});
