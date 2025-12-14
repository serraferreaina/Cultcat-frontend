import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

import MapView from 'react-native-map-clustering';
import { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useEventStatus } from '../../context/EventStatus';
import { Share } from 'react-native';
import CommentSection from '../../components/CommentSection';
import ReviewSection from '../../components/ReviewSection';

interface EventItem {
  id: number;
  titol: string;
  localitat: string;
  latitud: number;
  longitud: number;
  imatges?: string;
  espai?: string;
  horari?: string;
  modalitat?: string;
  direccio?: string;
}

export default function MapScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  const [showComments, setShowComments] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  const mapRef = useRef(null);

  const { goingEvents, toggleGoing, savedEvents, toggleSaved } = useEventStatus();

  const BATCH_SIZE = 100;
  const [offset, setOffset] = useState(0);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentRegion, setCurrentRegion] = useState<{latitude: number, longitude: number} | null>(null);

  const openEventDetail = (id: number) => {
    setSelectedEvent(null);
    router.push(`/events/${id}`);
  };

  const fetchEventsByCenter = async (latitude: number, longitude: number, reset = false) => {
    if (loadingEvents && !reset) return;
    if (!hasMore && !reset) return;

    setLoadingEvents(true);

    const currentOffset = reset ? 0 : offset;

    try {
      const url =
        `http://nattech.fib.upc.edu:40490/events` +
        `?latitud=${latitude}` +
        `&longitud=${longitude}` +
        `&batch_size=${BATCH_SIZE}` +
        `&offset=${currentOffset}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error('Error loading events');

      const textData = await res.text();
      
      let data: EventItem[] = [];
      try {
        const jsonData = textData.trim() ? JSON.parse(textData) : [];
        data = Array.isArray(jsonData) ? jsonData : (jsonData.results || []);
      } catch (e) {
        console.error('JSON PARSE ERROR:', textData);
        data = [];
      }

      setEvents((prev) => (reset ? data : [...prev, ...data]));
      setOffset(reset ? data.length : currentOffset + data.length);
      setHasMore(data.length === BATCH_SIZE);
    } catch (err: any) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoadingEvents(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission denied'), t('Enable location to see the map.'));
        return;
      }
      const userLocation = await Location.getCurrentPositionAsync({});
      setLocation(userLocation.coords);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchEventsByCenter(location.latitude, location.longitude, true);
    }
  }, [location]);

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.text }}>{t('Loading map')}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: Colors.text }}>
          {t('Error')}: {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loadingEvents && (
        <View
          style={{
            position: 'absolute',
            top: 20,
            alignSelf: 'center',
            backgroundColor: Colors.card,
            padding: 8,
            borderRadius: 20,
            zIndex: 1000,
          }}
        >
          <ActivityIndicator color={Colors.accent} />
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        clusteringEnabled
        clusterColor={Colors.accent}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
        onRegionChangeComplete={(region) => {
          const latKm = region.latitudeDelta * 111;
          const lonKm = region.longitudeDelta * 111 * Math.cos(region.latitude * Math.PI / 180);
          const areaKm2 = latKm * lonKm;

          const regionChanged = !currentRegion || 
            Math.abs(region.latitude - currentRegion.latitude) > region.latitudeDelta * 0.3 ||
            Math.abs(region.longitude - currentRegion.longitude) > region.longitudeDelta * 0.3;

          if (regionChanged) {
            setCurrentRegion({ latitude: region.latitude, longitude: region.longitude });
            setOffset(0);
            setHasMore(true);
            fetchEventsByCenter(region.latitude, region.longitude, true);
          }
        }}
      >
        {Array.isArray(events) && events.map((event) => {
          const images = event.imatges ? event.imatges.split(',').map((i) => i.trim()) : [];
          const imageUrl =
            images.length > 0
              ? `https://agenda.cultura.gencat.cat${images[0]}`
              : 'https://via.placeholder.com/100x100/FFA500/FFFFFF?text=E';

          return (
            <Marker
              key={event.id}
              coordinate={{
                latitude: Number(event.latitud),
                longitude: Number(event.longitud),
              }}
              tracksViewChanges={false}
              onPress={(e) => {
                e.stopPropagation();
                setSelectedEvent(event);
              }}
            >
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.markerCircle,
                    { backgroundColor: Colors.background, borderColor: Colors.accent },
                  ]}
                >
                  <Image source={{ uri: imageUrl }} style={styles.markerImage} />
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {selectedEvent && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedEvent(null)}
        >
          <TouchableOpacity
            style={[styles.modalOverlay, { backgroundColor: Colors.background + '80' }]}
            activeOpacity={1}
            onPress={() => setSelectedEvent(null)}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
              style={[styles.eventCardModal, { backgroundColor: Colors.card }]}
            >
              <ScrollView>
                <View style={styles.eventRow}>
                  <TouchableOpacity onPress={() => openEventDetail(selectedEvent.id)}>
                    <Image
                      source={{
                        uri: selectedEvent.imatges
                          ? `https://agenda.cultura.gencat.cat${selectedEvent.imatges.split(',')[0].trim()}`
                          : 'https://via.placeholder.com/100x100/FFA500/FFFFFF?text=E',
                      }}
                      style={styles.eventImageSide}
                    />
                  </TouchableOpacity>

                  <View style={styles.eventInfo}>
                    <TouchableOpacity onPress={() => openEventDetail(selectedEvent.id)}>
                      <Text style={[styles.eventTitle, { color: Colors.text }]}>
                        {selectedEvent.titol || t('Event without title')}
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.labelContainer}>
                      {selectedEvent.espai && (
                        <Label text={selectedEvent.espai} color={Colors.accent} />
                      )}
                      {selectedEvent.horari && (
                        <Label text={selectedEvent.horari} color={Colors.accent} />
                      )}
                      {selectedEvent.modalitat && (
                        <Label text={selectedEvent.modalitat} color={Colors.accent} />
                      )}
                      {selectedEvent.localitat && (
                        <Label text={selectedEvent.localitat} color={Colors.accent} />
                      )}
                      {selectedEvent.direccio && (
                        <Label text={selectedEvent.direccio} color={Colors.accent} />
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                      <TouchableOpacity
                        style={[
                          styles.button,
                          {
                            backgroundColor: goingEvents[selectedEvent.id]
                              ? Colors.going
                              : Colors.accent,
                            marginRight: 10,
                          },
                        ]}
                        onPress={() => toggleGoing(selectedEvent.id)}
                      >
                        <Text style={[styles.buttonText, { color: Colors.card }]}>
                          {goingEvents[selectedEvent.id] ? t('I will attend') : t('Want to go')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.iconButton, { marginRight: 12 }]}
                        onPress={() => toggleSaved(selectedEvent.id)}
                      >
                        <Ionicons
                          name={savedEvents[selectedEvent.id] ? 'bookmark' : 'bookmark-outline'}
                          size={20}
                          color={Colors.text}
                        />
                      </TouchableOpacity>

                      {/* OPEN COMMENTS */}
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                        onPress={() => setShowComments(true)}
                      >
                        <Ionicons name="chatbubble-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>

                      {/* OPEN REVIEWS */}
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}
                        onPress={() => setShowReviews(true)}
                      >
                        <Ionicons name="star-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => {
                          const url = `https://tu-app.com/event/${selectedEvent.id}`;
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
                </View>

                <TouchableOpacity
                  style={[styles.closeButtonModal, { backgroundColor: Colors.accent }]}
                  onPress={() => setSelectedEvent(null)}
                >
                  <Text style={{ color: Colors.background, fontWeight: '700' }}>{t('Close')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* COMMENTS */}
      {selectedEvent && (
        <CommentSection
          eventId={selectedEvent.id}
          visible={showComments}
          onClose={() => setShowComments(false)}
        />
      )}

      {/* REVIEWS */}
      {selectedEvent && (
        <ReviewSection
          eventId={selectedEvent.id}
          visible={showReviews}
          onClose={() => setShowReviews(false)}
        />
      )}
    </View>
  );
}

const Label = ({ text, color }: { text: string; color: string }) => (
  <View style={[styles.label, { backgroundColor: color + '22' }]}>
    <Text style={[styles.labelText, { color }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
  },
  markerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  eventCardModal: {
    borderRadius: 12,
    padding: 12,
    maxHeight: '80%',
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  eventImageSide: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  eventInfo: {
    flex: 1,
    paddingLeft: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
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
    fontSize: 12,
  },
  iconButton: {
    padding: 6,
  },
  commentCount: {
    fontSize: 13,
  },
  closeButtonModal: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
});