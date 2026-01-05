import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  FlatList,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Share,
  Modal,
  Platform,
  Animated,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEventLogic, useEventStatus } from '../../context/EventStatus';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../api';
import NotificationsScreen from '../../components/NotificationScreen';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ShareEventModal } from '../../components/ShareEventModal';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


interface Events {
  id: number;
  titol: string;
  descripcio: string | null;
  img_app: string | null;
  imatges: string | null;
  data_inici?: string | null;
  data_fi?: string | null;
  localitat?: string | null;
  espai?: string | null;
  modalitat?: string | null;
  direccio?: string | null;
  infoEntrades?: string | null;
  infoHorari?: string | null;
  telefon?: string | null;
  email?: string | null;
}

interface PointsImages {
  images: string[];
}

const normalizeDate = (date: Date): Date => {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0);
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

const hasEventPassedCompletely = (event: Events): boolean => {
  if (!event.data_fi) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(event.data_fi);
  endDate.setHours(0, 0, 0, 0);

  return endDate < today;
};

const Images: React.FC<PointsImages> = ({ images }) => {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const [currentIndex, setCurrentIndex] = useState(0);

  const activateScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / 375);
    setCurrentIndex(index);
  };

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(_, i) => `image-${i}`}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width: 375, height: 250 }} />
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={activateScroll}
        scrollEventThrottle={16}
      />
      {images.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 8 }}>
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                marginHorizontal: 4,
                backgroundColor: i === currentIndex ? Colors.accent : Colors.border,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

interface FeedCardProps {
  item: Events;
  onOpenComments: (id: number) => void;
  onOpenReviews: (id: number) => void;
  savedEvents: { [key: number]: boolean };
  onToggleSave: (id: number) => Promise<void>;
}

