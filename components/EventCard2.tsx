import React, { useState, useEffect } from 'react';
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
import { ShareEventModal } from './ShareEventModal';
import { api } from '../api';

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

// Función para verificar si una fecha es hoy
const isToday = (date: Date): boolean => {
  const today = new Date();
  const compareDate = new Date(date);

  return (
    today.getDate() === compareDate.getDate() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getFullYear() === compareDate.getFullYear()
  );
};

// Función para verificar si una fecha es mañana
const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const compareDate = new Date(date);

  return (
    tomorrow.getDate() === compareDate.getDate() &&
    tomorrow.getMonth() === compareDate.getMonth() &&
    tomorrow.getFullYear() === compareDate.getFullYear()
  );
};

// Función para verificar si la fecha de asistencia ya ha pasado (antes de hoy)
const hasAttendanceDatePassed = (attendanceDate: Date): boolean => {
  const today = new Date();
  const attendance = new Date(attendanceDate);

  // Comparar solo año, mes y día (ignorar horas)
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const attendanceOnlyDate = new Date(
    attendance.getFullYear(),
    attendance.getMonth(),
    attendance.getDate(),
  );

  // Solo ha pasado si es ANTES de hoy (no incluye hoy)
  return attendanceOnlyDate < todayDate;
};

// Función para verificar si el evento ya ha pasado completamente
const hasEventPassedCompletely = (event: Event): boolean => {
  if (!event.data_fi) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(event.data_fi);
  endDate.setHours(0, 0, 0, 0);

  return endDate < today;
};

const normalizeDate = (date: Date): Date => {
  // Crear una nova data amb les hores establertes al migdia en zona horària LOCAL
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
  return normalized;
};

