import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

/* ----------  THEME  ---------- */
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

/* ----------  MOCK EVENTS  ---------- */
const eventsData: Record<string, { id: number; time: string; title: string; color: string }[]> = {
  '2025-11-15': [
    { id: 1, time: '09:00', title: "Reunió d'equip", color: '#7057FF' },
    { id: 2, time: '14:30', title: 'Presentació client', color: '#C86A2E' },
  ],
  '2025-11-20': [{ id: 3, time: '10:00', title: 'Workshop disseny', color: '#4CAF50' }],
  '2025-11-25': [
    { id: 4, time: '11:00', title: 'Revisió projecte', color: '#FF5722' },
    { id: 5, time: '15:00', title: 'Cafè amb col·laboradors', color: '#2196F3' },
    { id: 6, time: '18:00', title: 'Classe de ioga', color: '#9C27B0' },
  ],
};

export default function CalendarScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DarkColors : LightColors;

  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState(today);

  /* ----------  MARKED DATES  ---------- */
  const markedDates: any = {};
  Object.keys(eventsData).forEach((date) => {
    markedDates[date] = { marked: true, dotColor: colors.accent };
  });
  markedDates[selected] = {
    ...markedDates[selected],
    selected: true,
    selectedColor: colors.accent,
    selectedTextColor: colors.card,
  };

  const selectedEvents = eventsData[selected] ?? [];

  const selectedDate = new Date(selected + 'T00:00:00');
  const formattedDate = selectedDate.toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  /* ----------  RENDER  ---------- */
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* -------  HEADER  ------- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
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

      {/* -------  CALENDAR  ------- */}
      <Calendar
        key={theme} /* forces re-render on theme change */
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

      {/* -------  EVENTS  ------- */}
      <View style={styles.eventsContainer}>
        <Text style={[styles.dateHeader, { color: colors.text }]}>{formattedDate}</Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventCard,
                  { backgroundColor: colors.card, shadowColor: colors.shadow },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                <View style={styles.eventContent}>
                  <Text style={[styles.eventTime, { color: colors.accent }]}>{event.time}</Text>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color={colors.placeholder} />
              <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>
                {t('noEvents')}
              </Text>
            </View>
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
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventColorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: { flex: 1 },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
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
