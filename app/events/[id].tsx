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
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useEventStatus } from '../../context/EventStatus';
import CommentSection from '../../components/CommentSection';

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
  telefon: string | null;
  email: string | null;
  dataInici: string | null;
  dataFi: string | null;
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
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://nattech.fib.upc.edu:40490/events/${eventId}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        console.error('Error loading event:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

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
      </View>
    );
  }

  const isGoing = !!goingEvents[event!.id];
  const isSaved = !!savedEvents[event!.id];

  const Link = event.enllacos ? Object.values(event.enllacos)[0] : null;
  const imageUri = event.imgApp
    ? `https://agenda.cultura.gencat.cat${event.imgApp}`
    : event.imatges
      ? `https://agenda.cultura.gencat.cat${event.imatges.split(',')[0]}`
      : null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background, paddingTop: 50 }]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 30,
          marginHorizontal: 20,
          marginBottom: 8,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.title, { color: Colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text, marginLeft: 10 }]}>{event.titol}</Text>
      </View>

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 15,
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          style={[styles.button, { backgroundColor: isGoing ? Colors.going : Colors.accent }]}
          onPress={() => toggleGoing(event.id)}
        >
          <Text style={[styles.buttonText, { color: Colors.card }]}>
            {isGoing ? t('I will attend') : t('Want to go')}
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          {/* Save event */}
          <TouchableOpacity style={styles.iconButton} onPress={() => toggleSaved(event.id)}>
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={Colors.text}
            />
          </TouchableOpacity>

          {/* Comments */}
          <TouchableOpacity style={styles.comments} onPress={() => setModalOpen(true)}>
            <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="share-social-outline" size={20} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.description, { color: Colors.text, marginTop: 15 }]}>
        {event.descripcio?.trim() || t('No description available')}
      </Text>

      {/* Details */}
      {event.espai && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>🏛️ </Text>
          <Text style={styles.detailLabel}>{t('Space')}</Text>
          <Text> {event.espai}</Text>
        </Text>
      )}
      {event.direccio && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>📍 </Text>
          <Text style={styles.detailLabel}>{t('Address')}</Text>
          <Text> {event.direccio}</Text>
        </Text>
      )}
      {event.localitat && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>🏙️ </Text>
          <Text style={styles.detailLabel}>{t('Location')}</Text>
          <Text> {event.localitat}</Text>
        </Text>
      )}
      {event.modalitat && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>💡 </Text>
          <Text style={styles.detailLabel}>{t('Modality')}</Text>
          <Text> {event.modalitat}</Text>
        </Text>
      )}
      {event.infoHorari && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>⏰ </Text>
          <Text style={styles.detailLabel}>{t('Schedule')}</Text>
          <Text> {event.infoHorari}</Text>
        </Text>
      )}
      {event.infoEntrades && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>🎟️ </Text>
          <Text style={styles.detailLabel}>{t('Tickets')}</Text>
          <Text> {event.infoEntrades}</Text>
        </Text>
      )}
      {event.telefon && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>☎️ </Text>
          <Text style={styles.detailLabel}>{t('Telephone')}</Text>
          <Text> {event.telefon}</Text>
        </Text>
      )}
      {event.email && (
        <Text style={[styles.detail, { color: Colors.text }]}>
          <Text>📧 </Text>
          <Text style={styles.detailLabel}>{t('Email')}</Text>
          <Text> {event.email}</Text>
        </Text>
      )}

      {/* Link */}
      {typeof Link === 'string' && Link.trim() !== '' && (
        <TouchableOpacity onPress={() => Linking.openURL(Link)}>
          <Text style={[styles.link, { color: Colors.link, marginTop: 20 }]}>
            {t('More information')}
          </Text>
        </TouchableOpacity>
      )}

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
          <Text style={[styles.reviewButtonText, { color: Colors.card }]}>{t('Write review')}</Text>
        </TouchableOpacity>

        <View style={styles.ratingContainer}>
          {[...Array(5)].map((_, i) => (
            <Ionicons
              key={i}
              name="star-outline"
              size={16}
              color={Colors.star_inactive || Colors.text}
            />
          ))}
          <Text style={[styles.ratingText, { color: Colors.text, marginLeft: 4 }]}>0.0</Text>
        </View>
      </View>

      <CommentSection eventId={event.id} visible={modalOpen} onClose={() => setModalOpen(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
    paddingTop: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10,
  },
  link: {
    fontSize: 16,
    textDecorationLine: 'underline',
    marginLeft: 10,
    marginRight: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 20,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    marginBottom: 100,
    marginRight: 10,
  },
  ratingText: {
    fontSize: 13,
  },
  reviewButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 6,
    marginRight: 10,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    padding: 6,
    marginRight: 10,
  },
  comments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentCount: {
    fontSize: 13,
  },
});
