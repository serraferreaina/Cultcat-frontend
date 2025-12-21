import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const BG = '#F7F0E2';
const TEXT = '#311C0C';
const ACCENT = '#C86A2E';
const CARD = '#FFF';

const ALL_CATEGORIES = [
  {
    key: 'concerts',
    label: 'Conciertos',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/conciertos-en-Barcelona-2025-scaled.jpg',
  },
  {
    key: 'infantil',
    label: 'Infantil',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/experto-auxiliar-en-educacion-infantil-scaled.jpg',
  },
  {
    key: 'musica',
    label: 'Música',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/EEMM-288-3.jpg',
  },
  {
    key: 'espectacles',
    label: 'Espectacles',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/ajuntament-de-corbins-espectacles-194043-med.jpg',
  },
  {
    key: 'teatre',
    label: 'Teatre',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/17_02_239_35_49Teatre_Principal_2.jpg',
  },
  {
    key: 'activitats-virtuals',
    label: 'Activitats virtuals',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/realitat_virtual.webp',
  },
  {
    key: 'arts-visuals',
    label: 'Arts visuals',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/qHxzuPyzjLf6LL3xZJn4OZzSuj4uIk-metaQXJ0cyBWaXN1YWwgMjAyMy5qcGc%3D-.jpg',
  },
  {
    key: 'rutes-i-visites',
    label: 'Rutes i visites',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/IoxVokxS4feM3UKrgd7IFopa6qjPJCk2qgy1a1o0.png',
  },
  {
    key: 'exposicions',
    label: 'Exposicions',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/62159tutrankamon057max.jpg',
  },
  {
    key: 'divulgacio',
    label: 'Divulgació',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/social-3408791_1280.jpg',
  },
  {
    key: 'dansa',
    label: 'Dansa',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/9ca5b6_81d02fea4ddc43448bb3ad008a9f93c7.jpg',
  },
  {
    key: 'circ',
    label: 'Circ',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Circ_Raluy_-_tent.jpg',
  },
  {
    key: 'conferencies',
    label: 'Conferències',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/animer-conferences-captivantes.jpg',
  },
  {
    key: 'cursos',
    label: 'Cursos',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/cursos-online-consejos.webp',
  },
  {
    key: 'cinema',
    label: 'Cinema',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/cinema-Familyandmedia-1.webp',
  },
  {
    key: 'llibres-i-lletres',
    label: 'Llibres i lletres',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/8314929977_4d7e817d68_h.jpg',
  },
  {
    key: 'festivals-i-mostres',
    label: 'Festivals i mostres',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/0_Featured_Image.jpg',
  },
  {
    key: 'tradicional-i-popular',
    label: 'Tradicional i popular',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/culturapopular01.jpg',
  },
  {
    key: 'cicles',
    label: 'Cicles',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/2024_02_13_cicle_cinema_franc%C3%A8s_2a.jpg',
  },
  {
    key: 'zz-altres-ambits',
    label: 'Altres àmbits',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Alimara_62_1.jpg',
  },
  {
    key: 'carnavals',
    label: 'Carnavals',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Dise%C3%B1o-sin-t%C3%ADtulo-6.jpg',
  },
  {
    key: 'fires-i-mercats',
    label: 'Fires i mercats',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/nadal_a_catalunya_derutaenfamilia_003.jpg',
  },
  {
    key: 'gastronomia',
    label: 'Gastronomia',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/cocina-profesional+.webp',
  },
  {
    key: 'festes',
    label: 'Festes',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/festes-majors-als-municipis-de-catalunya.jpg',
  },
  {
    key: 'commemoracions',
    label: 'Commemoracions',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/pexels-cottonbro-3171837-scaled-1150x768.jpg',
  },
  {
    key: 'setmana-santa',
    label: 'Setmana Santa',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/semanasanta-malaga-.jpg',
  },
  {
    key: 'gegants',
    label: 'Gegants',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/gegants-de-la-paeria-de-lleida.webp',
  },
  {
    key: 'sardanes',
    label: 'Sardanes',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Sardanes.jpg',
  },
  {
    key: 'nadal',
    label: 'Nadal',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/MQ4IPCPHBBEVVDZ2SXX367ZOO4.avif',
  },
];

const screenWidth = Dimensions.get('window').width;
const numColumns = 2;
const itemMargin = 8;
const itemWidth = (screenWidth - 16 * 2 - itemMargin * (numColumns * 2 - 2)) / numColumns;

export default function PreferencesScreen() {
  // ✅ TODOS los hooks DENTRO del componente
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('favoriteCategories');
      if (stored) setSelectedCategories(JSON.parse(stored));
    })();
  }, []);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key],
    );
  };

  const savePreferences = async () => {
    try {
      await AsyncStorage.setItem('favoriteCategories', JSON.stringify(selectedCategories));
      Alert.alert(t('Saved'), t('Your preferences has been saved'), [
        {
          text: 'OK',
          onPress: () => {
            router.back();
            setTimeout(() => router.back(), 50);
          },
        },
      ]);
    } catch (e) {
      Alert.alert('Error', t('Your preferences has not been saved'));
    }
  };

  const renderCategory = ({ item }: { item: any }) => {
    const isSelected = selectedCategories.includes(item.key);
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected ? styles.categorySelected : null]}
        onPress={() => toggleCategory(item.key)}
      >
        <Image source={{ uri: item.image }} style={styles.categoryImage} />
        <Text style={[styles.categoryText, { color: isSelected ? CARD : TEXT }]}>{item.label}</Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={CARD} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Gestionar Preferències</Text>
      </View>

      <FlatList
        data={ALL_CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item.key}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
      />

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={savePreferences}>
          <Text style={styles.saveButtonText}>Guardar preferències</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700', color: TEXT },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  categoryItem: {
    backgroundColor: CARD,
    borderRadius: 12,
    width: itemWidth,
    height: itemWidth,
    margin: itemMargin,
    alignItems: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  categorySelected: {
    backgroundColor: ACCENT,
  },
  categoryImage: {
    width: '100%',
    height: '80%',
    borderRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: BG,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: CARD,
    fontWeight: '800',
    fontSize: 16,
  },
});