export const EventCard: React.FC<EventCardProps> = ({ item, router, Colors, onUnsaved }) => {
  const { goingEvents, attendanceDates, toggleGoing } = useEventStatus();

  const { t, i18n } = useTranslation();
  const [isUnsaving, setIsUnsaving] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSaved, setIsSaved] = useState(false);

  const isGoing = !!goingEvents[item.id];

  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Obtener fecha de asistencia guardada
  const attendanceDate = attendanceDates[item.id]
    ? (() => {
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

  const eventHasPassedCompletely = hasEventPassedCompletely(item);

  // Si tiene fecha de asistencia, verificar si esa fecha ya pasó o es hoy
  const userAttendancePassed = attendanceDate ? hasAttendanceDatePassed(attendanceDate) : false;
  const userAttendanceIsToday = attendanceDate ? isToday(attendanceDate) : false;
  const userAttendanceIsTomorrow = attendanceDate ? isTomorrow(attendanceDate) : false;
  const userAttendanceIsFuture = attendanceDate && !userAttendancePassed && !userAttendanceIsToday;

  // Comprovar l'estat de guardat quan es munta el component
  useEffect(() => {
    const checkSaved = async () => {
      try {
        const data = await api('/saved-events/?state=wishlist');
        const saved = data.some((e: any) => parseInt(e.event_id) === item.id);
        setIsSaved(saved);
      } catch (err) {
        console.error('Error checking saved status:', err);
      }
    };

    checkSaved();
  }, [item.id]);

  // Calcular fechas mínima y máxima para el selector
  const getMinMaxDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = item.data_inici ? new Date(item.data_inici) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Siempre empezar desde mañana como mínimo
    let minDate = tomorrow;

    // Si el evento empieza después de mañana, usar esa fecha
    if (startDate > tomorrow) {
      minDate = startDate;
    }

    const maxDate = item.data_fi ? new Date(item.data_fi) : new Date();

    return { minDate, maxDate };
  };

  const handleToggleSaved = async () => {
    if (isUnsaving) return;

    setIsUnsaving(true);

    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      if (wasSaved) {
        await api(`/save/${item.id}/`, {
          method: 'DELETE',
        });

        if (onUnsaved) {
          onUnsaved(item.id);
        }
      } else {
        // Para wishlist (bookmark), siempre usar la fecha de fin del evento
        // Si no hay fecha de fin, usar la fecha de inicio
        let attendanceDate: string;

        if (item.data_fi) {
          attendanceDate = new Date(item.data_fi).toISOString().split('T')[0];
        } else if (item.data_inici) {
          attendanceDate = new Date(item.data_inici).toISOString().split('T')[0];
        } else {
          // Si no hay ninguna fecha, usar hoy
          attendanceDate = new Date().toISOString().split('T')[0];
        }

        await api(`/save/${item.id}/`, {
          method: 'POST',
          body: JSON.stringify({
            state: 'wishlist',
            attendance_date: attendanceDate,
          }),
        });
      }
    } catch (err: any) {
      console.error('❌ Error toggling saved:', err);
      // Revertir l'estat en cas d'error
      setIsSaved(wasSaved);
    } finally {
      setIsUnsaving(false);
    }
  };

  const handleButtonPress = () => {
    // Si la fecha de asistencia del usuario es hoy, no permitir cambios
    if (userAttendanceIsToday) {
      return;
    }

    // Si la fecha de asistencia del usuario ya pasó, no permitir cambios
    if (userAttendancePassed) {
      return;
    }

    // Si ya ha pasado completamente el evento, no permitir cambios
    if (eventHasPassedCompletely) {
      return;
    }

    if (!isGoing) {
      const { minDate, maxDate } = getMinMaxDates();

      const isSingleDay = minDate.getTime() === maxDate.getTime();

      if (isSingleDay) {
        // Normalitzar la data abans d'enviar
        const normalizedMinDate = normalizeDate(minDate);
        toggleGoing(item.id, normalizedMinDate);
      } else {
        // Resetear selectedDate a minDate cuando abrimos el modal
        setSelectedDate(minDate);
        setShowDateModal(true);
      }
    } else {
      toggleGoing(item.id);
    }
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
    await toggleGoing(item.id, normalizedDate);
    setShowDatePicker(false);
    setShowDateModal(false);
  };

  const getButtonText = () => {
    if (userAttendanceIsToday) {
      return t('Today is the event');
    } else if (userAttendancePassed) {
      const formattedDate = attendanceDate!.toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
      });
      return t('You attended');
    } else if (eventHasPassedCompletely && !attendanceDate) {
      return t('No vares assistir');
    } else if (attendanceDate && (userAttendanceIsFuture || userAttendanceIsTomorrow)) {
      const formattedDate = attendanceDate.toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
      });
      return t('I will attend') + ` - ${formattedDate}`;
    } else if (isGoing && !attendanceDate) {
      return t('I will attend');
    } else {
      return t('Want to go');
    }
  };

  const getButtonColor = () => {
    if (userAttendanceIsToday) {
      return '#FFA500';
    } else if (userAttendancePassed || eventHasPassedCompletely) {
      return '#FF6B6B';
    } else if (isGoing) {
      return Colors.going;
    } else {
      return Colors.accent;
    }
  };

  const isButtonDisabled = () => {
    return userAttendanceIsToday || userAttendancePassed || eventHasPassedCompletely;
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

          {/* Message for today's event */}
          {userAttendanceIsToday && (
            <Text style={[styles.messageText, { color: Colors.accent }]}>Recorda assistir-hi</Text>
          )}

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
                onPress={() => setShareModalVisible(true)}
              >
                <Ionicons name="share-social-outline" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* DYNAMIC BUTTON with new logic */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: getButtonColor(), opacity: isButtonDisabled() ? 0.7 : 1 },
              ]}
              onPress={handleButtonPress}
              disabled={isButtonDisabled()}
            >
              <Text style={[styles.buttonText, { color: Colors.card }]}>{getButtonText()}</Text>
            </TouchableOpacity>
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

      <ShareEventModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        event={{
          id: item.id,
          titol: item.titol || '',
          descripcio: '',
          imgApp: item.imgApp,
          imatges: item.imatges,
          data_inici: item.data_inici,
          data_fi: item.data_fi,
          localitat: item.localitat || null,
          enllacos: {},
          infoEntrades: item.infoEntrades || null,
          infoHorari: item.infoHorari || null,
          gratuita: false,
          modalitat: item.modalitat || null,
          direccio: item.direccio || null,
          espai: item.espai || null,
          georeferencia: null,
          latitud: null,
          longitud: null,
          telefon: null,
          email: null,
        }}
        Colors={Colors}
      />
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 9,
    fontWeight: '500',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardButtonsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    marginRight: 8,
  },
  comments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCount: {
    fontSize: 12,
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    flexShrink: 1,
  },
  buttonText: {
    fontWeight: '400',
    fontSize: 8,
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
