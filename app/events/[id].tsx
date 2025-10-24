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

interface EventData {
  id: number;
  titol: string;
  descripcio: string;
  enllacos: Record<string, string>;
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]}>
      <Image source={event.image} style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors.text }]}>{event.title}</Text>
        <Text style={[styles.description, { color: Colors.text }]}>
          {event.descripcio?.trim() || t('No description available')}
        </Text>

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
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 16, lineHeight: 22 },
  link: { fontSize: 16, textDecorationLine: 'underline' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
