import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Share,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useEventStatus } from '../context/EventStatus';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Event {
  id: number;
  titol?: string;
  localitat?: string;
  imatges?: string | null;
  imgApp?: string | null;
  espai?: string;
  infoHorari?: string;
  modalitat?: string;
  infoEntrades?: string;
  direccio?: string;
  comentaris?: number;
  data_inici?: string | null;
  data_fi?: string | null;
}

interface EventCardProps {
  item: Event;
  router: any;
  Colors: { [key: string]: string };
  onUnsaved?: (eventId: number) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ item, router, Colors, onUnsaved }) => {
  const {
    goingEvents,
    savedEvents,
    assistedEvents,
    attendanceDates,
    toggleGoing,
    toggleSaved,
    toggleAssisted,
  } = useEventStatus();

  const { t } = useTranslation();
  const [isUnsaving, setIsUnsaving] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const isGoing = !!goingEvents[item.id];
  const isSaved = !!savedEvents[item.id];
  const isAssisted = !!assistedEvents[item.id];

  const normalizeDate = (date: Date): Date => {
    // Crear una nova data amb les hores establertes al migdia per evitar problemes de zona horària
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  // Obtener fecha de asistencia guardada y SUMAR UN DÍA para compensar UTC
  const savedAttendanceDate = attendanceDates[item.id]
    ? (() => {
        // Parsejar manualment per evitar problemes de zona horària
        const [year, month, day] = attendanceDates[item.id].split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      })()
    : undefined;
  const images: string[] =
    item.imatges && item.imatges.trim() !== ''
      ? item.imatges.split(',').map((url) => `https://agenda.cultura.gencat.cat${url.trim()}`)
      : item.imgApp && item.imgApp.trim() !== ''
        ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
        : ['https://via.placeholder.com/300x200/FFFFFF/000000?text=Sense+imatge'];

  const imageToShow = images[0];

  const isEventPast = (): boolean => {
    if (!item.data_inici) return false;

    const eventDate = new Date(item.data_inici);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventDate < today;
  };

  const hasEventPassed = (): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Si hay fecha de asistencia guardada, verificar si ya pasó
    // NO sumem el dia aquí perquè estem comparant amb "now"
    if (attendanceDates[item.id]) {
      const savedDate = new Date(attendanceDates[item.id]);
      savedDate.setHours(0, 0, 0, 0);
      if (savedDate < now) {
        return true;
      }
    }

    // Si no hay fecha de asistencia, verificar la fecha de fin del evento
    if (item.data_fi) {
      const endDate = new Date(item.data_fi);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < now) {
        return true;
      }
    }

    return false;
  };

  const isPast = hasEventPassed();

  // Calcular fechas mínima y máxima para el selector
  const getMinMaxDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = item.data_inici ? new Date(item.data_inici) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Si l'esdeveniment ja ha començat (startDate <= today), permetre des d'avui
    // Si encara no ha començat, permetre des de la data d'inici o demà (el que sigui més tard)
    let minDate: Date;
    if (startDate <= today) {
      minDate = today; // L'esdeveniment ja està en curs, permetre avui
    } else {
      minDate = startDate < tomorrow ? tomorrow : startDate;
    }

    const maxDate = item.data_fi ? new Date(item.data_fi) : new Date();

    return { minDate, maxDate };
  };

  const handleToggleSaved = async () => {
    if (isUnsaving) return;

    setIsUnsaving(true);

    try {
      await toggleSaved(item.id);

      if (isSaved && onUnsaved) {
        onUnsaved(item.id);
      }
    } catch (err: any) {
      console.error('❌ Error toggling saved:', err);
    } finally {
      setIsUnsaving(false);
    }
  };

  const handleWantToGo = () => {
    if (!isGoing) {
      // Preparar fecha inicial
      if (item.data_inici) {
        setSelectedDate(new Date(item.data_inici));
      }

      // Comprobar si solo hay un día disponible
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startDate = item.data_inici ? new Date(item.data_inici) : new Date();
      startDate.setHours(0, 0, 0, 0);

      // Calcular minDate igual que a getMinMaxDates
      let minDate: Date;
      if (startDate <= today) {
        minDate = today;
      } else {
        minDate = startDate < tomorrow ? tomorrow : startDate;
      }

      const maxDate = item.data_fi ? new Date(item.data_fi) : new Date();
      maxDate.setHours(0, 0, 0, 0);

      const isSingleDay = minDate.getTime() === maxDate.getTime();

      if (isSingleDay) {
        // Normalitzar la data abans d'enviar
        const normalizedMinDate = normalizeDate(minDate);
        console.log(
          '📅 EventCard - Single day, sending:',
          normalizedMinDate.toISOString().split('T')[0],
        );
        toggleGoing(item.id, normalizedMinDate);
      } else {
        // Si hay múltiples días, mostrar modal
        setShowDateModal(true);
      }
    } else {
      // Desmarcar
      toggleGoing(item.id);
    }
  };

  const handleAssisted = () => {
    toggleAssisted(item.id);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const confirmDate = async () => {
    // Normalitzar la data abans d'enviar-la
    const normalizedDate = normalizeDate(selectedDate);
    console.log('📅 EventCard - Selected date:', selectedDate);
    console.log('📅 EventCard - Normalized date:', normalizedDate);
    console.log('📅 EventCard - Will send to API:', normalizedDate.toISOString().split('T')[0]);
    await toggleGoing(item.id, normalizedDate);
    setShowDatePicker(false);
    setShowDateModal(false);
  };

  // Determinar texto del botón
  const getButtonText = () => {
    if (isPast) {
      if (isAssisted && savedAttendanceDate) {
        const formattedDate = savedAttendanceDate.toLocaleDateString('ca-ES', {
          day: 'numeric',
          month: 'short',
        });
        return `${t('He anat')} - ${formattedDate}`;
      }
      return isAssisted ? t('He anat') : t('Vull anar');
    } else {
      if (isGoing && savedAttendanceDate) {
        const formattedDate = savedAttendanceDate.toLocaleDateString('ca-ES', {
          day: 'numeric',
          month: 'short',
        });
        return `${t('Assistiré')} - ${formattedDate}`;
      }
      return isGoing ? t('Assistiré') : t('Vull assistir');
    }
  };

  const { minDate, maxDate } = getMinMaxDates();

  return (
    <>
      <TouchableOpacity
        style={[styles.eventRow, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
        onPress={() => router.push(`../events/${item.id}`)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: imageToShow }} style={styles.eventImageSide} />

        <View style={styles.eventInfo}>
          <Text style={[styles.eventTitle, { color: Colors.text }]} numberOfLines={2}>
            {item.titol || t('Event without title')}
          </Text>

          <View style={styles.labelContainer}>
            {item.espai && <Label text={item.espai} color={Colors.accent} />}
            {item.localitat && <Label text={item.localitat} color={Colors.accent} />}
          </View>

          <View style={styles.cardButtonsRow}>
            <View style={styles.cardButtonsLeft}>
              {/* Save Button with loading */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleToggleSaved}
                disabled={isUnsaving}
              >
                {isUnsaving ? (
                  <ActivityIndicator size="small" color={Colors.text} />
                ) : (
                  <Ionicons
                    name={isSaved ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={Colors.text}
                  />
                )}
              </TouchableOpacity>

              {/* Comments */}
              <View style={styles.comments}>
                <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
                <Text style={[styles.commentCount, { color: Colors.text }]}>
                  {item.comentaris || 0}
                </Text>
              </View>

              {/* Share */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  const url = `https://tu-app.com/event/${item.id}`;
                  Share.share({ message: `Check this event: ${url}`, url });
                }}
              >
                <Ionicons name="share-social-outline" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* DYNAMIC BUTTON LOGIC */}
            {isPast ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: isAssisted ? Colors.going : Colors.accent },
                ]}
                onPress={handleAssisted}
              >
                <Text style={[styles.buttonText, { color: Colors.card }]}>{getButtonText()}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: isGoing ? Colors.going : Colors.accent }]}
                onPress={handleWantToGo}
              >
                <Text style={[styles.buttonText, { color: Colors.card }]}>{getButtonText()}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>

      {/* MODAL DE SELECCIÓN DE FECHA */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dateModalContainer, { backgroundColor: Colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                {t('Select attendance date')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: Colors.textSecondary }]}>
              {t('Choose the day you want to attend this event')}
            </Text>

            <View style={styles.datePickerContainer}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={minDate}
                  maximumDate={maxDate}
                  locale="ca-ES"
                  textColor={Colors.text}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: Colors.background }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
                    <Text style={[styles.dateButtonText, { color: Colors.text }]}>
                      {selectedDate.toLocaleDateString('ca-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      minimumDate={minDate}
                      maximumDate={maxDate}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: Colors.border }]}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: Colors.text }]}>{t('Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: Colors.accent },
                ]}
                onPress={confirmDate}
              >
                <Text style={[styles.confirmButtonText, { color: Colors.card }]}>
                  {t('Confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const Label: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <View style={[styles.label, { backgroundColor: color + '22' }]}>
    <Text style={[styles.labelText, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    elevation: 2,
    width: '95%',
    alignSelf: 'center',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  eventImageSide: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  eventInfo: {
    flex: 1,
    padding: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  label: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardButtonsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginRight: 12,
  },
  comments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCount: {
    fontSize: 13,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    fontWeight: '400',
    fontSize: 12,
  },
  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
});
