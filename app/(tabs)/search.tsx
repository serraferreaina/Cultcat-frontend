// app/(tabs)/cerca.tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import SearchBar from '../../components/SearchBar';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Bookmark, Star, SlidersHorizontal, X } from 'lucide-react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventStatus } from '../../context/EventStatus';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';
import { municipisCatalunya } from '../../cerca/municipisCatalunya';
import DateFilterComponent from '../../components/DateFilterComponent';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ShareEventModal } from '../../components/ShareEventModal';

export default function CercaScreen() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

  const [isTopicsModalVisible, setIsTopicsModalVisible] = useState(false);

  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  const [events, setEvents] = useState<any[]>([]);
  const [load, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { goingEvents, savedEvents, toggleGoing, toggleSaved, attendanceDates } = useEventStatus();
  const [isFiltered, setIsFiltered] = useState(false);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedEventForShare, setSelectedEventForShare] = useState<any | null>(null);

  const normalizeDate = (date: Date): Date => {
    // Crear una nova data amb les hores establertes al migdia per evitar problemes de zona horària
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  };

  // Estats per al modal de data
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEventForDate, setSelectedEventForDate] = useState<any | null>(null);

  const [isMunicipiModalVisible, setIsMunicipiModalVisible] = useState(false);
  const [municipiSearch, setMunicipiSearch] = useState('');
  const [selectedMunicipi, setSelectedMunicipi] = useState<string | null>(null);
  const filteredMunicipis = useMemo(() => {
    return municipisCatalunya.filter((m) => m.toLowerCase().includes(municipiSearch.toLowerCase()));
  }, [municipiSearch]);

  const BATCH_SIZE = 25;

  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic],
    );
  };

  const handleCloseModal = () => {
    setIsTopicsModalVisible(false);
  };

  const shouldHideEvent = (event: any): boolean => {
    if (!event.data_fi) return false;

    const endDate = new Date(event.data_fi);
    const targetDate = new Date('2924-06-30');

    return (
      endDate.getFullYear() === targetDate.getFullYear() &&
      endDate.getMonth() === targetDate.getMonth() &&
      endDate.getDate() === targetDate.getDate()
    );
  };

  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMoreEvents = () => {
    if (!hasMore || loadingMore || isFiltered) return;
    fetchEvents();
  };

  const fetchEvents = async (reset = false) => {
    if (loadingMore) return;

    reset ? setLoading(true) : setLoadingMore(true);

    try {
      const currentOffset = reset ? 0 : offset;
      const today = new Date().toISOString().split('T')[0];

      const res = await fetch(
        `http://nattech.fib.upc.edu:40490/events?batch_size=${BATCH_SIZE}&offset=${currentOffset}&from_date=${today}&order_by_date=asc`,
      );

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      const newEvents = (data.results || []).filter((event: any) => !shouldHideEvent(event));

      setEvents((prev) => (reset ? newEvents : [...prev, ...newEvents]));
      setOffset(currentOffset + BATCH_SIZE);

      if (newEvents.length < BATCH_SIZE) {
        setHasMore(false);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents(true);
  }, []);

  const handleSearchByMunicipi = async (municipi: string) => {
    setSelectedMunicipi(municipi);
    setIsMunicipiModalVisible(false);
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const query = buildQuery([`from_date=${today}`]);
      const url = `http://nattech.fib.upc.edu:40490/events${query}`;

      const res = await fetch(url);

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const textData = await res.text();

      let data = [];
      try {
        data = textData.trim() ? JSON.parse(textData) : [];
      } catch (e) {
        console.error('JSON PARSE ERROR:', textData);
        data = [];
      }

      const filteredData = data.filter((event: any) => !shouldHideEvent(event));

      setEvents(filteredData);
      setIsFiltered(true);

      if (filteredData.length === 0) {
        Alert.alert(t('Cap esdeveniment'), t('No hi ha esdeveniments a ') + `${municipi}`, [
          { text: "D'acord" },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message);
      Alert.alert(t('Error'), t('Hi ha hagut un problema carregant els esdeveniments.'));
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (date) {
      setSelectedDate(date);
    }
  };

  const confirmDate = async () => {
    if (selectedEventForDate) {
      // Normalitzar la data abans d'enviar-la
      const normalizedDate = normalizeDate(selectedDate);
      await toggleGoing(selectedEventForDate.id, normalizedDate);
    }
    setShowDatePicker(false);
    setShowDateModal(false);
    setSelectedEventForDate(null);
  };

  const getMinMaxDates = () => {
    if (!selectedEventForDate) return { minDate: new Date(), maxDate: new Date() };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = selectedEventForDate.data_inici
      ? new Date(selectedEventForDate.data_inici)
      : new Date();
    startDate.setHours(0, 0, 0, 0);

    const minDate = startDate < today ? today : startDate;
    const maxDate = selectedEventForDate.data_fi
      ? new Date(selectedEventForDate.data_fi)
      : new Date();

    return { minDate, maxDate };
  };

  // Función para verificar si una fecha es hoy
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const compareDate = new Date(date);

    return (
      today.getDate() === compareDate.getDate() &&
      today.getMonth() === compareDate.getMonth() &&
      today.getFullYear() === compareDate.getFullYear()
    );
  };

  // Función para verificar si una fecha es mañana
  const isTomorrow = (date: Date): boolean => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const compareDate = new Date(date);

    return (
      tomorrow.getDate() === compareDate.getDate() &&
      tomorrow.getMonth() === compareDate.getMonth() &&
      tomorrow.getFullYear() === compareDate.getFullYear()
    );
  };

  // Función para verificar si la fecha de asistencia ya ha pasado (antes de hoy)
  const hasAttendanceDatePassed = (attendanceDate: Date): boolean => {
    const today = new Date();
    const attendance = new Date(attendanceDate);

    // Comparar solo año, mes y día (ignorar horas)
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const attendanceOnlyDate = new Date(
      attendance.getFullYear(),
      attendance.getMonth(),
      attendance.getDate(),
    );

    // Solo ha pasado si es ANTES de hoy (no incluye hoy)
    return attendanceOnlyDate < todayDate;
  };

  // Función para verificar si el evento ya ha pasado completamente
  const hasEventPassedCompletely = (event: any): boolean => {
    if (!event.data_fi) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(event.data_fi);
    endDate.setHours(0, 0, 0, 0);

    return endDate < today;
  };

  const EventCard = React.memo(({ item }: { item: any }) => {
    const isGoing = !!goingEvents[item.id];

    const attendanceDate = attendanceDates[item.id]
      ? (() => {
          const [year, month, day] = attendanceDates[item.id].split('-').map(Number);
          return new Date(year, month - 1, day, 12, 0, 0);
        })()
      : undefined;

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

    const eventHasPassedCompletely = hasEventPassedCompletely(item);

    // Si tiene fecha de asistencia, verificar si esa fecha ya pasó o es hoy
    const userAttendancePassed = attendanceDate ? hasAttendanceDatePassed(attendanceDate) : false;
    const userAttendanceIsToday = attendanceDate ? isToday(attendanceDate) : false;
    const userAttendanceIsTomorrow = attendanceDate ? isTomorrow(attendanceDate) : false;
    const userAttendanceIsFuture =
      attendanceDate && !userAttendancePassed && !userAttendanceIsToday;

    const getButtonText = () => {
      // Prioridad 1: Si la fecha de asistencia del usuario es hoy
      if (userAttendanceIsToday) {
        return t('Today is the event');
      }
      // Prioridad 2: Si la fecha de asistencia del usuario ya pasó (ayer o antes)
      else if (userAttendancePassed) {
        const formattedDate = attendanceDate!.toLocaleDateString(i18n.language, {
          day: 'numeric',
          month: 'short',
        });
        return t('You attended - ') + formattedDate;
      }
      // Prioridad 3: Si el evento ya pasó completamente pero NO tiene fecha de asistencia
      else if (eventHasPassedCompletely && !attendanceDate) {
        return t('No vares assistir');
      }
      // Prioridad 4: Si tiene fecha de asistencia futura (incluye mañana)
      else if (attendanceDate && (userAttendanceIsFuture || userAttendanceIsTomorrow)) {
        const formattedDate = attendanceDate.toLocaleDateString(i18n.language, {
          day: 'numeric',
          month: 'short',
        });
        return t('I will attend') + ` - ${formattedDate}`;
      }
      // Prioridad 5: Tiene isGoing pero no tiene attendanceDate
      else if (isGoing && !attendanceDate) {
        return t('I will attend');
      }
      // Prioridad 6: No está activo
      else {
        return t('Want to go');
      }
    };

    const getButtonColor = () => {
      if (userAttendanceIsToday) {
        return '#FFA500'; // Naranja/amarillo
      } else if (userAttendancePassed || eventHasPassedCompletely) {
        return '#FF6B6B'; // Rojo
      } else if (isGoing) {
        return Colors.going; // Verde
      } else {
        return Colors.accent;
      }
    };

    const isButtonDisabled = () => {
      return userAttendanceIsToday || userAttendancePassed || eventHasPassedCompletely;
    };

    const handleShare = () => {
      setSelectedEventForShare(item);
      setShareModalVisible(true);
    };

    const handleButtonPress = () => {
      // Si la fecha de asistencia del usuario es hoy, no permitir cambios
      if (userAttendanceIsToday) {
        return;
      }

      // Si la fecha de asistencia del usuario ya pasó, no permitir cambios
      if (userAttendancePassed) {
        return;
      }

      // Si ya ha pasado completamente el evento, no permitir cambios
      if (eventHasPassedCompletely) {
        return;
      }

      if (!isGoing) {
        setSelectedEventForDate(item);
        if (item.data_inici) {
          setSelectedDate(new Date(item.data_inici));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const startDate = item.data_inici ? new Date(item.data_inici) : new Date();
        startDate.setHours(0, 0, 0, 0);

        // Siempre empezar desde mañana como mínimo
        let minDate = tomorrow;

        // Si el evento empieza después de mañana, usar esa fecha
        if (startDate > tomorrow) {
          minDate = startDate;
        }

        const maxDate = item.data_fi ? new Date(item.data_fi) : new Date();
        maxDate.setHours(0, 0, 0, 0);

        const isSingleDay = minDate.getTime() === maxDate.getTime();

        if (isSingleDay) {
          const normalizedMinDate = normalizeDate(minDate);
          toggleGoing(item.id, normalizedMinDate);
        } else {
          setShowDateModal(true);
        }
      } else {
        toggleGoing(item.id);
      }
    };

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

          {/* Message for today's event */}
          {userAttendanceIsToday && (
            <Text style={[styles.messageText, { color: Colors.accent }]}>Recorda assistir-hi</Text>
          )}

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

              <TouchableOpacity
                style={[styles.comments, { marginRight: 12 }]}
                onPress={() => {
                  setSelectedEventId(item.id);
                  setShowComments(true);
                }}
              >
                <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={20} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: getButtonColor(), opacity: isButtonDisabled() ? 0.7 : 1 },
              ]}
              onPress={handleButtonPress}
              disabled={isButtonDisabled()}
            >
              <Text style={[styles.buttonText, { color: Colors.card }]}>{getButtonText()}</Text>
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

      setTimeout(() => {
        setSearchQuery('');
      }, 50);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', t('There was a problem fetching events.'));
    }
  };

  const buildQuery = (extraParams: string[] = []) => {
    const params: string[] = [];

    if (selectedTopics.length > 0) {
      params.push(...selectedTopics.map((topic) => `categoria=${encodeURIComponent(topic)}`));
    }

    if (selectedMunicipi) {
      params.push(`municipi=${encodeURIComponent(selectedMunicipi)}`);
    }

    params.push(...extraParams);

    return params.length > 0 ? `?${params.join('&')}` : '';
  };

  const handleSearchByTopics = async () => {
    setIsTopicsModalVisible(false);
    setLoading(true);
    setNoEventsMessage(null);
    setEvents([]);

    try {
      const today = new Date().toISOString().split('T')[0];
      const query = buildQuery([`from_date=${today}`]);
      const url = `http://nattech.fib.upc.edu:40490/events${query}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const textData = await res.text();
      const data = textData ? JSON.parse(textData) : [];

      const filteredData = data.filter((event: any) => !shouldHideEvent(event));

      if (filteredData.length === 0) {
        setEvents([]);
        setNoEventsMessage(t('No events for selected categories'));
      } else {
        setEvents(filteredData);
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

  if (load) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={{ color: Colors.text, marginTop: 16, fontSize: 16, fontWeight: '500' }}>
            {t('Loading events')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: Colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} onSearch={handleSearch} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersRow}
      >
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: Colors.card }]}
          onPress={() => setIsMunicipiModalVisible(true)}
        >
          <MapPin color={Colors.text} size={18} />
          <Text style={[styles.filterText, { color: Colors.text }]}>
            {selectedMunicipi || t('Location')}
          </Text>
        </TouchableOpacity>

        <DateFilterComponent
          mode="one"
          onModeChange={(m) => {}}
          onDatesChange={({ date, date1, date2, fromDate }) => {
            setIsFiltered(true);
            let extraParams: string[] = [];

            if (date) {
              extraParams.push(`date=${encodeURIComponent(date.toISOString().split('T')[0])}`);
            }
            if (date1 && date2) {
              extraParams.push(`date1=${encodeURIComponent(date1.toISOString().split('T')[0])}`);
              extraParams.push(`date2=${encodeURIComponent(date2.toISOString().split('T')[0])}`);
            }
            if (fromDate) {
              extraParams.push(
                `fromDate=${encodeURIComponent(fromDate.toISOString().split('T')[0])}`,
              );
            }

            const query = buildQuery(extraParams);
            const url = `http://nattech.fib.upc.edu:40490/events${query}`;

            setLoading(true);
            fetch(url)
              .then((res) => res.json())
              .then((data) => setEvents(data))
              .catch((err) => console.error(err))
              .finally(() => setLoading(false));
          }}
        />

        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: Colors.card }]}
          onPress={() => setIsTopicsModalVisible(true)}
        >
          <Star color={Colors.text} size={18} />
          <Text style={[styles.filterText, { color: Colors.text }]}>{t('Category')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: Colors.card }]}
          onPress={() => setIsOptionsModalVisible(true)}
        >
          <SlidersHorizontal color={Colors.text} size={18} />
          <Text style={[styles.filterText, { color: Colors.text }]}>{t('Others')}</Text>
        </TouchableOpacity>
      </ScrollView>

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
              style={[styles.optionItem, { paddingVertical: 8 }]}
              onPress={() => {
                setSelectedMunicipi(null);
                setSelectedTopics([]);
                setIsMunicipiModalVisible(false);
                setIsOptionsModalVisible(false);
                setIsFiltered(false);
                setOffset(0);
                setHasMore(true);
                fetchEvents(true);
              }}
            >
              <Text style={{ color: Colors.text, fontSize: 14, fontWeight: '600' }}>
                {t('Clear filter')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isTopicsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                {t('Filter by category')}
              </Text>

              <TouchableOpacity onPress={handleCloseModal}>
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>

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

      <Modal
        visible={isMunicipiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMunicipiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.optionsModal, { backgroundColor: Colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                {t('Select municipality')}
              </Text>
              <TouchableOpacity onPress={() => setIsMunicipiModalVisible(false)}>
                <X color={Colors.text} size={20} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { marginBottom: 12, borderColor: Colors.accent }]}
              placeholder={t('Search municipality')}
              placeholderTextColor={Colors.text + '88'}
              value={municipiSearch}
              onChangeText={setMunicipiSearch}
            />

            <TouchableOpacity
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                backgroundColor: Colors.accent,
                borderRadius: 10,
                marginBottom: 8,
                alignItems: 'center',
              }}
              onPress={() => {
                setSelectedMunicipi(null);
                setIsMunicipiModalVisible(false);
                setIsFiltered(false);
                setLoading(true);

                fetch('http://nattech.fib.upc.edu:40490/events')
                  .then((res) => res.json())
                  .then((data) => setEvents(data))
                  .catch((err) => console.error(err))
                  .finally(() => setLoading(false));
              }}
            >
              <Text style={{ color: Colors.background, fontWeight: '600' }}>
                {t('Clear filter')}
              </Text>
            </TouchableOpacity>

            <ScrollView style={{ maxHeight: 200 }}>
              {filteredMunicipis.map((m, index) => (
                <TouchableOpacity
                  key={`${m}-${index}`}
                  style={[styles.optionItem, { paddingVertical: 8 }]}
                  onPress={() => handleSearchByMunicipi(m)}
                >
                  <Text style={{ color: Colors.text, fontSize: 14 }}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE SELECCIÓN DE FECHA */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={[styles.dateModalContainer, { backgroundColor: Colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.text }]}>
                {t('Select attendance date')}
              </Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: Colors.textSecondary }]}>
              {t('Choose the day you want to attend this event')}
            </Text>

            <View style={styles.datePickerContainer}>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={getMinMaxDates().minDate}
                  maximumDate={getMinMaxDates().maxDate}
                  locale={i18n.language}
                  textColor={Colors.text}
                />
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: Colors.background }]}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
                    <Text style={[styles.dateButtonText, { color: Colors.text }]}>
                      {selectedDate.toLocaleDateString(i18n.language, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      minimumDate={getMinMaxDates().minDate}
                      maximumDate={getMinMaxDates().maxDate}
                    />
                  )}
                </>
              )}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: Colors.border }]}
                onPress={() => setShowDateModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: Colors.text }]}>{t('Cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.confirmButton,
                  { backgroundColor: Colors.accent },
                ]}
                onPress={confirmDate}
              >
                <Text style={[styles.confirmButtonText, { color: Colors.card }]}>
                  {t('Confirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEvent}
        onEndReached={loadMoreEvents}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? <ActivityIndicator size="small" color={Colors.accent} /> : null
        }
      />

      {/* COMMENTS */}
      {selectedEventId !== null && (
        <CommentSection
          eventId={selectedEventId}
          visible={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* REVIEWS */}
      {selectedEventId !== null && (
        <ReviewSection
          eventId={selectedEventId}
          visible={showReviews}
          onClose={() => setShowReviews(false)}
        />
      )}

      {selectedEventForShare && (
        <ShareEventModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedEventForShare(null);
          }}
          event={{
            id: selectedEventForShare.id,
            titol: selectedEventForShare.titol || '',
            descripcio: selectedEventForShare.descripcio || '',
            imgApp: selectedEventForShare.imgApp,
            imatges: selectedEventForShare.imatges,
            data_inici: selectedEventForShare.data_inici,
            data_fi: selectedEventForShare.data_fi,
            localitat: selectedEventForShare.localitat || null,
            enllacos: {},
            infoEntrades: selectedEventForShare.infoEntrades || null,
            infoHorari: selectedEventForShare.infoHorari || null,
            gratuita: false,
            modalitat: selectedEventForShare.modalitat || null,
            direccio: selectedEventForShare.direccio || null,
            espai: selectedEventForShare.espai || null,
            georeferencia: null,
            latitud: null,
            longitud: null,
            telefon: null,
            email: null,
          }}
          Colors={Colors}
        />
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
    fontSize: 10,
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
    fontSize: 12,
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
    fontSize: 9,
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
    fontSize: 9,
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
  input: {
    backgroundColor: '#F7F0E2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#311C0C',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E4D8C8',
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmButtonText: {
    fontWeight: '700',
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  datePickerContainer: {
    marginBottom: 24,
  },
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  messageText: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
});
