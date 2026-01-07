import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from 'react-i18next';

export type DateFilterMode = 'one' | 'range' | 'from';

export interface DateFilterProps {
  mode?: DateFilterMode;
  onModeChange: (m: DateFilterMode) => void;
  onDatesChange: (dates: { date?: Date; date1?: Date; date2?: Date; fromDate?: Date }) => void;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  borderColor?: string;
}

export default function DateFilterComponent({
  mode: initialMode = 'one',
  onModeChange,
  onDatesChange,
  backgroundColor = '#fff',
  textColor = '#000',
  accentColor = '#ff6347',
  surfaceColor = '#fff',
  borderColor = '#ddd',
}: DateFilterProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<DateFilterMode>(initialMode);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<
    'one' | 'rangeStart' | 'rangeEnd' | 'from' | null
  >(null);

  const [date, setDate] = useState(new Date());
  const [date1, setDate1] = useState(new Date());
  const [date2, setDate2] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());

  const closeAll = () => {
    setPickerVisible(false);
    setModalVisible(false);
    setCurrentPicker(null);
  };

  const selectMode = (m: DateFilterMode) => {
    setMode(m);
    onModeChange(m);
    if (m === 'one') {
      setCurrentPicker('one');
      setPickerVisible(true);
    } else if (m === 'range') {
      setCurrentPicker('rangeStart');
      setPickerVisible(true);
    } else {
      setCurrentPicker('from');
      setPickerVisible(true);
    }
  };

  const handleChange = (_event: any, selected?: Date) => {
    if (!_event || _event.type === 'dismissed') {
      setPickerVisible(false);
      setCurrentPicker(null);
      return;
    }
    if (!selected) return;

    if (currentPicker === 'one') {
      setDate(selected);
      onDatesChange({ date: selected });
      closeAll();
    }
    if (currentPicker === 'rangeStart') {
      setDate1(selected);
      // Move to end date picker
      setCurrentPicker('rangeEnd');
      setPickerVisible(true);
    }
    if (currentPicker === 'rangeEnd') {
      setDate2(selected);
      onDatesChange({ date1, date2: selected });
      closeAll();
    }
    if (currentPicker === 'from') {
      setFromDate(selected);
      onDatesChange({ fromDate: selected });
      closeAll();
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.filterButton,
          {
            backgroundColor,
            shadowColor: backgroundColor === accentColor ? accentColor : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: backgroundColor === accentColor ? 0.25 : 0,
            shadowRadius: 8,
            elevation: backgroundColor === accentColor ? 5 : 1,
            borderWidth: backgroundColor === accentColor ? 0 : 1.5,
            borderColor: backgroundColor === accentColor ? 'transparent' : borderColor,
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={textColor} />
        <Text style={[styles.filterText, { color: textColor }]}>{t('Date')}</Text>
        {backgroundColor === accentColor && (
          <View style={[styles.filterBadge, { backgroundColor: textColor + '40' }]}>
            <Text style={styles.filterBadgeText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: surfaceColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>{t('SelectMode')}</Text>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[styles.optionCard, { borderColor, backgroundColor: surfaceColor }]}
                onPress={() => selectMode('one')}
              >
                <Ionicons name="calendar" size={22} color={accentColor} />
                <Text style={[styles.optionTitle, { color: textColor }]}>
                  {t('Filter single day')}
                </Text>
                <Text style={[styles.optionSub, { color: textColor + 'AA' }]}>
                  {t('Filtrar eventos activos en un día específico')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { borderColor, backgroundColor: surfaceColor }]}
                onPress={() => selectMode('range')}
              >
                <Ionicons name="calendar-number" size={22} color={accentColor} />
                <Text style={[styles.optionTitle, { color: textColor }]}>
                  {t('Filter between dates')}
                </Text>
                <Text style={[styles.optionSub, { color: textColor + 'AA' }]}>
                  {t('Filtrar eventos dentro de un período')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionCard, { borderColor, backgroundColor: surfaceColor }]}
                onPress={() => selectMode('from')}
              >
                <Ionicons name="time" size={22} color={accentColor} />
                <Text style={[styles.optionTitle, { color: textColor }]}>
                  {t('Filter from date')}
                </Text>
                <Text style={[styles.optionSub, { color: textColor + 'AA' }]}>
                  {t('Filtrar eventos activos o futuros desde esta fecha')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: accentColor + '22', borderColor }]}
              onPress={closeAll}
            >
              <Text style={[styles.closeText, { color: accentColor }]}>{t('Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {pickerVisible && (
        <DateTimePicker
          value={
            currentPicker === 'one'
              ? date
              : currentPicker === 'rangeStart'
                ? date1
                : currentPicker === 'rangeEnd'
                  ? date2
                  : fromDate
          }
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 0,
    minHeight: 40,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000055',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  optionCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 2,
    color: '#111',
  },
  optionSub: {
    fontSize: 12,
    color: '#444',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#eee',
    borderRadius: 10,
    borderWidth: 1,
  },
  closeText: {
    fontWeight: '600',
    color: '#222',
  },
});
