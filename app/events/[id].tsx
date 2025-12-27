import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Share,
  Modal,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useEventStatus, useEventLogic } from '../../context/EventStatus';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import WeatherIcon from '../../components/WeatherIcon';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventData {
  id: number;
  titol: string;
  descripcio: string;
  enllacos: Record<string, string>;
  imgApp: string | null;
  imatges: string | null;
  infoEntrades: string | null;
  infoHorari: string | null;
  gratuita: boolean;
  modalitat: string | null;
  direccio: string | null;
  espai: string | null;
  localitat: string | null;
  georeferencia: string | null;
  latitud: number | null;
  longitud: number | null;
  telefon: string | null;
  email: string | null;
  data_inici: string | null;
  data_fi: string | null;
}

export default function EventDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;

  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [event, setEvent] = useState<EventData | null>(null);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { savedEvents, toggleSaved } = useEventStatus();

  const [modalOpen, setModalOpen] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);

  // Estados para el selector de fecha
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);

  const shouldHideEvent = (event: EventData): boolean => {
    if (!event.data_fi) return false;

    const endDate = new Date(event.data_fi);
    const targetDate = new Date('2924-06-30');

    return (
      endDate.getFullYear() === targetDate.getFullYear() &&
      endDate.getMonth() === targetDate.getMonth() &&
      endDate.getDate() === targetDate.getDate()
    );
  };

  const normalizeDate = (date: Date): Date => {
    // Crear una nova data amb les hores establertes al migdia per evitar problemes de zona horària
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  // Función para verificar si el evento ya ha pasado
  const hasEventPassed = (event: EventData, attendanceDate?: Date): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (attendanceDate) {
      const attendance = new Date(attendanceDate);
      attendance.setHours(0, 0, 0, 0);
      if (attendance < now) {
        return true;
      }
    }

    if (event.data_fi) {
      const endDate = new Date(event.data_fi);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < now) {
        return true;
      }
    }

    return false;
  };

  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetail = async () => {
      try {
        const res = await fetch(`http://nattech.fib.upc.edu:40490/events/${eventId}`);
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();

        if (shouldHideEvent(data)) {
          setError('Event not available');
          setLoading(false);
          return;
        }

        setEvent(data);

        if (data.data_inici) {
          setSelectedDate(new Date(data.data_inici));
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [eventId]);

  const formatEventDate = (startDate: string | null, endDate: string | null): string => {
    if (!startDate) return t('Date not available');

    const start = new Date(startDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    if (endDate && endDate !== startDate) {
      const end = new Date(endDate);
      return `Data inici: ${start.toLocaleDateString('ca-ES', options)} - Data fi: ${end.toLocaleDateString('ca-ES', options)}`;
    }

    return start.toLocaleDateString('ca-ES', options);
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const confirmDate = () => {
    if ((window as any).confirmAttendance) {
      (window as any).confirmAttendance();
    }
  };

  if (load) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.background }]}>
        <Text style={{ color: Colors.text }}>{t('Error loading event')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.accent }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const LogicWrapper = () => {
    const eventLogic = useEventLogic(event);
    const { isActive, toggle, textKey, textKeyInactive } = eventLogic;

    const attendanceDate =
      'attendanceDate' in eventLogic && eventLogic.attendanceDate instanceof Date
        ? eventLogic.attendanceDate
        : undefined;

    const isPast = hasEventPassed(event, attendanceDate);

    // Calcular si solo hay un día disponible
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = event.data_inici ? new Date(event.data_inici) : new Date();
    startDate.setHours(0, 0, 0, 0);

    // Si l'esdeveniment ja ha començat, permetre des d'avui
    let minDate: Date;
    if (startDate <= today) {
      minDate = today;
    } else {
      minDate = startDate < tomorrow ? tomorrow : startDate;
    }

    const maxDate = event.data_fi ? new Date(event.data_fi) : new Date();
    maxDate.setHours(0, 0, 0, 0);

    // Comprobar si minDate y maxDate son el mismo día
    const isSingleDay = minDate.getTime() === maxDate.getTime();

    const handleWantToGo = () => {
      if (!isActive) {
        if (isSingleDay) {
          // Si solo hay un día disponible, usar automáticamente ese día (normalitzat)
          const normalizedMinDate = normalizeDate(minDate);
          toggle(normalizedMinDate);
        } else {
          // Si hay múltiples días, mostrar selector
          setShowDateModal(true);
        }
      } else {
        toggle();
      }
    };

    const handleConfirmDate = () => {
      // Normalitzar la data abans d'enviar-la
      const normalizedDate = normalizeDate(selectedDate);
      console.log('📅 Selected date:', selectedDate);
      console.log('📅 Normalized date:', normalizedDate);
      console.log('📅 Will send to API:', normalizedDate.toISOString().split('T')[0]);
      toggle(normalizedDate);
      setShowDatePicker(false);
      setShowDateModal(false);
    };

    React.useEffect(() => {
      (window as any).confirmAttendance = handleConfirmDate;
    }, [selectedDate]);

    let buttonText = '';
    if (isPast) {
      if (isActive && attendanceDate) {
        const formattedDate = attendanceDate.toLocaleDateString('ca-ES', {
          day: 'numeric',
          month: 'short',
        });
        buttonText = `${t('He anat')} - ${formattedDate}`;
      } else {
        buttonText = isActive ? t('He anat') : t('Vull anar');
      }
    } else {
      if (isActive && attendanceDate) {
        const formattedDate = attendanceDate.toLocaleDateString('ca-ES', {
          day: 'numeric',
          month: 'short',
        });
        buttonText = `${t('Assistiré')} - ${formattedDate}`;
      } else if (isActive) {
        buttonText = t('Assistiré');
      } else {
        buttonText = t('Vull assistir');
      }
    }

    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isActive ? Colors.going : Colors.accent }]}
        onPress={handleWantToGo}
      >
        <Text style={[styles.buttonText, { color: Colors.card }]}>{buttonText}</Text>
      </TouchableOpacity>
    );
  };

  const isSaved = !!savedEvents[event.id];

  const Link = event.enllacos ? Object.values(event.enllacos)[0] : null;
  const imageUri = event.imgApp
    ? `https://agenda.cultura.gencat.cat${event.imgApp}`
    : event.imatges
      ? `https://agenda.cultura.gencat.cat${event.imatges.split(',')[0]}`
      : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const startDate = event.data_inici ? new Date(event.data_inici) : new Date();
  startDate.setHours(0, 0, 0, 0);

  // Si l'esdeveniment ja ha començat, permetre des d'avui
  let minDate: Date;
  if (startDate <= today) {
    minDate = today;
  } else {
    minDate = startDate < tomorrow ? tomorrow : startDate;
  }

  const maxDate = event.data_fi ? new Date(event.data_fi) : new Date();

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background, paddingTop: 50 }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.title, { color: Colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text
          style={[styles.title, { color: Colors.text, marginLeft: 10, flex: 1 }]}
          numberOfLines={1}
        >
          {event.titol}
        </Text>
      </View>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      {(() => {
        if (
          event.latitud !== null &&
          event.longitud !== null &&
          !isNaN(event.latitud) &&
          !isNaN(event.longitud)
        ) {
          return <WeatherIcon latitude={event.latitud} longitude={event.longitud} />;
        }

        if (event.georeferencia) {
          const coords = event.georeferencia.split(',');

          if (coords.length === 2) {
            const lat = parseFloat(coords[0].trim());
            const lon = parseFloat(coords[1].trim());

            if (!isNaN(lat) && !isNaN(lon)) {
              return <WeatherIcon latitude={lat} longitude={lon} />;
            }
          }
        }

        return null;
      })()}

      <View style={styles.topButtons}>
        <LogicWrapper />

        <View style={styles.iconsRow}>
          <TouchableOpacity style={styles.iconButton} onPress={() => toggleSaved(event.id)}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => setModalOpen(true)}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              const url = `https://tu-app.com/event/${event.id}`;
              Share.share({
                message: `Mira este evento: ${url}`,
                url,
              });
            }}
          >
            <Ionicons name="share-social-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.dateContainer}>
        <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
        <Text style={[styles.eventDate, { color: Colors.text }]}>
          {formatEventDate(event.data_inici, event.data_fi)}
        </Text>
      </View>

      <Text style={[styles.description, { color: Colors.text }]}>
        {event.descripcio?.trim() || t('No description available')}
      </Text>

      {event.espai && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          🏛️ <Text style={styles.detailLabel}>{t('Space')}</Text> {event.espai}
        </Text>
      )}
      {event.direccio && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          📍 <Text style={styles.detailLabel}>{t('Address')}</Text> {event.direccio}
        </Text>
      )}
      {event.localitat && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          🏙️ <Text style={styles.detailLabel}>{t('Location')}</Text> {event.localitat}
        </Text>
      )}
      {event.modalitat && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          💡 <Text style={styles.detailLabel}>{t('Modality')}</Text> {event.modalitat}
        </Text>
      )}
      {event.infoHorari && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          ⏰ <Text style={styles.detailLabel}>{t('Schedule')}</Text> {event.infoHorari}
        </Text>
      )}
      {event.infoEntrades && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          🎟️ <Text style={styles.detailLabel}>{t('Tickets')}</Text> {event.infoEntrades}
        </Text>
      )}
      {event.telefon && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          ☎️ <Text style={styles.detailLabel}>{t('Telephone')}</Text> {event.telefon}
        </Text>
      )}
      {event.email && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          📧 <Text style={styles.detailLabel}>{t('Email')}</Text> {event.email}
        </Text>
      )}

      {typeof Link === 'string' && Link.trim() !== '' && (
        <TouchableOpacity onPress={() => Linking.openURL(Link)}>
          <Text style={[styles.link, { color: Colors.link }]}>{t('More information')}</Text>
        </TouchableOpacity>
      )}

      <View style={{ alignItems: 'flex-end' }}>
        <TouchableOpacity
          style={[styles.reviewButton, { backgroundColor: Colors.accent }]}
          onPress={() => setReviewVisible(true)}
        >
          <Ionicons
            name="create-outline"
            size={14}
            color={Colors.card}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.reviewButtonText, { color: Colors.card }]}>{t('Write review')}</Text>
        </TouchableOpacity>
      </View>

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

      <CommentSection eventId={event.id} visible={modalOpen} onClose={() => setModalOpen(false)} />
      <ReviewSection
        eventId={event.id}
        visible={reviewVisible}
        onClose={() => setReviewVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { width: '100%', height: 250, marginTop: 15 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700' },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  eventDate: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 20,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
    marginTop: 20,
    marginLeft: 10,
  },
  detail: {
    fontSize: 15,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
  detailLabel: {
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 6,
  },
  reviewButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 20,
    marginRight: 20,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
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
