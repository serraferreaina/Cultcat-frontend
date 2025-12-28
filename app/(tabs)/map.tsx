import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';

import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEventStatus } from '../../context/EventStatus';
import { Share } from 'react-native';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import DateTimePicker from '@react-native-community/datetimepicker';

interface EventItem {
  id: number;
  titol: string;
  localitat: string;
  latitud: number;
  longitud: number;
  imatges?: string;
  espai?: string;
  horari?: string;
  modalitat?: string;
  direccio?: string;
  data_inici?: string | null;
  data_fi?: string | null;
}

export default function MapScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const normalizeDate = (date: Date): Date => {
    // Crear una nova data amb les hores establertes al migdia per evitar problemes de zona horària
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  const mapRef = useRef(null);

  const { goingEvents, toggleGoing, savedEvents, toggleSaved, attendanceDates } = useEventStatus();

  const BATCH_SIZE = 50; // Reduït de 100 a 50
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Debounce per evitar massa crides
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const openEventDetail = (id: number) => {
    setSelectedEvent(null);
    router.push(`/events/${id}`);
  };

  const fetchEventsByCenter = async (latitude: number, longitude: number) => {
    if (loadingEvents) return;

    setLoadingEvents(true);

    try {
      const url =
        `http://nattech.fib.upc.edu:40490/events` +
        `?latitud=${latitude}` +
        `&longitud=${longitude}` +
        `&batch_size=${BATCH_SIZE}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error loading events');

      const textData = await res.text();

      let data: EventItem[] = [];
      try {
        const jsonData = textData.trim() ? JSON.parse(textData) : [];
        data = Array.isArray(jsonData) ? jsonData : jsonData.results || [];
      } catch (e) {
        console.error('JSON PARSE ERROR:', textData);
        data = [];
      }

      setEvents(data);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission denied'), t('Enable location to see the map.'));
        return;
      }
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchEventsByCenter(location.latitude, location.longitude);
    }
  }, [location]);

  const hasEventPassed = (event: EventItem): boolean => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const savedAttendanceDate = attendanceDates[event.id]
      ? new Date(attendanceDates[event.id])
      : undefined;

    if (savedAttendanceDate) {
      const attendance = new Date(savedAttendanceDate);
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

  const getMinMaxDates = (event: EventItem) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = event.data_inici ? new Date(event.data_inici) : new Date();
    startDate.setHours(0, 0, 0, 0);

    const minDate = startDate < today ? today : startDate;
    const maxDate = event.data_fi ? new Date(event.data_fi) : new Date();

    return { minDate, maxDate };
  };

  const handleWantToGo = () => {
    if (!selectedEvent) return;

    if (!goingEvents[selectedEvent.id]) {
      if (selectedEvent.data_inici) {
        setSelectedDate(new Date(selectedEvent.data_inici));
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startDate = selectedEvent.data_inici ? new Date(selectedEvent.data_inici) : new Date();
      startDate.setHours(0, 0, 0, 0);

      // Si l'esdeveniment ja ha començat, permetre des d'avui
      let minDate: Date;
      if (startDate <= today) {
        minDate = today;
      } else {
        minDate = startDate < tomorrow ? tomorrow : startDate;
      }

      const maxDate = selectedEvent.data_fi ? new Date(selectedEvent.data_fi) : new Date();
      maxDate.setHours(0, 0, 0, 0);

      const isSingleDay = minDate.getTime() === maxDate.getTime();

      if (isSingleDay) {
        // Normalitzar la data abans d'enviar
        const normalizedMinDate = normalizeDate(minDate);
        console.log(
          '📅 MapScreen - Single day, sending:',
          normalizedMinDate.toISOString().split('T')[0],
        );
        toggleGoing(selectedEvent.id, normalizedMinDate);
      } else {
        setShowDateModal(true);
      }
    } else {
      toggleGoing(selectedEvent.id);
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
    if (selectedEvent) {
      // Normalitzar la data abans d'enviar-la
      const normalizedDate = normalizeDate(selectedDate);
      console.log('📅 MapScreen - Selected date:', selectedDate);
      console.log('📅 MapScreen - Normalized date:', normalizedDate);
      console.log('📅 MapScreen - Will send to API:', normalizedDate.toISOString().split('T')[0]);
      await toggleGoing(selectedEvent.id, normalizedDate);
    }
    setShowDatePicker(false);
    setShowDateModal(false);
  };

  const getButtonText = (event: EventItem) => {
    const isPast = hasEventPassed(event);
    const isGoing = goingEvents[event.id];

    const savedAttendanceDate = attendanceDates[event.id]
      ? (() => {
          // Parsejar manualment per evitar problemes de zona horària
          const [year, month, day] = attendanceDates[event.id].split('-').map(Number);
          return new Date(year, month - 1, day, 12, 0, 0);
        })()
      : undefined;

    if (isPast) {
      return isGoing ? t('He anat') : t('Vull anar');
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

  // Funció amb debounce per onRegionChangeComplete
  const handleRegionChange = useCallback(
    (region: any) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        const regionChanged =
          !currentRegion ||
          Math.abs(region.latitude - currentRegion.latitude) > region.latitudeDelta * 0.5 ||
          Math.abs(region.longitude - currentRegion.longitude) > region.longitudeDelta * 0.5;

        if (regionChanged) {
          setCurrentRegion({ latitude: region.latitude, longitude: region.longitude });
          fetchEventsByCenter(region.latitude, region.longitude);
        }
      }, 1000); // Espera 1 segon després de deixar de moure el mapa
    },
    [currentRegion],
  );

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.text }}>{t('Loading map')}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.text }}>
          {t('Error')}: {error}
        </Text>
      </View>
    );
  }

  const { minDate, maxDate } = selectedEvent
    ? getMinMaxDates(selectedEvent)
    : { minDate: new Date(), maxDate: new Date() };

  return (
    <View style={styles.container}>
      {loadingEvents && (
        <View
          style={{
            position: 'absolute',
            top: 20,
            alignSelf: 'center',
            backgroundColor: Colors.card,
            padding: 8,
            borderRadius: 20,
            zIndex: 1000,
          }}
        >
          <ActivityIndicator color={Colors.accent} />
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onRegionChangeComplete={handleRegionChange}
      >
        {Array.isArray(events) &&
          events.map((event) => {
            const images = event.imatges ? event.imatges.split(',').map((i) => i.trim()) : [];
            const imageUrl =
              images.length > 0
                ? `https://agenda.cultura.gencat.cat${images[0]}`
                : 'https://via.placeholder.com/100x100/FFA500/FFFFFF?text=E';

            return (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: Number(event.latitud),
                  longitude: Number(event.longitud),
                }}
                onPress={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                }}
              >
                <View style={styles.markerContainer}>
                  <View
                    style={[
                      styles.markerCircle,
                      { backgroundColor: Colors.background, borderColor: Colors.accent },
                    ]}
                  >
                    <Image source={{ uri: imageUrl }} style={styles.markerImage} />
                  </View>
                </View>
              </Marker>
            );
          })}
      </MapView>

      {selectedEvent && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedEvent(null)}
        >
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: Colors.background + '80' }]}
            activeOpacity={1}
            onPress={() => setSelectedEvent(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={[styles.eventCardModal, { backgroundColor: Colors.card }]}
            >
              <ScrollView>
                <View style={styles.eventRow}>
                  <TouchableOpacity onPress={() => openEventDetail(selectedEvent.id)}>
                    <Image
                      source={{
                        uri: selectedEvent.imatges
                          ? `https://agenda.cultura.gencat.cat${selectedEvent.imatges.split(',')[0].trim()}`
                          : 'https://via.placeholder.com/100x100/FFA500/FFFFFF?text=E',
                      }}
                      style={styles.eventImageSide}
                    />
                  </TouchableOpacity>

                  <View style={styles.eventInfo}>
                    <TouchableOpacity onPress={() => openEventDetail(selectedEvent.id)}>
                      <Text style={[styles.eventTitle, { color: Colors.text }]}>
                        {selectedEvent.titol || t('Event without title')}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.labelContainer}>
                      {selectedEvent.espai && (
                        <Label text={selectedEvent.espai} color={Colors.accent} />
                      )}
                      {selectedEvent.horari && (
                        <Label text={selectedEvent.horari} color={Colors.accent} />
                      )}
                      {selectedEvent.modalitat && (
                        <Label text={selectedEvent.modalitat} color={Colors.accent} />
                      )}
                      {selectedEvent.localitat && (
                        <Label text={selectedEvent.localitat} color={Colors.accent} />
                      )}
                      {selectedEvent.direccio && (
                        <Label text={selectedEvent.direccio} color={Colors.accent} />
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          {
                            backgroundColor: goingEvents[selectedEvent.id]
                              ? Colors.going
                              : Colors.accent,
                            marginRight: 10,
                          },
                        ]}
                        onPress={handleWantToGo}
                      >
                        <Text style={[styles.buttonText, { color: Colors.card }]}>
                          {getButtonText(selectedEvent)}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconButton, { marginRight: 12 }]}
                        onPress={() => toggleSaved(selectedEvent.id)}
                      >
                        <Ionicons
                          name={savedEvents[selectedEvent.id] ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={Colors.text}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                        onPress={() => setShowComments(true)}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                        onPress={() => setShowReviews(true)}
                      >
                        <Ionicons name="star-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          const url = `https://tu-app.com/event/${selectedEvent.id}`;
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
                </View>

                <TouchableOpacity
                  style={[styles.closeButtonModal, { backgroundColor: Colors.accent }]}
                  onPress={() => setSelectedEvent(null)}
                >
                  <Text style={{ color: Colors.background, fontWeight: '700' }}>{t('Close')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* MODAL DE SELECCIÓN DE FECHA */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.dateModalOverlay}>
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

      {/* COMMENTS */}
      {selectedEvent && (
        <CommentSection
          eventId={selectedEvent.id}
          visible={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* REVIEWS */}
      {selectedEvent && (
        <ReviewSection
          eventId={selectedEvent.id}
          visible={showReviews}
          onClose={() => setShowReviews(false)}
        />
      )}
    </View>
  );
}

const Label = ({ text, color }: { text: string; color: string }) => (
  <View style={[styles.label, { backgroundColor: color + '22' }]}>
    <Text style={[styles.labelText, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  markerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  eventCardModal: {
    borderRadius: 12,
    padding: 12,
    maxHeight: '80%',
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  eventImageSide: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
    paddingLeft: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    fontSize: 12,
  },
  iconButton: {
    padding: 6,
  },
  commentCount: {
    fontSize: 13,
  },
  closeButtonModal: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  dateModalOverlay: {
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
