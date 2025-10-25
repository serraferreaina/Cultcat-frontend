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
import { MapPin, Bookmark, SlidersHorizontal, X } from 'lucide-react-native'; // icones pels botons
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useRouter } from 'expo-router';

export default function CercaScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const router = useRouter();

  //Estat del modal d'opcions
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

  //Estat del modal de tematiques
  const [isTopicsModalVisible, setIsTopicsModalVisible] = useState(false);

  const [isAgeModalVisible, setIsAgeModalVisible] = useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 40]); // rang per defecte

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [events, setEvents] = useState<any[]>([]);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Boto per filtrar segons data
    console.log('Buscar events del:', date.toISOString());
  };

  const toggleTopic = (topic: string) => {
    // Boto per filtrar segons altres filtres
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleCloseModal = () => {
    setIsTopicsModalVisible(false);
    console.log('Filtrar esdeveniments per temàtiques:', selectedTopics);
  };

  const topics = ['Deporte', 'Música', 'Lectura'];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('http://nattech.fib.upc.edu:40490/events');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setEvents(data);
      } catch (err: any) {
        console.error('Error al cargar eventos:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const eventsWithImage = events.filter(
    (item) =>
      (item.imatges && item.imatges.trim() !== '') || (item.imgApp && item.imgApp.trim() !== ''),
  );

  const EventCard = ({ item }: { item: any }) => {
    const images: string[] =
      item.imatges && item.imatges.trim() !== ''
        ? item.imatges
            .split(',')
            .map((url: string) => `https://agenda.cultura.gencat.cat${url.trim()}`)
        : item.imgApp && item.imgApp.trim() !== ''
          ? [`https://agenda.cultura.gencat.cat${item.imgApp}`]
          : ['https://via.placeholder.com/300x200/FFFFFF/000000?text=Sense+imatge'];

    const imageToShow = images[0];

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`../events/${item.id}`)}
      >
        <Image source={{ uri: imageToShow }} style={styles.eventImage} />
      </TouchableOpacity>
    );
  };

  const renderEvent = ({ item }: { item: any }) => <EventCard item={item} />;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <ScrollView style={styles.content}>
        {/* Barra de cerca */}
        <SearchBar />

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
            <Text style={[styles.filterText, { color: Colors.text }]}>Ubicación</Text>
          </TouchableOpacity>

          {/* Botó data */}
          <View style={styles.dateButtonWrapper}>
            <SearchDate onDateSelect={handleDateSelect} />
          </View>

          {/* Botó guardats */}
          <TouchableOpacity style={[styles.filterButton, { backgroundColor: Colors.card }]}>
            <Bookmark color={Colors.text} size={18} />
            <Text style={[styles.filterText, { color: Colors.text }]}>Guardados</Text>
          </TouchableOpacity>

          {/* Botó altres */}
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: Colors.card }]}
            onPress={() => setIsOptionsModalVisible(true)}
          >
            <SlidersHorizontal color={Colors.text} size={18} />
            <Text style={[styles.filterText, { color: Colors.text }]}>Otros</Text>
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
                <Text style={[styles.modalTitle, { color: Colors.text }]}>Filtrar por...</Text>
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
                <Text style={[styles.optionText, { color: Colors.text }]}>Edad</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  setIsOptionsModalVisible(false);
                  setIsTopicsModalVisible(true);
                }}
              >
                <Text style={[styles.optionText, { color: Colors.text }]}>Temática</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionItem}
                onPress={() => {
                  console.log('Filtrar por duración');
                  setIsOptionsModalVisible(false);
                }}
              >
                <Text style={[styles.optionText, { color: Colors.text }]}>Duración</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de tematiques*/}
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
                  Filtrar per temàtica
                </Text>
                <TouchableOpacity onPress={handleCloseModal}>
                  <X color={Colors.text} size={20} />
                </TouchableOpacity>
              </View>

              {/* Lista de temáticas */}
              <View style={styles.topicsContainer}>
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic);
                  return (
                    <TouchableOpacity
                      key={topic}
                      style={[
                        styles.topicButton,
                        {
                          backgroundColor: isSelected ? Colors.accent : Colors.background,
                          borderColor: Colors.accent,
                        },
                      ]}
                      onPress={() => toggleTopic(topic)}
                    >
                      <Text
                        style={[
                          styles.topicText,
                          {
                            color: isSelected ? Colors.background : Colors.text,
                          },
                        ]}
                      >
                        {topic}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Boto confirmar la busqueda*/}
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: Colors.accent }]}
                onPress={() => {
                  console.log('Buscar eventos con filtros:', {
                    fecha: selectedDate,
                    tematicas: selectedTopics,
                  });
                  setIsTopicsModalVisible(false);
                }}
              >
                <Text style={[styles.searchButtonText, { color: Colors.background }]}>Buscar</Text>
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
                <Text style={[styles.modalTitle, { color: Colors.text }]}>Filtrar por edad</Text>
                <TouchableOpacity onPress={() => setIsAgeModalVisible(false)}>
                  <X color={Colors.text} size={20} />
                </TouchableOpacity>
              </View>

              {/* Texto del rango */}
              <Text style={[styles.ageValue, { color: Colors.text }]}>
                Edad entre: {ageRange[0]} y {ageRange[1]} años
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
                <Text style={[styles.searchButtonText, { color: Colors.background }]}>Buscar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '600',
            marginVertical: 16,
            marginLeft: 12,
            color: Colors.text,
          }}
        >
          {t('All events')}
        </Text>

        {load ? (
          <ActivityIndicator size="large" color={Colors.accent} />
        ) : error ? (
          <Text style={{ color: Colors.text, textAlign: 'center' }}>
            {t('Error loading events')}: {error}
          </Text>
        ) : (
          <FlatList
            data={eventsWithImage}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderEvent}
            numColumns={3}
            contentContainerStyle={styles.eventsGrid}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
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
    flexDirection: 'row', // tots els botons en una fila
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 120, //amplada min perque tots els botons es vegin be
  },
  dateButtonWrapper: {
    minWidth: 120,
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
});
