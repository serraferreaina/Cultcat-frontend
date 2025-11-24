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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEventStatus } from '../../context/EventStatus';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import type { Review } from '../../components/ReviewSection';
import { Share } from 'react-native';

interface Events {
  id: number;
  titol: string;
  descripcio: string | null;
  imgApp: string | null;
  imatges: string | null;
}

interface PointsImages {
  images: string[];
}

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

export default function Home() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const { goingEvents, toggleGoing, savedEvents, toggleSaved } = useEventStatus();

  const [selectedFeed, setSelectedFeed] = useState('paraTi');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [events, setEvents] = useState<Events[]>([]);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comentaris
  const [modalOpen, setModalOpen] = useState(false);
  const [activeEventId, setActiveEventId] = useState<number | null>(null);

  // Ressenyes
  const [reviewsByEvent, setReviewsByEvent] = useState<Record<number, Review[]>>({});
  const [reviewVisible, setReviewVisible] = useState(false);
  const [activeReviewEventId, setActiveReviewEventId] = useState<number | null>(null);

  const feedOptions = [
    { label: t('For you'), value: 'paraTi' },
    { label: t('Following'), value: 'siguiendo' },
  ];
  const availableFeedOptions = feedOptions.filter((o) => o.value !== selectedFeed);
  const selectedFeedLabel =
    selectedFeed === 'siguiendo'
      ? `← ${feedOptions.find((o) => o.value === selectedFeed)?.label}`
      : feedOptions.find((o) => o.value === selectedFeed)?.label;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://nattech.fib.upc.edu:40490/events');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        console.error('Error al cargar eventos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const notifications = () => setUnreadNotifications(0);

  const dropdown = () => {
    if (selectedFeed === 'siguiendo') setSelectedFeed('paraTi');
    else setIsDropdownVisible(!isDropdownVisible);
  };

  const selectFeed = (value: string) => {
    setSelectedFeed(value);
    setIsDropdownVisible(false);
  };

  const renderPost = ({ item }: { item: Events }) => {
    const isSaved = savedEvents[item.id] || false;

    const images =
      item.imatges && item.imatges.trim() !== ''
        ? item.imatges.split(',').map((url) => `https://agenda.cultura.gencat.cat${url.trim()}`)
        : item.imgApp && item.imgApp.trim() !== ''
          ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
          : ['https://via.placeholder.com/300x200'];

    const eventReviews = reviewsByEvent[item.id] ?? [];
    const averageRating =
      eventReviews.length > 0
        ? eventReviews.reduce((sum, r) => sum + r.rating, 0) / eventReviews.length
        : 0;
    const roundedRating = Math.round(averageRating);

    return (
      <View style={[styles.card, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}>
        {/* Event */}
        <View style={styles.cardHeader}>
          <TouchableOpacity onPress={() => router.push(`../events/${item.id}`)}>
            <Text style={[styles.title, { color: Colors.text, flex: 1 }]} numberOfLines={1}>
              {item.titol
                ? item.titol.length > 20
                  ? item.titol.slice(0, 20) + '…'
                  : item.titol
                : t('Event without title')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: goingEvents[item.id] ? Colors.going : Colors.accent },
            ]}
            onPress={() => toggleGoing(item.id)}
          >
            <Text style={[styles.buttonText, { color: Colors.card }]}>
              {goingEvents[item.id] ? t('I will attend') : t('Want to go')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Images images={images} />

        <View style={styles.cardFooter}>
          <View style={styles.leftFooter}>
            <TouchableOpacity style={styles.iconButton} onPress={() => toggleSaved(item.id)}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            {/* Comentaris */}
            <TouchableOpacity
              onPress={() => {
                setActiveEventId(item.id);
                setModalOpen(true);
              }}
            >
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                const url = `https://tu-app.com/event/${item.id}`;
                Share.share({
                  message: `Mira este evento: ${url}`,
                  url,
                });
              }}
            >
              <Ionicons name="share-social-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Ressenyes */}
          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => {
                setActiveReviewEventId(item.id);
                setReviewVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={20} color="white" />
              <Text style={styles.reviewButtonText}>Escriure ressenya</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
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
    );
  };

  if (load)
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
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
          {/* Notifications */}
          <TouchableOpacity onPress={notifications} style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={26} color={Colors.text} />
            {unreadNotifications > 0 && (
              <View style={[styles.badge, { backgroundColor: Colors.accentHover }]}>
                <Text style={[styles.badgeText, { color: Colors.text }]}>
                  {unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity style={styles.iconButton}>
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

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: 60, marginTop: 20 }}
      />

      {/* Modal de comentaris */}
      <CommentSection
        eventId={activeEventId ?? 0}
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      {/* Modal de ressenyes */}
      {activeReviewEventId !== null && (
        <ReviewSection
          visible={reviewVisible}
          initialReviews={
            activeReviewEventId !== null ? (reviewsByEvent[activeReviewEventId] ?? []) : []
          }
          onClose={() => setReviewVisible(false)}
          onSubmit={(rating, payload) => {
            // --- CASE 1: DELETE ---
            if (rating === -1) {
              const reviewId = Number(payload);

              setReviewsByEvent((prev) => ({
                ...prev,
                [activeReviewEventId!]: prev[activeReviewEventId!].filter((r) => r.id !== reviewId),
              }));
              return;
            }

            // --- CASE 2: ADD REVIEW ---
            const newReview = {
              id: Date.now(),
              rating,
              comment: payload,
              date: new Date().toISOString(),
              likes: 0,
              likedByMe: false,
              author: 'Tu',
            };

            setReviewsByEvent((prev) => ({
              ...prev,
              [activeReviewEventId!]: [newReview, ...(prev[activeReviewEventId!] ?? [])],
            }));
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 60,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dropdown: {
    position: 'absolute',
    top: 100,
    left: 20,
    width: 140,
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 999,
  },
  dropdownItem: {
    padding: 10,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  image: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  iconButton: {
    padding: 6,
  },
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
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  leftFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    fontWeight: '600',
    fontSize: 13,
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 4,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d96c29',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  reviewButtonText: {
    color: 'white',
    marginLeft: 6,
    fontWeight: '600',
  },
  seeMore: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
    marginBottom: 12,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: '70%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginVertical: 8,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 13,
  },
  commentInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
});
