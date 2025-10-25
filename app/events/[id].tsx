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
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { router } from 'expo-router';

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

  const [event, setEvent] = useState<any>(null);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors.text }]}>{event.title}</Text>
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
            <Text style={[styles.link, { color: Colors.link, marginTop: 20 }]}>
              {t('More information')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { width: '100%', height: 250 },
  content: { padding: 20, paddingTop: 5 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 16, lineHeight: 22, marginBottom: 20 },
  link: { fontSize: 16, textDecorationLine: 'underline' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  detail: { fontSize: 15, marginBottom: 5 },
  detailLabel: { fontWeight: '600' },
});
