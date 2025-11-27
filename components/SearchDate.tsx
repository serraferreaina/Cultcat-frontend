// components/DateSearchButton.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

export default function SearchDate({
  onFilter,
}: {
  onFilter: (filter: { type: 'single' | 'range' | 'from'; date1: Date; date2?: Date }) => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [modalVisible, setModalVisible] = useState(false);

  const [datePickerVisible, setDatePickerVisible] = useState(false);
  //const [secondPickerVisible, setSecondPickerVisible] = useState(false);

  const [option, setOption] = useState<'single' | 'range' | 'from' | null>(null);
  const [step, setStep] = useState<'date1' | 'date2' | null>(null);
  const [date1, setDate1] = useState<Date | null>(null);

  //const [date2, setDate2] = useState<Date | null>(null);

  const resetState = () => {
    //setDate1(null);
    //setDate2(null);
    setOption(null);
    setStep(null);
    setDate1(null);
    //setDatePickerVisible(false);
    //setSecondPickerVisible(false);
  };

  const openOption = (opt: 'single' | 'range' | 'from') => {
    resetState();
    setOption(opt);
    setModalVisible(false);

    setStep('date1');

    setTimeout(() => {
      setDatePickerVisible(true);
    }, 50);
  };

  const handleConfirm = (date: Date) => {
    const clean = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // --- PRIMERA FECHA ---
    if (step === 'date1') {
      setDate1(clean);
      setDatePickerVisible(false);

      if (option === 'range') {
        // Abrimos el selector de la segunda fecha
        setTimeout(() => {
          setStep('date2');
          setDatePickerVisible(true);
        }, 200);
      } else {
        // single o from
        onFilter({ type: option!, date1: clean });
        resetState();
      }
      return;
    }

    // --- SEGUNDA FECHA ---
    if (step === 'date2') {
      setDatePickerVisible(false);

      onFilter({
        type: 'range',
        date1: date1!,
        date2: clean,
      });

      resetState();
    }
  };

  /*const handleDate1 = (date: Date) => {
    const clean = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setDate1(clean);
    setDatePickerVisible(false);

    if (option === 'range') {
      setTimeout(() => setSecondPickerVisible(true), 100);
    } else {
      onFilter({ type: option!, date1: clean });
      setTimeout(() => resetState(), 200);
    }
  };

  const handleDate2 = (date: Date) => {
    const clean = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setDate2(clean);
    setSecondPickerVisible(false);

    onFilter({
      type: 'range',
      date1: date1!,
      date2: clean,
    });
    setTimeout(() => resetState(), 200);
  };*/

  return (
    <View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: Colors.card }]}
        onPress={() => setModalVisible(true)}
      >
        <Calendar color={Colors.text} size={20} />
        <Text style={[styles.text, { color: Colors.text }]}>{t('Date')}</Text>
      </TouchableOpacity>

      {/* Modal amb les 3 opcions de filtrat per data */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: Colors.card }]}>
            <TouchableOpacity onPress={() => openOption('single')} style={styles.optionItem}>
              <Text style={[styles.optionText, { color: Colors.text }]}>
                {t('Search one date')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openOption('range')} style={styles.optionItem}>
              <Text style={[styles.optionText, { color: Colors.text }]}>
                {t('Search between dates')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => openOption('from')} style={styles.optionItem}>
              <Text style={[styles.optionText, { color: Colors.text }]}>
                {t('Search from date')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={{ color: Colors.text }}>{t('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Primer selector */}
      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={() => {
          setDatePickerVisible(false);
          resetState();
        }}
      />

      {/* Segundo selector (solo para rango)
      <DateTimePickerModal
        isVisible={secondPickerVisible}
        mode="date"
        onConfirm={handleDate2}
        onCancel={() => setSecondPickerVisible(false)}
      />*/}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  text: { fontSize: 16 },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '75%',
    padding: 18,
    borderRadius: 14,
  },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  optionText: {
    fontSize: 15,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
});
