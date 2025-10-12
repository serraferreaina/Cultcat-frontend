import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';

export default function MapScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 41.3874,
          longitude: 2.1686,
          latitudeDelta: 0.08,
          longitudeDelta: 0.04,
        }}
        showsCompass
        showsBuildings
        showsUserLocation={false}
      >
        <Marker
          coordinate={{ latitude: 41.3874, longitude: 2.1686 }}
          title="Barcelona"
          description="Exemple de marcador"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
