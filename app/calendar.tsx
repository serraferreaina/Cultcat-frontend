import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

// --- Mock events (unchanged) ---
const eventsData: { [key: string]: { id: number; time: string; title: string; color: string }[] } =
  {
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

  const today = new Date().toISOString().split('T')[0];
  const [selected, setSelected] = useState(today);

  // Marked calendar days with dots
  const markedDates: any = {};
  Object.keys(eventsData).forEach((date) => {
    markedDates[date] = {
      marked: true,
      dotColor: '#7057FF',
    };
  });

  // Selected day style
  markedDates[selected] = {
    ...markedDates[selected],
    selected: true,
    selectedColor: '#7057FF',
    selectedTextColor: '#fff',
  };

  const selectedEvents = eventsData[selected] || [];

  // Date formatted based on the current i18n language
  const selectedDate = new Date(selected + 'T00:00:00');
  const formattedDate = selectedDate.toLocaleDateString(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#311C0C" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('calendar')}</Text>

        <TouchableOpacity style={styles.todayButton} onPress={() => setSelected(today)}>
          <Text style={styles.todayButtonText}>{t('today')}</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <Calendar
        onDayPress={(day) => setSelected(day.dateString)}
        markedDates={markedDates}
        theme={{
          backgroundColor: '#F7F0E2',
          calendarBackground: '#F7F0E2',
          textSectionTitleColor: '#8B7355',
          selectedDayBackgroundColor: '#7057FF',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#C86A2E',
          dayTextColor: '#311C0C',
          textDisabledColor: '#D0C4B0',
          dotColor: '#7057FF',
          selectedDotColor: '#ffffff',
          arrowColor: '#C86A2E',
          monthTextColor: '#311C0C',
          textMonthFontWeight: 'bold',
          textDayFontSize: 16,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
      />

      {/* Events list */}
      <View style={styles.eventsContainer}>
        <Text style={styles.dateHeader}>{formattedDate}</Text>

        <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.7}>
                <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTime}>{event.time}</Text>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#8B7355" />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color="#D0C4B0" />
              <Text style={styles.noEventsText}>{t('noEvents')}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F0E2',
  },
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
    color: '#311C0C',
    flex: 1,
    marginLeft: 12,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C86A2E',
  },
  todayButtonText: {
    color: '#C86A2E',
    fontSize: 14,
    fontWeight: '600',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5DCC8',
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
    color: '#311C0C',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
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
  eventContent: {
    flex: 1,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7057FF',
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#311C0C',
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  noEventsText: {
    fontSize: 16,
    color: '#8B7355',
    marginTop: 12,
  },
});
