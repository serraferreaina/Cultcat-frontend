// components/DateSearchButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

export default function SearchDate({ onDateSelect }: { onDateSelect: (date: Date) => void }) {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [isPickerVisible, setPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleConfirm = (date: Date) => {
    // Normalizamos la fecha (sin horas)
    const onlyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(onlyDate);
    setPickerVisible(false);
    onDateSelect(onlyDate);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors.card }]}
        onPress={() => setPickerVisible(true)}
      >
        <Calendar color={Colors.text} size={20} />
        <Text style={[styles.text, { color: Colors.text }]}>
          {selectedDate ? selectedDate.toLocaleDateString() : 'Seleccionar fecha'}
        </Text>
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={isPickerVisible}
        mode="date" // 👈 solo fecha
        onConfirm={handleConfirm}
        onCancel={() => setPickerVisible(false)}
        display="inline" // o "calendar" en Android para una vista más visual
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
  },
  text: {
    fontSize: 16,
  },
});
