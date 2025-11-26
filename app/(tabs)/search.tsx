// app/(tabs)/cerca.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import SearchBar from '../../components/SearchBar';
import { useTranslation } from 'react-i18next';
import SearchDate from '../../components/SearchDate';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import React, { useState, useEffect } from 'react';
import { MapPin, Bookmark, SlidersHorizontal, X } from 'lucide-react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStatus } from '../../context/EventStatus';
import { Share } from 'react-native';
import { Alert } from 'react-native';

export default function CercaScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

  const [isTopicsModalVisible, setIsTopicsModalVisible] = useState(false);

  const [isAgeModalVisible, setIsAgeModalVisible] = useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 40]);

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [events, setEvents] = useState<any[]>([]);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { goingEvents, savedEvents, toggleGoing, toggleSaved } = useEventStatus();
  const [isFiltered, setIsFiltered] = useState(false);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    console.log('Buscar events del:', date.toISOString());
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleCloseModal = () => {
    setIsTopicsModalVisible(false);
    console.log('Filtrar esdeveniments per temàtiques:', selectedTopics);
  };

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreEvents = async () => {
    if (loadingMore || isFiltered) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`http://nattech.fib.upc.edu:40490/events?page=${page + 1}`);
      const data = await res.json();
      setEvents((prev) => [...prev, ...data]);
      setPage(page + 1);
    } catch (err) {
      console.error('Error al cargar más eventos:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (isFiltered) return;

    const fetchEvents = async () => {
      try {
        const res = await fetch('http://nattech.fib.upc.edu:40490/events');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        console.error(t('Error loading events'), err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [isFiltered]);

  const EventCard = React.memo(({ item }: { item: any }) => {
    const isGoing = !!goingEvents[item.id];

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

    const isSaved = !!savedEvents[item.id];

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
  });

  const [noEventsMessage, setNoEventsMessage] = useState<string | null>(null);

  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), delay);
    };
  };

  const handleSearch = async (text: string) => {
    const query = text.trim();
    if (!query) return;

    try {
      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/events?q=${encodeURIComponent(query)}`,
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const textData = await res.text();
      const data = textData ? JSON.parse(textData) : [];

      if (!Array.isArray(data) || data.length === 0) {
        Alert.alert(t('No events found'), t('No events match', { query }));
        return;
      }

      router.push({
        pathname: '/searchResults',
        params: { query },
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'There was a problem fetching events.');
    }
  };

  const handleSearchByTopics = async () => {
    setIsTopicsModalVisible(false);
    setLoading(true);
    setNoEventsMessage(null);
    setEvents([]);

    try {
      let url = 'http://nattech.fib.upc.edu:40490/events';

      if (selectedTopics.length === 1) {
        url += `?categoria=${selectedTopics[0]}`;
      } else if (selectedTopics.length > 1) {
        const query = selectedTopics.join(',');
        url += `?categories=${query}`;
      }

      console.log('URL de búsqueda:', url);

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();

      if (data.length === 0) {
        setEvents([]);
        setNoEventsMessage(t('No events for selected categories'));
      } else {
        setEvents(data);
        setNoEventsMessage(null);
      }

      setIsFiltered(true);
    } catch (err: any) {
      console.error('Error fetching filtered events:', err);
      setError(err.message);
      setNoEventsMessage(t('No events for selected categories'));
    } finally {
      setLoading(false);
    }
  };

  const renderEvent = ({ item }: { item: any }) => <EventCard item={item} />;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {/* Barra de cerca */}
      <SearchBar onSearch={handleSearch} />

      {/* Scroll horizontal */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersRow}
      >
        {/* Botó ubicació */}
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: Colors.card }]}>
          <MapPin color={Colors.text} size={18} />
          <Text style={[styles.filterText, { color: Colors.text }]}>{t('Location')}</Text>
        </TouchableOpacity>

        {/* Botó data */}
        <View style={styles.dateButtonWrapper}>
          <SearchDate onDateSelect={handleDateSelect} />
        </View>

        {/* Botó guardats */}
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: Colors.card }]}>
          <Bookmark color={Colors.text} size={18} />
          <Text style={[styles.filterText, { color: Colors.text }]}>{t('Saved')}</Text>
        </TouchableOpacity>

        {/* Botó altres */}
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: Colors.card }]}
          onPress={() => setIsOptionsModalVisible(true)}
        >
          <SlidersHorizontal color={Colors.text} size={18} />
          <Text style={[styles.filterText, { color: Colors.text }]}>{t('Others')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Data seleccionada */}
      {selectedDate && (
        <Text style={[styles.dateText, { color: Colors.text }]}>
          {t('Showing date')} {selectedDate.toLocaleDateString()}
        </Text>
      )}

      {/* Modal d'altres*/}
      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOptionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.optionsModal, { backgroundColor: Colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>{t('Filter by')}</Text>

              <TouchableOpacity onPress={() => setIsOptionsModalVisible(false)}>
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setIsOptionsModalVisible(false);
                setIsAgeModalVisible(true); // obrir modal del rang d'edat
              }}
            >
              <Text style={[styles.optionText, { color: Colors.text }]}>{t('Age')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setIsOptionsModalVisible(false);
                setIsTopicsModalVisible(true);
              }}
            >
              <Text style={[styles.optionText, { color: Colors.text }]}>{t('Category')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                {
                }
                {
                }
                console.log('Filtrar por duración');
                setIsOptionsModalVisible(false);
              }}
            >
              <Text style={[styles.optionText, { color: Colors.text }]}>{t('Duration')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de categories*/}
      <Modal
        visible={isTopicsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                {t('Filter by category')}
              </Text>

              <TouchableOpacity onPress={handleCloseModal}>
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>

            {/* Lista de categorias */}
            <View style={styles.topicsContainer}>
              {[
                'concerts',
                'infantil',
                'musica',
                'espectacles',
                'teatre',
                'activitats-virtuals',
                'arts-visuals',
                'rutes-i-visites',
                'exposicions',
                'divulgacio',
                'dansa',
                'circ',
                'conferencies',
                'cursos',
                'cinema',
                'llibres-i-lletres',
                'festivals-i-mostres',
                'tradicional-i-popular',
                'cicles',
                'zz-altres-ambits',
                'carnavals',
                'fires-i-mercats',
                'gastronomia',
                'festes',
                'commemoracions',
                'setmana-santa',
                'gegants',
                'sardanes',
                'nadal',
              ].map((category) => {
                const isSelected = selectedTopics.includes(category);
                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.topicButton,
                      {
                        backgroundColor: isSelected ? Colors.accent : Colors.background,
                        borderColor: Colors.accent,
                      },
                    ]}
                    onPress={() => toggleTopic(category)}
                  >
                    <Text
                      style={[
                        styles.topicText,
                        {
                          color: isSelected ? Colors.background : Colors.text,
                        },
                      ]}
                    >
                      {t(category)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Boto confirmar la busqueda*/}
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: Colors.accent }]}
              onPress={handleSearchByTopics}
            >
              <Text style={[styles.searchButtonText, { color: Colors.background }]}>
                {t('search')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal rang d'edat*/}
      <Modal
        visible={isAgeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAgeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>{t('Filter by age')}</Text>
              <TouchableOpacity onPress={() => setIsAgeModalVisible(false)}>
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>

            {/* Texto del rango */}
            <Text style={[styles.ageValue, { color: Colors.text }]}>
              {t('Age between')} {ageRange[0]} {t('and')} {ageRange[1]} {t('years')}
            </Text>

            {/* Slider de rango */}
            <View style={styles.sliderContainer}>
              <MultiSlider
                values={ageRange}
                min={0}
                max={100}
                step={1}
                sliderLength={250}
                onValuesChange={(values) => setAgeRange(values as [number, number])}
                selectedStyle={{ backgroundColor: Colors.accent }}
                unselectedStyle={{ backgroundColor: Colors.border }}
                markerStyle={{
                  backgroundColor: Colors.accent,
                  height: 20,
                  width: 20,
                }}
              />
            </View>

            {/* Botón de buscar */}
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: Colors.accent }]}
              onPress={() => {
                console.log('Filtrar eventos por edad:', ageRange);
                setIsAgeModalVisible(false);
              }}
            >
              <Text style={[styles.searchButtonText, { color: Colors.background }]}>
                {t('search')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FlatList
        data={events}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderEvent}
        contentContainerStyle={styles.eventsList}
        onEndReached={isFiltered ? undefined : loadMoreEvents}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginTop: 12,
                marginLeft: 12,
                color: Colors.text,
              }}
            >
              {isFiltered ? t('Filtered events') : t('All events')}
            </Text>
          </>
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color={Colors.accent} /> : null
        }
      />

      {!load && events.length === 0 && noEventsMessage && (
        <Text style={{ textAlign: 'center', marginTop: 20, color: Colors.text }}>
          {noEventsMessage}
        </Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  filtersScroll: {
    marginTop: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  dateButtonWrapper: {
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 14,
  },
  dateText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  optionsModal: {
    width: '80%',
    borderRadius: 12,
    padding: 16,
    elevation: 5,
  },
  optionItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 15,
  },

  modalContent: {
    width: '85%',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  topicButton: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  topicText: {
    fontSize: 14,
  },
  searchButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  sliderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  ageValue: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 10,
    fontWeight: '500',
  },
  eventsGrid: {
    paddingHorizontal: 8,
    paddingBottom: 20,
    gap: 8,
  },
  eventCard: {
    flex: 1,
    aspectRatio: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
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
