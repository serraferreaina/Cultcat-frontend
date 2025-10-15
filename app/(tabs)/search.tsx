// app/(tabs)/cerca.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import SearchBar from '../../components/SearchBar';
import SearchDate from '../../components/SearchDate';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import React, { useState } from 'react';


export default function CercaScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Filtrar segons data
    console.log('Buscar eventos del:', date.toISOString());
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView style={styles.content}>
        <SearchBar />
        <SearchDate onDateSelect={handleDateSelect} />

        {selectedDate && (
          <Text style={[styles.dateText, { color: Colors.text }]}>
            Mostrando eventos del: {selectedDate.toLocaleDateString()}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  dateText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
});