const FeedCard: React.FC<FeedCardProps> = ({
  item,
  onOpenComments,
  onOpenReviews,
  savedEvents,
  onToggleSave,
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const { isActive, toggle, attendanceDate } = useEventLogic(item);
  const { attendanceDates } = useEventStatus();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDateModal, setShowDateModal] = useState(false);

  const isSaved = savedEvents[item.id] || false;

  const [shareModalVisible, setShareModalVisible] = useState(false);

  const images = React.useMemo(() => {
    if (item.imatges && item.imatges.trim() !== '') {
      const imageUrls = item.imatges.split(',').map((url) => {
        const trimmedUrl = url.trim();
        const decodedUrl = decodeURIComponent(trimmedUrl);
        const fullUrl = `https://agenda.cultura.gencat.cat${decodedUrl}`;
        return fullUrl;
      });
      return imageUrls;
    }

    if (item.img_app && item.img_app.trim() !== '') {
      const decodedUrl = decodeURIComponent(item.img_app.trim());
      const imageUrl = `https://agenda.cultura.gencat.cat${decodedUrl}`;
      return [imageUrl];
    }

    return ['https://via.placeholder.com/375x250?text=Sin+Imagen'];
  }, [item.imatges, item.img_app, item.id]);

  const eventHasPassedCompletely = hasEventPassedCompletely(item);

  const userAttendancePassed = attendanceDate ? hasAttendanceDatePassed(attendanceDate) : false;
  const userAttendanceIsToday = attendanceDate ? isToday(attendanceDate) : false;
  const userAttendanceIsTomorrow = attendanceDate ? isTomorrow(attendanceDate) : false;
  const userAttendanceIsFuture = attendanceDate && !userAttendancePassed && !userAttendanceIsToday;

  const getButtonText = () => {
    if (userAttendanceIsToday) {
      return t('Today is the event');
    } else if (userAttendancePassed) {
      const formattedDate = attendanceDate!.toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
      });
      return t('You attended - ') + formattedDate;
    } else if (eventHasPassedCompletely && !attendanceDate) {
      return t('No vares assistir');
    } else if (attendanceDate && (userAttendanceIsFuture || userAttendanceIsTomorrow)) {
      const formattedDate = attendanceDate.toLocaleDateString(i18n.language, {
        day: 'numeric',
        month: 'short',
      });
      return t('I will attend') + ` - ${formattedDate}`;
    } else if (isActive && !attendanceDate) {
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
    } else if (isActive) {
      return Colors.going;
    } else {
      return Colors.accent;
    }
  };

  const isButtonDisabled = () => {
    return userAttendanceIsToday || userAttendancePassed || eventHasPassedCompletely;
  };

  const getMinMaxDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startDate = item.data_inici ? new Date(item.data_inici) : new Date();
    startDate.setHours(0, 0, 0, 0);

    let minDate = tomorrow;

    if (startDate > tomorrow) {
      minDate = startDate;
    }

    const maxDate = item.data_fi ? new Date(item.data_fi) : new Date();

    return { minDate, maxDate };
  };

  const handleButtonPress = () => {
    if (userAttendanceIsToday) {
      return;
    }

    if (userAttendancePassed) {
      return;
    }

    if (eventHasPassedCompletely) {
      return;
    }

    if (!isActive) {
      const { minDate, maxDate } = getMinMaxDates();

      const isSingleDay = minDate.getTime() === maxDate.getTime();

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

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const { minDate, maxDate } = getMinMaxDates();

  return (
    <>
      <View style={[styles.card, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => router.push(`../events/${item.id}`)} style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: Colors.text }]} numberOfLines={2}>
              {item.titol || t('Event without title')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message for today's event */}
        {userAttendanceIsToday && (
          <Text style={[styles.messageText, { color: Colors.accent, marginHorizontal: 12 }]}>
            {t('Recorda assistir-hi')}
          </Text>
        )}

        {/* Images */}
        <Images images={images} />

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.leftFooter}>
            <TouchableOpacity style={styles.iconButton} onPress={() => onToggleSave(item.id)}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => onOpenComments(item.id)}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconButton} onPress={() => setShareModalVisible(true)}>
              <Ionicons name="share-social-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Dynamic Button moved to right */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: getButtonColor(), opacity: isButtonDisabled() ? 0.7 : 1 },
            ]}
            onPress={handleButtonPress}
            disabled={isButtonDisabled()}
          >
            <Text style={[styles.actionButtonText, { color: Colors.card }]}>{getButtonText()}</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[styles.descriptionText, { color: Colors.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {item.descripcio || t('No description available')}
        </Text>

        <TouchableOpacity onPress={() => router.push(`../events/${item.id}`)}>
          <Text style={[styles.seeMore, { color: Colors.accent }]}>{t('See more...')}</Text>
        </TouchableOpacity>
      </View>

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
                onPress={handleConfirmDate}
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
          descripcio: item.descripcio || '',
          imgApp: item.img_app,
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
          telefon: item.telefon || null,
          email: item.email || null,
        }}
        Colors={Colors}
      />
    </>
  );
};

