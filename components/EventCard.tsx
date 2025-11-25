// components/EventCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useEventStatus } from '../context/EventStatus';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

interface Props {
  item: any; // mateix tipus que fas servir a cerca.tsx
}

export default function EventCard({ item }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();

  const isGoing = !!goingEvents[item.id];
  const isSaved = !!savedEvents[item.id];

  const images: string[] =
    item.imatges && item.imatges.trim() !== ''
      ? item.imatges
          .split(',')
          .map((url: string) => `https://agenda.cultura.gencat.cat${url.trim()}`)
      : item.imgApp && item.imgApp.trim() !== ''
        ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
        : ['https://via.placeholder.com/300x200/FFFFFF/000000?text=Sense+imatge'];

  const imageToShow = images[0];

  const title = item.titol || t('Event without title');
  const espai = item.espai || null;
  const horari = item.infoHorari || null;
  const modalitat = item.modalitat || null;
  const localitat = item.localitat || null;
  const infoEntrades = item.infoEntrades || null;
  const direccio = item.direccio || null;

  return (
    <TouchableOpacity
      style={[styles.eventRow, { backgroundColor: Colors.card }]}
      onPress={() => router.push(`/events/${item.id}`)}
    >
      <Image source={{ uri: imageToShow }} style={styles.eventImageSide} />

      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: Colors.text }]} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.labelContainer}>
          {espai && (
            <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.labelText, { color: Colors.accent }]}>{espai}</Text>
            </View>
          )}
          {horari && horari.length <= 4 && (
            <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.labelText, { color: Colors.accent }]}>{horari}</Text>
            </View>
          )}
          {modalitat && (
            <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.labelText, { color: Colors.accent }]}>{modalitat}</Text>
            </View>
          )}
          {localitat && (
            <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.labelText, { color: Colors.accent }]}>{localitat}</Text>
            </View>
          )}
          {infoEntrades && infoEntrades.length <= 30 && (
            <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.labelText, { color: Colors.accent }]}>{infoEntrades}</Text>
            </View>
          )}
          {direccio && direccio.length <= 15 && (
            <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
              <Text style={[styles.labelText, { color: Colors.accent }]}>{direccio}</Text>
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.iconButton, { marginRight: 12 }]}
              onPress={() => toggleSaved(item.id)}
            >
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            <View style={[styles.comments, { marginRight: 12 }]}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
              <Text style={[styles.commentCount, { color: Colors.text }]}>0</Text>
            </View>

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

          <TouchableOpacity
            style={[styles.button, { backgroundColor: isGoing ? Colors.going : Colors.accent }]}
            onPress={() => toggleGoing(item.id)}
          >
            <Text style={[styles.buttonText, { color: Colors.card }]}>
              {isGoing ? t('I will attend') : t('Want to go')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
    elevation: 2,
  },
  eventImageSide: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  eventInfo: {
    flex: 1,
    padding: 10,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  label: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  buttonText: {
    fontWeight: '400',
    fontSize: 12,
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