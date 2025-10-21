import { View, Text, Image, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  // Dades simulades — en el futur vindran d’una API
  const events = {
    1: {
      title: 'Cómics. Sueños e historia.',
      description: 'Exposició sobre la història del còmic...',
      image: require('../assets/cartell_comics.jpg'),
    },
    2: {
      title: 'La palanca',
      description: 'Instal·lació artística que explora l’equilibri...',
      image: require('../assets/la_palanca.jpg'),
    },
  };

  const event = events[Number(id) as keyof typeof events];

  if (!event) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <Text style={{ color: Colors.text }}>Event no trobat.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors.background }]}>
      <Image source={event.image} style={styles.image} />
      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors.text }]}>{event.title}</Text>
        <Text style={[styles.description, { color: Colors.text }]}>{event.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { width: '100%', height: 250 },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 10 },
  description: { fontSize: 16, lineHeight: 22 },
});
