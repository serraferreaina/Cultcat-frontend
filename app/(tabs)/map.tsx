import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Alert } from 'react-native';
import MapView from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';

export default function MapScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [loading, setLoading] = useState(true);

  const getRandomLocation = () => {
    const baseLat = 41.3874;
    const baseLon = 2.1686;
    const randomLat = baseLat + (Math.random() - 0.5) * 0.1;
    const randomLon = baseLon + (Math.random() - 0.5) * 0.1;
    return { latitude: randomLat, longitude: randomLon };
  };

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          const randomLoc = getRandomLocation();
          setLocation({
            latitude: randomLoc.latitude,
            longitude: randomLoc.longitude,
            accuracy: 0,
            altitude: 0,
            altitudeAccuracy: null,
            heading: 0,
            speed: 0,
          });
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation.coords);
        setLoading(false);
      } catch (error) {
        console.error(error);
        const randomLoc = getRandomLocation();
        setLocation({
          latitude: randomLoc.latitude,
          longitude: randomLoc.longitude,
          accuracy: 0,
          altitude: 0,
          altitudeAccuracy: null,
          heading: 0,
          speed: 0,
        });
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.card} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      {location && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsCompass
          showsBuildings
        ></MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
