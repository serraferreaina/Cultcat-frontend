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
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { ShareEventModal } from '../../components/ShareEventModal';
import { api } from '../../api';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;

  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [event, setEvent] = useState<EventData | null>(null);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const eventLogic = useEventLogic(
    event || {
      id: 0,
      titol: '',
      descripcio: '',
      enllacos: {},
      imgApp: null,
      imatges: null,
      infoEntrades: null,
      infoHorari: null,
      gratuita: false,
      modalitat: null,
      direccio: null,
      espai: null,
      localitat: null,
      georeferencia: null,
      latitud: null,
      longitud: null,
      telefon: null,
      email: null,
      data_inici: null,
      data_fi: null,
    },
  );
  const { isActive, toggle } = eventLogic;

  const userAttendanceDate =
    'attendanceDate' in eventLogic && eventLogic.attendanceDate instanceof Date
      ? eventLogic.attendanceDate
      : undefined;

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
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    const compareDate = new Date(date);
    return (
      today.getDate() === compareDate.getDate() &&
      today.getMonth() === compareDate.getMonth() &&
      today.getFullYear() === compareDate.getFullYear()
    );
  };

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

  const isEventToday = (event: EventData): boolean => {
    if (!event.data_inici || !event.data_fi) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(event.data_inici);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(event.data_fi);
    endDate.setHours(0, 0, 0, 0);
    return today >= startDate && today <= endDate;
  };

  const hasEventPassedCompletely = (event: EventData): boolean => {
    if (!event.data_fi) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(event.data_fi);
    endDate.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const hasAttendanceDatePassed = (attendanceDate: Date): boolean => {
    const today = new Date();
    const attendance = new Date(attendanceDate);
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const attendanceOnlyDate = new Date(
      attendance.getFullYear(),
      attendance.getMonth(),
      attendance.getDate(),
    );
    return attendanceOnlyDate < todayDate;
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

  useEffect(() => {
    if (!eventId) return;

    const fetchReviews = async () => {
      try {
        const res = await fetch(`http://nattech.fib.upc.edu:40490/reviews/event/${eventId}`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        const data = await res.json();
        setReviews(data);

        if (data.length > 0) {
          const total = data.reduce((sum: number, review: any) => sum + review.rating, 0);
          const avg = total / data.length;
          setAverageRating(Math.round(avg * 10) / 10);
        } else {
          setAverageRating(null);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    };

    fetchReviews();
  }, [eventId, reviewVisible]);

  useEffect(() => {
    if (!event) return;

    const checkSaved = async () => {
      try {
        const data = await api('/saved-events/?state=wishlist');
        const saved = data.some((e: any) => parseInt(e.event_id) === event.id);
        setIsSaved(saved);
      } catch (err) {
        console.error('Error checking saved status:', err);
      }
    };

    checkSaved();
  }, [event]);

  const handleToggleSave = async () => {
    if (!event) return;

    const wasSaved = isSaved;
    setIsSaved(!wasSaved);

    try {
      if (wasSaved) {
        await api(`/save/${event.id}/`, {
          method: 'DELETE',
        });
      } else {
        let attendanceDate: string;

        if (event.data_fi) {
          attendanceDate = new Date(event.data_fi).toISOString().split('T')[0];
        } else if (event.data_inici) {
          attendanceDate = new Date(event.data_inici).toISOString().split('T')[0];
        } else {
          attendanceDate = new Date().toISOString().split('T')[0];
        }

        await api(`/save/${event.id}/`, {
          method: 'POST',
          body: JSON.stringify({
            state: 'wishlist',
            attendance_date: attendanceDate,
          }),
        });
      }
    } catch (err: any) {
      console.error('Error toggling save:', err);
      setIsSaved(wasSaved);
    }
  };

  const canWriteReview =
    event && userAttendanceDate ? hasAttendanceDatePassed(userAttendanceDate) : false;

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
      return (
        t('Data inici: ') +
        `${start.toLocaleDateString(i18n.language, options)} - ` +
        t('Data fi: ') +
        `${end.toLocaleDateString(i18n.language, options)}`
      );
    }

    return start.toLocaleDateString(i18n.language, options);
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
      <SafeAreaView style={[styles.center, { backgroundColor: Colors.background }]} edges={['top']}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </SafeAreaView>
    );
  }

  if (error || !event) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: Colors.background }]} edges={['top']}>
        <Text style={{ color: Colors.text }}>{t('Error loading event')}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: Colors.accent }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const LogicWrapper = () => {
    const attendanceDate = userAttendanceDate;
    const eventIsToday = isEventToday(event);
    const eventHasPassedCompletely = hasEventPassedCompletely(event);
    const userAttendancePassed = attendanceDate ? hasAttendanceDatePassed(attendanceDate) : false;
    const userAttendanceIsToday = attendanceDate ? isToday(attendanceDate) : false;
    const userAttendanceIsTomorrow = attendanceDate ? isTomorrow(attendanceDate) : false;
    const userAttendanceIsFuture =
      attendanceDate && !userAttendancePassed && !userAttendanceIsToday;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = event.data_inici ? new Date(event.data_inici) : new Date();
    startDate.setHours(0, 0, 0, 0);

    let minDate = tomorrow;
    if (startDate > tomorrow) {
      minDate = startDate;
    }

    const maxDate = event.data_fi ? new Date(event.data_fi) : new Date();
    maxDate.setHours(0, 0, 0, 0);

    const isSingleDay = minDate.getTime() === maxDate.getTime();

    const handleWantToGo = () => {
      if (userAttendanceIsToday || userAttendancePassed || eventHasPassedCompletely) {
        return;
      }

      if (!isActive) {
        if (isSingleDay) {
          const normalizedMinDate = normalizeDate(minDate);
          toggle(normalizedMinDate);
        } else {
          setSelectedDate(minDate);
          setShowDateModal(true);
        }
      } else {
        toggle();
      }
    };

    const handleConfirmDate = () => {
      const normalizedDate = normalizeDate(selectedDate);
      toggle(normalizedDate);
      setShowDatePicker(false);
      setShowDateModal(false);
    };

    React.useEffect(() => {
      (window as any).confirmAttendance = handleConfirmDate;
    }, [selectedDate]);

    let buttonText = '';
    let buttonColor = Colors.accent;
    let isDisabled = false;
    let messageText = '';
    let messageColor = Colors.text;

    if (userAttendanceIsToday) {
      buttonText = t('Today is the event');
      buttonColor = '#FFA500';
      isDisabled = true;
      messageText = t('Recorda assistir-hi');
      messageColor = Colors.accent;
    } else if (userAttendancePassed) {
      buttonColor = '#FF6B6B';
      isDisabled = true;
      buttonText = t('You attended');
    } else if (eventHasPassedCompletely && !attendanceDate) {
      isDisabled = true;
      buttonColor = '#FF6B6B';
      buttonText = t('No vares assistir');
    } else if (attendanceDate && (userAttendanceIsFuture || userAttendanceIsTomorrow)) {
      const formattedDate = attendanceDate.toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
      });
      buttonText = t('I will attend') + ` - ${formattedDate}`;
      buttonColor = Colors.going;
    } else if (isActive && !attendanceDate) {
      buttonText = t('I will attend');
      buttonColor = Colors.going;
    } else {
      buttonText = t('Want to go');
      buttonColor = Colors.accent;
    }

    return (
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: buttonColor, opacity: isDisabled ? 0.7 : 1 }]}
          onPress={handleWantToGo}
          disabled={isDisabled}
        >
          <Text style={[styles.buttonText, { color: Colors.card }]}>{buttonText}</Text>
        </TouchableOpacity>

        {messageText !== '' && (
          <Text style={[styles.messageText, { color: messageColor }]}>{messageText}</Text>
        )}
      </View>
    );
  };

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

  let minDate = tomorrow;
  if (startDate > tomorrow) {
    minDate = startDate;
  }

  const maxDate = event.data_fi ? new Date(event.data_fi) : new Date();

  const DetailRow = ({ icon, label, value }: { icon: any; label: string; value: string }) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={18} color={Colors.accent} style={styles.detailIcon} />
      <Text style={[styles.detailText, { color: Colors.text }]}>
        <Text style={styles.detailLabel}>{label}</Text> {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top']}>
      <ScrollView
        style={[styles.container, { backgroundColor: Colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={Colors.text} />
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
            <TouchableOpacity style={styles.iconButton} onPress={handleToggleSave}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => setModalOpen(true)}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => setShareModalVisible(true)}>
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
          <DetailRow icon="business-outline" label={t('Space')} value={event.espai} />
        )}
        {event.direccio && (
          <DetailRow icon="location-outline" label={t('Address')} value={event.direccio} />
        )}
        {event.localitat && (
          <DetailRow icon="map-outline" label={t('Location')} value={event.localitat} />
        )}
        {event.modalitat && (
          <DetailRow icon="bulb-outline" label={t('Modality')} value={event.modalitat} />
        )}
        {event.infoHorari && (
          <DetailRow icon="time-outline" label={t('Schedule')} value={event.infoHorari} />
        )}
        {event.infoEntrades && (
          <DetailRow icon="pricetag-outline" label={t('Tickets')} value={event.infoEntrades} />
        )}
        {event.telefon && (
          <DetailRow icon="call-outline" label={t('Telephone')} value={event.telefon} />
        )}
        {event.email && <DetailRow icon="mail-outline" label={t('Email')} value={event.email} />}

        {typeof Link === 'string' && Link.trim() !== '' && (
          <TouchableOpacity onPress={() => Linking.openURL(Link)} style={styles.moreInfoRow}>
            <Ionicons name="link-outline" size={18} color={Colors.accent} />
            <Text style={[styles.link, { color: Colors.link }]}>{t('More information')}</Text>
          </TouchableOpacity>
        )}

        <View
          style={[
            styles.reviewsSection,
            {
              backgroundColor: Colors.card,
              borderColor: Colors.border,
            },
          ]}
        >
          <View style={styles.reviewsHeader}>
            <Text style={[styles.reviewsSectionTitle, { color: Colors.text }]}>{t('Reviews')}</Text>
            {averageRating !== null && (
              <View style={styles.averageRatingContainer}>
                <Ionicons name="star" size={22} color={Colors.accent} />
                <Text style={[styles.averageRatingText, { color: Colors.text }]}>
                  {averageRating.toFixed(1)}/5
                </Text>
                <Text style={[styles.reviewCount, { color: Colors.textSecondary }]}>
                  ({reviews.length})
                </Text>
              </View>
            )}
          </View>

          {reviews.length > 0 ? (
            <TouchableOpacity
              style={[
                styles.viewAllReviewsButton,
                {
                  backgroundColor: Colors.background,
                  borderColor: Colors.border,
                },
              ]}
              onPress={() => setReviewVisible(true)}
            >
              <Text style={[styles.viewAllReviewsText, { color: Colors.accent }]}>
                {t('View all reviews')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.accent} />
            </TouchableOpacity>
          ) : (
            <Text style={[styles.noReviewsText, { color: Colors.textSecondary }]}>
              {t('No reviews yet')}
            </Text>
          )}

          {canWriteReview && (
            <TouchableOpacity
              style={[
                styles.writeReviewButton,
                {
                  backgroundColor: Colors.accent,
                  marginTop: reviews.length > 0 ? 12 : 8,
                },
              ]}
              onPress={() => setReviewVisible(true)}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={Colors.card}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.writeReviewButtonText, { color: Colors.card }]}>
                {t('Write review')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Padding inferior per assegurar que tot el contingut és visible */}
        <View style={{ height: 40 }} />
      </ScrollView>

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
                  locale={i18n.language}
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
                      {selectedDate.toLocaleDateString(i18n.language, {
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
        readOnly={!canWriteReview}
      />
      <ShareEventModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        event={event}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  image: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.3, // 30% de l'altura de la pantalla
    marginTop: 15,
    resizeMode: 'cover',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SCREEN_WIDTH * 0.05, // 5% dels marges
    marginBottom: 8,
    marginTop: 10,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.037, // Font escalable
    fontWeight: '700',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginTop: 12,
    gap: 8,
  },
  eventDate: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
    flex: 1,
  },
  description: {
    fontSize: SCREEN_WIDTH * 0.042,
    lineHeight: SCREEN_WIDTH * 0.058,
    marginBottom: 20,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginTop: 20,
  },
  link: {
    fontSize: SCREEN_WIDTH * 0.042,
    textDecorationLine: 'underline',
    marginTop: 20,
    marginHorizontal: SCREEN_WIDTH * 0.05,
  },
  moreInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginTop: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SCREEN_WIDTH * 0.05,
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailText: {
    fontSize: 15,
    flex: 1,
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
    alignItems: 'flex-start',
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
  messageText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 6,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  writeReviewButtonText: {
    fontSize: 14,
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
  reviewsSection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  averageRatingText: {
    fontSize: 16,
    fontWeight: '700',
  },
  reviewCount: {
    fontSize: 14,
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  viewAllReviewsText: {
    fontSize: 15,
    fontWeight: '600',
  },
  noReviewsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  reviewsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  writeReviewContainer: {
    alignItems: 'flex-end',
    marginHorizontal: SCREEN_WIDTH * 0.05,
    height: '80%',
  },
  reviewsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  reviewsModalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  reviewsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  reviewItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewUsername: {
    fontSize: 16,
    fontWeight: '600',
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewRatingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewDate: {
    fontSize: 12,
  },
});
