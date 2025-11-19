import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import React from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStatus } from '../context/EventStatus';

export default function CercaScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const router = useRouter();
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();

  const [events, setEvents] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchEvents = async () => {
      const res = await fetch('http://nattech.fib.upc.edu:40490/events');
      const data = await res.json();
      setEvents(data.filter((e: any) => savedEvents[e.id]));
    };
    fetchEvents();
  }, [savedEvents]);

  const EventCard = React.memo(({ item }: { item: any }) => {
    const isGoing = !!goingEvents[item.id];
    const isSaved = !!savedEvents[item.id];

    const images = item.imatges
      ? item.imatges
          .split(',')
          .map((url: string) => `https://agenda.cultura.gencat.cat${url.trim()}`)
      : item.imgApp
        ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
        : ['https://via.placeholder.com/300x200/FFFFFF/000000?text=Sense+imatge'];

    const imageToShow = images[0];
    const title = item.titol || t('Event without title');
    const espai = item.espai || null;
    const horari = item.infoHorari || null;

    return (
      <TouchableOpacity
        style={[styles.eventRow, { backgroundColor: Colors.card }]}
        onPress={() => router.push(`../events/${item.id}`)}
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
            {horari && (
              <View style={[styles.label, { backgroundColor: Colors.accent + '22' }]}>
                <Text style={[styles.labelText, { color: Colors.accent }]}>{horari}</Text>
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

              <TouchableOpacity style={[styles.iconButton, { marginRight: 12 }]}>
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
  });

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 16,
          marginBottom: 16,
          marginHorizontal: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.text }}>
          {t('Saved events')}
        </Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <EventCard item={item} />}
        contentContainerStyle={styles.eventsList}
      />

      {events.length === 0 && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.text }}>
          {t('No saved events')}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  eventsList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    gap: 10,
  },
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
