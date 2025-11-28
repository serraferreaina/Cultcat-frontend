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
// 1. IMPORT SMART HOOK
import { useEventStatus, useEventLogic } from '../../context/EventStatus';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import { Share } from 'react-native';

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
  data_inici: string | null; // Updated to match API (snake_case)
  data_fi: string | null; // Updated to match API
}

export default function EventDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Handle array or string id
  const eventId = Array.isArray(id) ? id[0] : id;

  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [event, setEvent] = useState<EventData | null>(null);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { savedEvents, toggleSaved } = useEventStatus();

  // COMENTARIS
  const [modalOpen, setModalOpen] = useState(false);

  // RESSENYES
  const [reviewVisible, setReviewVisible] = useState(false);

  // 2. ADD FETCH LOGIC (This fixes the infinite loading)
  useEffect(() => {
    if (!eventId) return;

    const fetchEventDetail = async () => {
      try {
        const res = await fetch(`http://nattech.fib.upc.edu:40490/events/${eventId}`);
        if (!res.ok) throw new Error('Event not found');
        const data = await res.json();
        setEvent(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [eventId]);

  // Loading View
  if (load) {
    return (
      <View style={[styles.center, { backgroundColor: Colors.background }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  // Error View
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

  // 3. USE SMART LOGIC (Must be called after event is loaded/checked)
  // We use a helper component to safely use the hook, or just use it here carefully
  // Since we returned early for null event, this is safe.
  const LogicWrapper = () => {
    const { isActive, toggle, textKey, textKeyInactive } = useEventLogic(event);

    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: isActive ? Colors.going : Colors.accent }]}
        onPress={toggle}
      >
        <Text style={[styles.buttonText, { color: Colors.card }]}>
          {isActive ? t(textKey) : t(textKeyInactive)}
        </Text>
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background, paddingTop: 50 }]}>
      {/* BACK BUTTON + TITLE */}
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

      {/* BUTTONS */}
      <View style={styles.topButtons}>
        {/* 4. RENDER THE DYNAMIC BUTTON */}
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

      <Text style={[styles.description, { color: Colors.text }]}>
        {event.descripcio?.trim() || t('No description available')}
      </Text>

      {/* DETALLS */}
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

      {/* LINK EXTRA */}
      {typeof Link === 'string' && Link.trim() !== '' && (
        <TouchableOpacity onPress={() => Linking.openURL(Link)}>
          <Text style={[styles.link, { color: Colors.link }]}>{t('More information')}</Text>
        </TouchableOpacity>
      )}

      {/* BOTO RESSENYA */}
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

      {/* COMMENT MODAL */}
      <CommentSection eventId={event.id} visible={modalOpen} onClose={() => setModalOpen(false)} />
      {/* REVIEW MODAL */}
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
});
