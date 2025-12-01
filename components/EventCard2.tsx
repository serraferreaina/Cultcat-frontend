import React from 'react';
import { View, Text, TouchableOpacity, Image, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
// 1. Import the hook directly here
import { useEventStatus } from '../context/EventStatus';

interface Event {
  id: number;
  titol?: string;
  localitat?: string;
  imatges?: string | null;
  imgApp?: string | null;
  espai?: string;
  infoHorari?: string;
  modalitat?: string;
  infoEntrades?: string;
  direccio?: string;
  comentaris?: number;
  data_inici?: string | null;
}

interface EventCardProps {
  item: Event;
  // We REMOVED all the toggle/status props from here.
  // The card handles them internally now.
  router: any;
  Colors: { [key: string]: string };
}

export const EventCard: React.FC<EventCardProps> = ({ item, router, Colors }) => {
  // 2. Consume the context INSIDE the card
  const { goingEvents, savedEvents, assistedEvents, toggleGoing, toggleSaved, toggleAssisted } =
    useEventStatus();

  const { t } = useTranslation();

  // Safe checks using the context values
  const isGoing = !!goingEvents[item.id];
  const isSaved = !!savedEvents[item.id];
  const isAssisted = !!assistedEvents[item.id];

  const images: string[] =
    item.imatges && item.imatges.trim() !== ''
      ? item.imatges.split(',').map((url) => `https://agenda.cultura.gencat.cat${url.trim()}`)
      : item.imgApp && item.imgApp.trim() !== ''
        ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
        : ['https://via.placeholder.com/300x200/FFFFFF/000000?text=Sense+imatge'];

  const imageToShow = images[0];

  // --- Logic to check if event is past ---
  const isEventPast = (): boolean => {
    if (!item.data_inici) return false; // If no date, assume future/current

    const eventDate = new Date(item.data_inici);
    const today = new Date();
    // Reset time to midnight for simple date comparison
    today.setHours(0, 0, 0, 0);

    // If event is strictly before today
    return eventDate < today;
  };

  const isPast = isEventPast();

  return (
    <TouchableOpacity
      style={[styles.eventRow, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
      onPress={() => router.push(`../events/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: imageToShow }} style={styles.eventImageSide} />

      <View style={styles.eventInfo}>
        <Text style={[styles.eventTitle, { color: Colors.text }]} numberOfLines={2}>
          {item.titol || t('Event without title')}
        </Text>

        <View style={styles.labelContainer}>
          {item.espai && <Label text={item.espai} color={Colors.accent} />}
          {item.localitat && <Label text={item.localitat} color={Colors.accent} />}
          {/* Add other labels as needed */}
        </View>

        <View style={styles.cardButtonsRow}>
          <View style={styles.cardButtonsLeft}>
            {/* Save Button */}
            <TouchableOpacity style={styles.iconButton} onPress={() => toggleSaved(item.id)}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            {/* Comments */}
            <View style={styles.comments}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
              <Text style={[styles.commentCount, { color: Colors.text }]}>
                {item.comentaris || 0}
              </Text>
            </View>

            {/* Share */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                const url = `https://tu-app.com/event/${item.id}`;
                Share.share({ message: `Check this event: ${url}`, url });
              }}
            >
              <Ionicons name="share-social-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* DYNAMIC BUTTON LOGIC */}
          {isPast ? (
            // --- PAST EVENT: Show ASSISTED Button ---
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: isAssisted ? Colors.going : Colors.accent },
              ]}
              onPress={() => toggleAssisted(item.id)}
            >
              <Text style={[styles.buttonText, { color: Colors.card }]}>
                {isAssisted ? t('Assisted') : t('I have assisted')}
              </Text>
            </TouchableOpacity>
          ) : (
            // --- FUTURE EVENT: Show WANT TO GO Button ---
            <TouchableOpacity
              style={[styles.button, { backgroundColor: isGoing ? Colors.going : Colors.accent }]}
              onPress={() => toggleGoing(item.id)}
            >
              <Text style={[styles.buttonText, { color: Colors.card }]}>
                {isGoing ? t('I will attend') : t('Want to go')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const Label: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <View style={[styles.label, { backgroundColor: color + '22' }]}>
    <Text style={[styles.labelText, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 6,
    elevation: 2,
    width: '95%',
    alignSelf: 'center',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
  },
  eventImageSide: {
    width: 100,
    height: 100,
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
  cardButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  cardButtonsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 6,
    marginRight: 12,
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
    fontWeight: '400',
    fontSize: 12,
  },
});
