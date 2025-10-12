import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function MapScreen() {
  return (
    <MapView
      style={styles.map}
      //BCN
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
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