export default function Home() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [selectedFeed, setSelectedFeed] = useState('paraTi');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [events, setEvents] = useState<Events[]>([]);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [savedEvents, setSavedEvents] = useState<{ [key: number]: boolean }>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const feedOptions = [
    { label: t('For you'), value: 'paraTi' },
    { label: t('Following'), value: 'siguiendo' },
  ];
  const availableFeedOptions = feedOptions.filter((o) => o.value !== selectedFeed);
  const selectedFeedLabel = feedOptions.find((o) => o.value === selectedFeed)?.label;

  const BATCH_SIZE = 25;
  const INITIAL_BATCH_SIZE = 10;

  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [noConnections, setNoConnections] = useState(false);

  const loadSavedEvents = async () => {
    try {
      const data = await api('/saved-events/?state=wishlist');
      const savedMap: { [key: number]: boolean } = {};
      data.forEach((event: any) => {
        savedMap[parseInt(event.event_id)] = true;
      });
      setSavedEvents(savedMap);
    } catch (err) {
      console.error('Error loading saved events:', err);
    }
  };

  const handleToggleSave = async (eventId: number) => {
    const isSaved = savedEvents[eventId] || false;
    setSavedEvents((prev) => ({ ...prev, [eventId]: !isSaved }));

    try {
      if (isSaved) {
        await api(`/save/${eventId}/`, {
          method: 'DELETE',
        });
      } else {
        // Troba l'esdeveniment per obtenir les dates
        const event = events.find((e) => e.id === eventId);

        // Para wishlist (bookmark), siempre usar la fecha de fin del evento
        // Si no hay fecha de fin, usar la fecha de inicio
        let attendanceDate: string;

        if (event?.data_fi) {
          attendanceDate = new Date(event.data_fi).toISOString().split('T')[0];
        } else if (event?.data_inici) {
          attendanceDate = new Date(event.data_inici).toISOString().split('T')[0];
        } else {
          // Fallback: usa la data d'avui
          attendanceDate = new Date().toISOString().split('T')[0];
        }

        await api(`/save/${eventId}/`, {
          method: 'POST',
          body: JSON.stringify({
            state: 'wishlist',
            attendance_date: attendanceDate,
          }),
        });
      }
    } catch (err: any) {
      console.error('Error toggling save:', err);
      setSavedEvents((prev) => ({ ...prev, [eventId]: isSaved }));
    }
  };

  const shouldHideEvent = (event: Events): boolean => {
    // Ocultar esdeveniments amb data específica 2924-06-30
    if (event.data_inici) {
      const startDate = new Date(event.data_inici);
      const targetDate = new Date('2924-06-30');

      if (
        startDate.getFullYear() === targetDate.getFullYear() &&
        startDate.getMonth() === targetDate.getMonth() &&
        startDate.getDate() === targetDate.getDate()
      ) {
        return true;
      }
    }

    // Ocultar esdeveniments amb data d'inici > 2030
    if (event.data_inici) {
      const startDate = new Date(event.data_inici);
      if (startDate.getFullYear() > 2030) {
        return true;
      }
    }

    // Ocultar esdeveniments amb data de fi > 2030
    if (event.data_fi) {
      const endDate = new Date(event.data_fi);
      if (endDate.getFullYear() > 2030) {
        return true;
      }
    }

    return false;
  };

  const fetchEvents = async (reset = false) => {
    try {
      if (loadingMore) return;

      reset ? setLoading(true) : setLoadingMore(true);

      const currentOffset = reset ? 0 : offset;

      // Use smaller batch size for initial load, larger for subsequent loads
      const batchSize = currentOffset === 0 ? INITIAL_BATCH_SIZE : BATCH_SIZE;

      // Select endpoint based on feed type
      const endpoint =
        selectedFeed === 'siguiendo'
          ? `http://nattech.fib.upc.edu:40490/recommended/friends/?limit=${batchSize}&offset=${currentOffset}`
          : `http://nattech.fib.upc.edu:40490/recommended/?limit=${batchSize}&offset=${currentOffset}`;

      const token = await AsyncStorage.getItem('authToken');
      const headers: HeadersInit = {
        accept: '*/*',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(endpoint, { headers });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();

      // Check if user has no connections
      if (
        selectedFeed === 'siguiendo' &&
        data.detail === 'No está disponible esta funcionalidad.'
      ) {
        setNoConnections(true);
        setEvents([]);
        setHasMore(false);
        return;
      }

      setNoConnections(false);

      // Handle different response formats
      let allEvents: Events[] = [];
      if (selectedFeed === 'siguiendo') {
        // Friends endpoint returns: { event: {...}, recommended_by: "username", score: 0.42 }
        allEvents = (data.results || []).map((item: any) => item.event);
      } else {
        allEvents = data.results || data || [];
      }

      const newEvents = allEvents.filter((event: Events) => !shouldHideEvent(event));

      setEvents((prev: Events[]) => {
        if (reset) {
          return newEvents;
        }
        const map = new Map<number, Events>();

        prev.forEach((e: Events) => map.set(e.id, e));
        newEvents.forEach((e: Events) => map.set(e.id, e));

        return Array.from(map.values());
      });

      setOffset(currentOffset + batchSize);

      if (newEvents.length < batchSize || data.has_more === false) {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);
    loadSavedEvents();
  }, []);

  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setNoConnections(false);
    fetchEvents(true);
  }, [selectedFeed]);

  useFocusEffect(
    useCallback(() => {
      loadSavedEvents();
    }, []),
  );

  const dropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };

  const selectFeed = (value: string) => {
    setSelectedFeed(value);
    setIsDropdownVisible(false);
  };

  const handleOpenComments = (id: number) => {
    setActiveEventId(id);
    setModalOpen(true);
  };

  const handleOpenReviews = (id: number) => {
    setSelectedEventId(id);
    setReviewVisible(true);
  };

  const handleOpenNotifications = () => {
    setNotificationsVisible(true);
  };

  const handleNotificationCountChange = (count: number) => {
    setUnreadNotifications(count);
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => {
    const [rotation] = useState(new Animated.Value(0));
    const [scale] = useState(new Animated.Value(1));
    const [shimmer] = useState(new Animated.Value(0));
    const [glow] = useState(new Animated.Value(0));

    React.useEffect(() => {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
          easing: (t) => t, // Linear easing for smooth rotation
        }),
      ).start();
    }, [rotation]);

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, [scale]);

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: true }),
        ]),
      ).start();
    }, [glow]);

    React.useEffect(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
      ).start();
    }, [shimmer]);

    const rotationDegrees = rotation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    const opacity = shimmer.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    });

    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.header}>
          <View
            style={{
              width: 120,
              height: 24,
              borderRadius: 8,
              backgroundColor: Colors.border,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.border,
              }}
            />
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: Colors.border,
              }}
            />
          </View>
        </View>

        {/* Background skeleton cards */}
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 100, paddingBottom: 60 }}
          scrollEnabled={false}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        >
          {[1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[
                styles.card,
                {
                  backgroundColor: Colors.card,
                  shadowColor: Colors.shadow,
                  opacity: shimmer.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0.75],
                  }),
                  marginBottom: 20,
                  borderWidth: 0.5,
                  borderColor: Colors.border,
                },
              ]}
            >
              {/* Title Skeleton */}
              <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 }}>
                <View
                  style={{
                    height: 16,
                    backgroundColor: Colors.border,
                    borderRadius: 8,
                    marginBottom: 8,
                    opacity: 0.8,
                  }}
                />
                <View
                  style={{
                    height: 16,
                    backgroundColor: Colors.border,
                    borderRadius: 8,
                    width: '70%',
                    opacity: 0.8,
                  }}
                />
              </View>

              {/* Image Skeleton */}
              <View
                style={{
                  height: 250,
                  backgroundColor: Colors.border,
                  marginVertical: 8,
                  opacity: 0.7,
                }}
              />

              {/* Footer Skeleton */}
              <View style={{ paddingHorizontal: 12, paddingVertical: 12 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    {[1, 2, 3].map((j) => (
                      <View
                        key={j}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: Colors.border,
                          opacity: 0.8,
                        }}
                      />
                    ))}
                  </View>
                  <View
                    style={{
                      width: 100,
                      height: 32,
                      borderRadius: 20,
                      backgroundColor: Colors.border,
                      opacity: 0.8,
                    }}
                  />
                </View>
              </View>

              {/* Description Skeleton */}
              <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                <View
                  style={{
                    height: 14,
                    backgroundColor: Colors.border,
                    borderRadius: 8,
                    marginBottom: 6,
                    opacity: 0.7,
                  }}
                />
                <View
                  style={{
                    height: 14,
                    backgroundColor: Colors.border,
                    borderRadius: 8,
                    width: '85%',
                    opacity: 0.7,
                  }}
                />
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Foreground: Rotating Logo with Glow */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          {/* Main rotating logo with scale + rotation */}
          <Animated.View
            style={{
              transform: [{ rotate: rotationDegrees }, { scale: scale }],
            }}
          >
            <Image
              source={
                theme === 'dark'
                  ? require('../../assets/cultcat-logo_dark.png')
                  : require('../../assets/cultcat-logo_white.png')
              }
              style={{
                width: 140,
                height: 140,
                resizeMode: 'contain',
              }}
            />
          </Animated.View>

          {/* Text container - subtle */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              marginTop: 32,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: Colors.text,
                textAlign: 'center',
              }}
            >
              {t('Loading events')}
            </Text>

            <Text
              style={{
                fontSize: 14,
                color: Colors.textSecondary,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {t('Preparing your cultural experience')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (load) return <SkeletonLoader />;

  if (error)
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: Colors.text }}>
          {t('Error loading events')}: {error}
        </Text>
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.dropdownButton} onPress={dropdown}>
          <Text style={[styles.title, { color: Colors.text }]}>{selectedFeedLabel}</Text>
          <Ionicons
            name={isDropdownVisible ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={Colors.text}
          />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={handleOpenNotifications} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={[styles.badge, { backgroundColor: Colors.accentHover }]}>
                <Text style={[styles.badgeText, { color: Colors.text }]}>
                  {unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/xat')}>
            <Ionicons name="chatbubble-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {isDropdownVisible && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: Colors.background, borderColor: Colors.text },
          ]}
        >
          {availableFeedOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={styles.dropdownItem}
              onPress={() => selectFeed(option.value)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {option.value === 'siguiendo' && (
                  <Ionicons name="people-outline" size={18} color={Colors.text} />
                )}
                <Text style={{ color: Colors.text }}>{option.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* NO CONNECTIONS MESSAGE */}
      {noConnections && selectedFeed === 'siguiendo' && (
        <View style={[styles.noConnectionsContainer, { backgroundColor: Colors.background }]}>
          <Ionicons name="people-outline" size={80} color={Colors.textSecondary} />
          <Text style={[styles.noConnectionsTitle, { color: Colors.text }]}>
            {t('No connections yet')}
          </Text>
          <Text style={[styles.noConnectionsText, { color: Colors.textSecondary }]}>
            {t('Connect with other users to see events they are interested in')}
          </Text>
        </View>
      )}

      {/* LIST OF FEED CARDS */}
      {!noConnections && (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <FeedCard
              item={item}
              onOpenComments={handleOpenComments}
              onOpenReviews={handleOpenReviews}
              savedEvents={savedEvents}
              onToggleSave={handleToggleSave}
            />
          )}
          contentContainerStyle={{ paddingBottom: 60, marginTop: 20 }}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              fetchEvents();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
            ) : null
          }
        />
      )}

      <CommentSection
        eventId={activeEventId ?? 0}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {selectedEventId !== null && (
        <ReviewSection
          eventId={selectedEventId}
          visible={reviewVisible}
          onClose={() => setReviewVisible(false)}
        />
      )}

      <NotificationsScreen
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        onNotificationCountChange={handleNotificationCountChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    marginTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dropdown: {
    position: 'absolute',
    top: 100,
    left: 20,
    width: 140,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 999,
  },
  dropdownItem: { padding: 10 },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  title: { fontSize: 20, fontWeight: '700' },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconButton: { padding: 6 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  leftFooter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  button: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  buttonText: { fontWeight: '600', fontSize: 13 },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  descriptionText: { fontSize: 14, marginTop: 4, marginHorizontal: 12, marginBottom: 12 },
  seeMore: { fontSize: 14, fontWeight: '600', marginHorizontal: 12, marginBottom: 12 },
  cardHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
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
  noConnectionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  noConnectionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  noConnectionsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
