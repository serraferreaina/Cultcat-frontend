// components/EventShareBubble.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface EventShareBubbleProps {
  eventData: {
    eventId: number;
    title: string;
    image: string | null;
    date: string | null;
    dateEnd?: string | null;
    location: string | null;
    description: string;
    userMessage?: string | null;
  };
  isMine: boolean;
  senderName?: string;
}

export default function EventShareBubble({ eventData, isMine, senderName }: EventShareBubbleProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ca-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateRange = () => {
    if (!eventData.date) return '';

    const startFormatted = formatDate(eventData.date);

    if (eventData.dateEnd && eventData.dateEnd !== eventData.date) {
      const endFormatted = formatDate(eventData.dateEnd);
      return `${startFormatted} - ${endFormatted}`;
    }

    return startFormatted;
  };

  const handlePress = () => {
    console.log('🔍 Navigating to event:', eventData.eventId);
    router.push(`/events/${eventData.eventId}`);
  };

  return (
    <View style={[styles.wrapper, { alignSelf: isMine ? 'flex-end' : 'flex-start' }]}>
      {/* Sender name for group chats */}
      {!isMine && senderName && (
        <Text style={[styles.senderName, { color: Colors.textSecondary }]}>{senderName}</Text>
      )}

      {/* Container for image + card */}
      <View style={styles.eventContainer}>
        {/* Image OUTSIDE/ABOVE the card */}
        {eventData.image && !imageError ? (
          <View style={styles.imageContainer}>
            {!imageLoaded && (
              <View style={[styles.imagePlaceholder, { backgroundColor: Colors.background }]}>
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
            )}
            <Image
              source={{ uri: eventData.image }}
              style={[styles.image, { opacity: imageLoaded ? 1 : 0 }]}
              resizeMode="cover"
              onError={(e) => {
                console.log('❌ Image failed to load:', eventData.image);
                console.log('❌ Error details:', e.nativeEvent);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', eventData.image);
                setImageLoaded(true);
              }}
            />
          </View>
        ) : eventData.image && imageError ? (
          <View style={[styles.imagePlaceholder, { backgroundColor: Colors.background }]}>
            <Ionicons name="image-outline" size={40} color={Colors.textSecondary} />
            <Text style={[styles.imageErrorText, { color: Colors.textSecondary }]}>
              No s'ha pogut carregar la imatge
            </Text>
          </View>
        ) : null}

        {/* Event card (blue box) */}
        <TouchableOpacity
          onPress={handlePress}
          style={[
            styles.eventCard,
            {
              backgroundColor: isMine ? '#4A90E2' : Colors.card,
            },
          ]}
          activeOpacity={0.85}
        >
          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text
              style={[styles.title, { color: isMine ? '#fff' : Colors.text }]}
              numberOfLines={2}
            >
              {eventData.title}
            </Text>

            {/* Info row */}
            <View style={styles.infoRow}>
              {eventData.date && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={13}
                    color={isMine ? '#fff' : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.infoText, { color: isMine ? '#fff' : Colors.textSecondary }]}
                  >
                    {formatDateRange()}
                  </Text>
                </View>
              )}

              {eventData.location && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="location-outline"
                    size={13}
                    color={isMine ? '#fff' : Colors.textSecondary}
                  />
                  <Text
                    style={[styles.infoText, { color: isMine ? '#fff' : Colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {eventData.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Description */}
            {eventData.description && (
              <Text
                style={[styles.description, { color: isMine ? '#fff' : Colors.textSecondary }]}
                numberOfLines={2}
              >
                {eventData.description}
              </Text>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View
              style={[
                styles.badge,
                { backgroundColor: isMine ? 'rgba(255,255,255,0.25)' : Colors.accent + '20' },
              ]}
            >
              <Ionicons name="calendar" size={11} color={isMine ? '#fff' : Colors.accent} />
              <Text style={[styles.badgeText, { color: isMine ? '#fff' : Colors.accent }]}>
                Esdeveniment
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color={isMine ? '#fff' : Colors.accent} />
          </View>
        </TouchableOpacity>
      </View>

      {/* User message AFTER event (si existeix) */}
      {eventData.userMessage && (
        <View
          style={[
            styles.messageContainer,
            {
              backgroundColor: isMine ? '#4A90E2' : Colors.card,
              marginTop: 6,
            },
          ]}
        >
          <Text style={[styles.messageText, { color: isMine ? '#fff' : Colors.text }]}>
            {eventData.userMessage}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '80%',
    marginVertical: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    marginLeft: 12,
  },
  eventContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messageContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: '100%',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  eventCard: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 180,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  imageErrorText: {
    fontSize: 12,
    marginTop: 8,
  },
  content: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginTop: 0,
    marginHorizontal: -14,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
