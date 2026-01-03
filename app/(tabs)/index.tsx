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
  const selectedFeedLabel =
    selectedFeed === 'siguiendo'
      ? `← ${feedOptions.find((o) => o.value === selectedFeed)?.label}`
      : feedOptions.find((o) => o.value === selectedFeed)?.label;

  const BATCH_SIZE = 25;

  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
        await api(`/save/${eventId}/`, {
          method: 'POST',
          body: JSON.stringify({ state: 'wishlist' }),
        });
      }
    } catch (err: any) {
      setSavedEvents((prev) => ({ ...prev, [eventId]: isSaved }));
    }
  };

  const shouldHideEvent = (event: Events): boolean => {
    if (!event.data_inici) return false;

    const startDate = new Date(event.data_inici);
    const targetDate = new Date('2924-06-30');

    return (
      startDate.getFullYear() === targetDate.getFullYear() &&
      startDate.getMonth() === targetDate.getMonth() &&
      startDate.getDate() === targetDate.getDate()
    );
  };

  const fetchEvents = async (reset = false) => {
    try {
      if (loadingMore) return;

      reset ? setLoading(true) : setLoadingMore(true);

      const currentOffset = reset ? 0 : offset;

      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/recommended/?limit=${BATCH_SIZE}&offset=${currentOffset}`,
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const allEvents = data.results || data || [];

      const newEvents = allEvents.filter((event: Events) => !shouldHideEvent(event));

      setEvents((prev: Events[]) => {
        const map = new Map<number, Events>();

        prev.forEach((e: Events) => map.set(e.id, e));
        newEvents.forEach((e: Events) => map.set(e.id, e));

        return Array.from(map.values());
      });

      setOffset(currentOffset + BATCH_SIZE);

      if (newEvents.length < BATCH_SIZE) {
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

  const dropdown = () => {
    if (selectedFeed === 'siguiendo') setSelectedFeed('paraTi');
    else setIsDropdownVisible(!isDropdownVisible);
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

  if (load)
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.text, marginTop: 16, fontSize: 16, fontWeight: '500' }}>
          {t('Loading events')}
        </Text>
      </View>
    );

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
          {selectedFeed !== 'siguiendo' && (
            <Ionicons
              name={isDropdownVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.text}
            />
          )}
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

      {/* LIST OF FEED CARDS */}
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
});
