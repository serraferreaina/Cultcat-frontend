import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';

import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

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
  data_inici?: string | null;
  data_fi?: string | null;
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
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);

  const mapRef = useRef(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const BATCH_SIZE = 200; // Reduït per carregar més ràpid
  const DEBOUNCE_MS = 300; // Reduït per resposta més ràpida
  const SEARCH_RADIUS_KM = 10; // Radi de cerca en km

  const openEventDetail = (id: number) => {
    router.push(`/events/${id}`);
  };

  // Funció per comprovar si un esdeveniment està dins de la regió visible
  const isEventInVisibleRegion = (event: EventItem, region: Region): boolean => {
    const latMin = region.latitude - region.latitudeDelta / 2;
    const latMax = region.latitude + region.latitudeDelta / 2;
    const lonMin = region.longitude - region.longitudeDelta / 2;
    const lonMax = region.longitude + region.longitudeDelta / 2;

    return (
      event.latitud >= latMin &&
      event.latitud <= latMax &&
      event.longitud >= lonMin &&
      event.longitud <= lonMax
    );
  };

  // Filtrar esdeveniments visibles
  const visibleEvents = currentRegion
    ? events.filter((event) => isEventInVisibleRegion(event, currentRegion))
    : events;

  const fetchEventsByCenter = useCallback(async (latitude: number, longitude: number) => {
    // Cancel·lar petició anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setLoadingEvents(true);

    try {
      const today = new Date();
      const fromDate = today.toISOString().split('T')[0];

      const url =
        `http://nattech.fib.upc.edu:40490/events` +
        `?latitud=${latitude}` +
        `&longitud=${longitude}` +
        `&from_date=${fromDate}` +
        `&batch_size=${BATCH_SIZE}` +
        `&order_by_date=asc`;

      const res = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const textData = await res.text();

      let data: EventItem[] = [];
      try {
        const jsonData = textData.trim() ? JSON.parse(textData) : [];
        data = Array.isArray(jsonData) ? jsonData : jsonData.results || [];
      } catch (e) {
        console.error('JSON PARSE ERROR:', textData);
        return;
      }

      // Filtrar esdeveniments vàlids
      const validEvents = data.filter(
        (event) =>
          event.latitud && event.longitud && !isNaN(event.latitud) && !isNaN(event.longitud),
      );

      // Afegir nous esdeveniments sense duplicats
      setEvents((prevEvents) => {
        const eventIds = new Set(prevEvents.map((e) => e.id));
        const newEvents = validEvents.filter((e) => !eventIds.has(e.id));
        return [...prevEvents, ...newEvents];
      });

      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Obtenir ubicació inicial
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('Permission denied'), t('Enable location to see the map.'));
          setLoading(false);
          return;
        }

        const userLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation(userLocation.coords);

        const initialRegion: Region = {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        };

        setCurrentRegion(initialRegion);
      } catch (err) {
        console.error('Error getting location:', err);
        Alert.alert(t('Error'), t('Could not get your location'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Carregar esdeveniments inicials
  useEffect(() => {
    if (location) {
      fetchEventsByCenter(location.latitude, location.longitude);
    }
  }, [location, fetchEventsByCenter]);

  // Handler per quan l'usuari mou el mapa
  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      setCurrentRegion(region);

      // Cancel·lar timeout anterior
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      // Esperar abans de fer la cerca
      debounceTimeout.current = setTimeout(() => {
        fetchEventsByCenter(region.latitude, region.longitude);
      }, DEBOUNCE_MS);
    },
    [fetchEventsByCenter],
  );

  // Netejar esdeveniments que estan molt lluny (cada 5 segons)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (currentRegion) {
        setEvents((prevEvents) => {
          // Mantenir només esdeveniments dins d'un radi ampli
          const expandedRegion: Region = {
            ...currentRegion,
            latitudeDelta: currentRegion.latitudeDelta * 3,
            longitudeDelta: currentRegion.longitudeDelta * 3,
          };

          return prevEvents.filter((event) => isEventInVisibleRegion(event, expandedRegion));
        });
      }
    }, 5000);

    return () => clearInterval(cleanupInterval);
  }, [currentRegion]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (loading || !location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
        <Text style={{ color: Colors.text, marginTop: 10 }}>{t('Loading map')}...</Text>
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
        <View style={styles.loadingIndicator}>
          <View style={[styles.loadingBadge, { backgroundColor: Colors.card }]}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={[styles.loadingText, { color: Colors.text }]}>
              {t('Loading events')}...
            </Text>
          </View>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        loadingEnabled
        loadingIndicatorColor={Colors.accent}
      >
        {visibleEvents.map((event) => {
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
              onPress={() => openEventDetail(event.id)}
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

      {/* Comptador d'esdeveniments visibles */}
      {!loadingEvents && visibleEvents.length > 0 && (
        <View style={styles.eventCounter}>
          <View style={[styles.counterBadge, { backgroundColor: Colors.card }]}>
            <Text style={[styles.counterText, { color: Colors.text }]}>
              {visibleEvents.length} {visibleEvents.length === 1 ? t('event') : t('events')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  loadingIndicator: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 1000,
  },
  loadingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  eventCounter: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    zIndex: 1000,
  },
  counterBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  counterText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
