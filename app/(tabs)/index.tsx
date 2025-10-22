import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function Home() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [selectedFeed, setSelectedFeed] = useState('paraTi');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [savedEvents, setSavedEvents] = useState<{ [key: string]: boolean }>({});
  const [showCompletEvent, setCompletEvent] = useState(false);
  const [goingEvents, setGoingEvents] = useState<{ [key: string]: boolean }>({});

  const selectGoingEvent = (postId: string) => {
    setGoingEvents((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const feedOptions = [
    { label: t('For you'), value: 'paraTi' },
    { label: t('Following'), value: 'siguiendo' },
  ];

  const notifications = () => setUnreadNotifications(0);

  const dropdown = () => {
    if (selectedFeed === 'siguiendo') {
      setSelectedFeed('paraTi');
    } else {
      setIsDropdownVisible(!isDropdownVisible);
    }
  };

  const availableFeedOptions = feedOptions.filter((o) => o.value !== selectedFeed);

  const selectedFeedLabel =
    selectedFeed === 'siguiendo'
      ? `< ${feedOptions.find((o) => o.value === selectedFeed)?.label}`
      : feedOptions.find((o) => o.value === selectedFeed)?.label;

  const selectFeed = (value: string) => {
    setSelectedFeed(value);
    setIsDropdownVisible(false);
  };

  const posts = [
    {
      id: '1',
      title: 'Comicos. Sueños e historia.',
      imageUrl: require('../../assets/cartell_comics.jpg'),
      rating: 4.5,
      reviews: 87,
      description:
        'Exposición: "Comicos, Sueños e historia". Esta exposición se acerca al cómico como herramienta',
    },
    {
      id: '2',
      title: 'La palanca',
      imageUrl: require('../../assets/la_palanca.jpg'),
      rating: 4.0,
      reviews: 42,
      description:
        'La 5a edición de La Palanca, el Festival de Circo Contemporáneo de Esparreguera tendrá lugar del',
    },
  ];

  const savedEvent = (postId: string) => {
    setSavedEvents((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const renderPost = ({ item }: any) => {
    const isSaved = savedEvents[item.id] || false;

    return (
      <View style={[styles.card, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}>
        {/*Event*/}
        <View style={styles.cardHeader}>
        <TouchableOpacity onPress={() => router.push(`../events/${item.id}`)}>
          <Text style={[styles.title, { color: Colors.text, flex: 1 }]} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: goingEvents[item.id] ? Colors.going : Colors.accent,
              },
            ]}
            onPress={() => selectGoingEvent(item.id)}
          >
            <Text
              style={[
                styles.buttonText,
                { color: goingEvents[item.id] ? Colors.card : Colors.text },
              ]}
            >
              {goingEvents[item.id] ? t('I will attend') : t('Want to go')}
            </Text>
          </TouchableOpacity>
        </View>

        {/*Image*/}
        <TouchableOpacity onPress={() => router.push(`../events/${item.id}`)}>
          <Image source={item.imageUrl} style={styles.image} />
        </TouchableOpacity>

        <View style={styles.cardFooter}>
          <View style={styles.leftFooter}>
            {/*Save event*/}
            <TouchableOpacity style={styles.iconButton} onPress={() => savedEvent(item.id)}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            {/*Coments*/}
            <View style={styles.comments}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
              <Text style={[styles.commentCount, { color: Colors.text }]}>{item.reviews}</Text>
            </View>

            {/*Share*/}
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="share-social-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/*Ratings*/}
          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={[styles.reviewButton, { backgroundColor: Colors.accent }]}
              onPress={() => console.log('Write review')}
            >
              <Ionicons
                name="create-outline"
                size={14}
                color={Colors.card}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.reviewButtonText, { color: Colors.card }]}>
                {t('Write review')}
              </Text>
            </TouchableOpacity>

            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => {
                let iconName: 'star' | 'star-half' = 'star';
                let starColor = Colors.star_inactive;

                if (i < Math.floor(item.rating)) starColor = Colors.star;
                else if (i < item.rating) {
                  iconName = 'star-half';
                  starColor = Colors.star;
                }

                return <Ionicons key={i} name={iconName} size={16} color={starColor} />;
              })}
              <Text style={[styles.ratingText, { color: Colors.text, marginLeft: 4 }]}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {/*Wants to go*/}
        <View style={[styles.participants, { marginLeft: 12 }]}>
          <View style={styles.participantImages}>
            <Image
              source={require('../../assets/foto_perfil1.jpg')}
              style={[styles.participantImage, { borderColor: Colors.border }]}
            />
            <Image
              source={require('../../assets/foto_perfil2.webp')}
              style={[styles.participantImage, { borderColor: Colors.border }]}
            />
          </View>
          <Text style={[styles.participantText, { color: Colors.text }]}>
            {t('Wants to go')} <Text style={{ fontWeight: '700' }}>adaaap</Text>{' '}
            {t('And more people')}
          </Text>
        </View>
        {/* Description */}
        <Text style={[styles.descriptionText, { color: Colors.text }]}>{item.description}</Text>

        <TouchableOpacity onPress={() => router.push(`../events/${item.id}`)}>
          <Text style={[styles.seeMore, { color: Colors.accent }]}>{t('Ver más...')}</Text>

        </TouchableOpacity>
      </View>
    );
  };

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
          {/*Notifications*/}
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

          {/*Chat*/}
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

      {/* List of publications*/}
      {selectedFeed === 'paraTi' && (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={{ paddingBottom: 60, marginTop: 20 }}
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
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  buttonText: {
    fontWeight: '600',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  participants: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  participantImages: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  participantImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: -8,
  },
  participantText: {
    fontSize: 13,
    flexShrink: 1,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 6,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    marginTop: 4,
    marginHorizontal: 12,
    marginBottom: 12,
  },
  seeMore: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 12,
    marginBottom: 12,
  },
});
