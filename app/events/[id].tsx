import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';

export default function EventDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const eventId = Array.isArray(id) ? id[0] : id;
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  // Dades simulades — en el futur vindran d’una API
  const events = {
    1: {
      title: 'Cómics. Sueños e historia.',
      description: 'Exposició sobre la història del còmic...',
      image: require('../../assets/cartell_comics.jpg'),
      link: 'https://www.youtube.com/watch?v=lKsZESVLYPE/',
    },
    2: {
      title: 'La palanca',
      description: 'Instal·lació artística que explora l’equilibri...',
      image: require('../../assets/la_palanca.jpg'),
      link: 'https://www.youtube.com/watch?v=lKsZESVLYPE/',
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

        <TouchableOpacity onPress={() => Linking.openURL(event.link)}>
          <Text style={[styles.link, { color: Colors.link }]}>{t('More information')}</Text>
        </TouchableOpacity>
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
  link: { fontSize: 16, textDecorationLine: 'underline' },
});
