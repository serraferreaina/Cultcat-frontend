import React from 'react';
import { View, Text, TouchableOpacity, Image, Share, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface Event {
  id: number;
  titol?: string;
  localitat?: string;
  imatges?: string;
  imgApp?: string;
  espai?: string;
  infoHorari?: string;
  modalitat?: string;
  infoEntrades?: string;
  direccio?: string;
  comentaris?: number;
}

interface EventCardProps {
  item: Event;
  toggleGoing: (id: number) => void;
  toggleSaved: (id: number) => void;
  goingEvents: Record<number, boolean>;
  savedEvents: Record<number, boolean>;
  router: any;
  Colors: { [key: string]: string };
}

export const EventCard: React.FC<EventCardProps> = ({
  item,
  toggleGoing,
  toggleSaved,
  goingEvents,
  savedEvents,
  router,
  Colors,
}) => {
  const isGoing = !!goingEvents[item.id];
  const isSaved = !!savedEvents[item.id];
  const { t } = useTranslation();

  const images: string[] =
    item.imatges && item.imatges.trim() !== ''
      ? item.imatges.split(',').map((url) => `https://agenda.cultura.gencat.cat${url.trim()}`)
      : item.imgApp && item.imgApp.trim() !== ''
        ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
        : ['https://via.placeholder.com/300x200/FFFFFF/000000?text=Sense+imatge'];

  const imageToShow = images[0];

  return (
    <TouchableOpacity
      style={[styles.eventRow, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}
      onPress={() => router.push(`../events/${item.id}`)}
      activeOpacity={0.8}
    >
      {/* Imagen */}
      <Image source={{ uri: imageToShow }} style={styles.eventImageSide} />

      <View style={styles.eventInfo}>
        {/* Título */}
        <Text style={[styles.eventTitle, { color: Colors.text }]} numberOfLines={2}>
          {item.titol || t('Event without title')}
        </Text>

        {/* Labels */}
        <View style={styles.labelContainer}>
          {item.espai && <Label text={item.espai} color={Colors.accent} />}
          {item.infoHorari && item.infoHorari.length <= 4 && (
            <Label text={item.infoHorari} color={Colors.accent} />
          )}
          {item.modalitat && <Label text={item.modalitat} color={Colors.accent} />}
          {item.localitat && <Label text={item.localitat} color={Colors.accent} />}
          {item.infoEntrades && item.infoEntrades.length <= 30 && (
            <Label text={item.infoEntrades} color={Colors.accent} />
          )}
          {item.direccio && item.direccio.length <= 15 && (
            <Label text={item.direccio} color={Colors.accent} />
          )}
        </View>

        {/* Botones */}
        <View style={styles.cardButtonsRow}>
          <View style={styles.cardButtonsLeft}>
            {/* Guardar */}
            <TouchableOpacity style={styles.iconButton} onPress={() => toggleSaved(item.id)}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={Colors.text}
              />
            </TouchableOpacity>

            {/* Comentarios */}
            <View style={styles.comments}>
              <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
              <Text style={[styles.commentCount, { color: Colors.text }]}>
                {item.comentaris || 0}
              </Text>
            </View>

            {/* Compartir */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                const url = `https://tu-app.com/event/${item.id}`;
                Share.share({ message: `Mira este evento: ${url}`, url });
              }}
            >
              <Ionicons name="share-social-outline" size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Asistir */}
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
};

// Label para etiquetas
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
