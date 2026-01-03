import React, { useState } from 'react';
import { View, Text, Button, Modal, TouchableOpacity, StyleSheet } from 'react-native';
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
}

export default function DateFilterComponent({
  mode: initialMode = 'one',
  onModeChange,
  onDatesChange,
  backgroundColor = '#fff',
  textColor = '#000',
}: DateFilterProps) {
  const { t } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [mode, setMode] = useState<DateFilterMode>(initialMode);

  const [date, setDate] = useState(new Date());
  const [date1, setDate1] = useState(new Date());
  const [date2, setDate2] = useState(new Date());
  const [fromDate, setFromDate] = useState(new Date());

  const handleChange = (type: string, value: Date) => {
    if (!value) return;
    if (type === 'date') {
      setDate(value);
      onDatesChange({ date: value });
    }
    if (type === 'date1') {
      setDate1(value);
      onDatesChange({ date1: value, date2 });
    }
    if (type === 'date2') {
      setDate2(value);
      onDatesChange({ date1, date2: value });
    }
    if (type === 'from') {
      setFromDate(value);
      onDatesChange({ fromDate: value });
    }
  };

  const selectMode = (m: DateFilterMode) => {
    setMode(m);
    onModeChange(m);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor }]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="calendar-outline" size={18} color={textColor} style={{ marginTop: -3 }} />
        <Text style={[styles.filterText, { color: textColor, marginTop: -1 }]}>{t('Date')}</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('SelectMode')}</Text>

            <View
              style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}
            >
              <Button title={t('singleDate')} onPress={() => selectMode('one')} />
              <Button title={t('Search between dates')} onPress={() => selectMode('range')} />
              <Button title={t('Search from date')} onPress={() => selectMode('from')} />
            </View>

            {mode === 'one' && (
              <DateTimePicker
                value={date}
                mode="date"
                onChange={(e, d) => d && handleChange('date', d)}
              />
            )}
            {mode === 'range' && (
              <View>
                <Text>{t('startDate')}:</Text>
                <DateTimePicker
                  value={date1}
                  mode="date"
                  onChange={(e, d) => d && handleChange('date1', d)}
                />
                <Text>{t('endDate')}:</Text>
                <DateTimePicker
                  value={date2}
                  mode="date"
                  onChange={(e, d) => d && handleChange('date2', d)}
                />
              </View>
            )}
            {mode === 'from' && (
              <View>
                <Text>{t('selectStartDate')}:</Text>
                <DateTimePicker
                  value={fromDate}
                  mode="date"
                  onChange={(e, d) => d && handleChange('from', d)}
                />
              </View>
            )}

            <Button title={t('Close')} onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    minHeight: 38,
  },
  filterText: {
    fontSize: 10,
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
});
