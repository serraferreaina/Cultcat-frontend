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
  ActivityIndicator,
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

// 🔹 Configuración del API
const API_BASE_URL = 'https://tu-api.com'; // ⚠️ Cambia esto por tu URL real

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
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🔹 Obtener el token de autenticación
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      return token;
    } catch (e) {
      console.error('Error getting auth token:', e);
      return null;
    }
  };

  // 🔹 Cargar preferencias desde el backend
  useEffect(() => {
    (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          // Si no hay token, cargar desde AsyncStorage local
          const stored = await AsyncStorage.getItem('favoriteCategories');
          if (stored) {
            const parsedCategories = JSON.parse(stored);
            // Convertir keys a IDs si es necesario
            setSelectedCategories(parsedCategories);
          }
          setLoading(false);
          return;
        }

        // 🌐 Llamada GET al backend
        const response = await fetch(`${API_BASE_URL}/preferences/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSelectedCategories(data.favorite_categories || []);
        } else {
          // Si falla, intentar cargar desde AsyncStorage
          const stored = await AsyncStorage.getItem('favoriteCategories');
          if (stored) {
            setSelectedCategories(JSON.parse(stored));
          }
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Cargar desde AsyncStorage en caso de error
        const stored = await AsyncStorage.getItem('favoriteCategories');
        if (stored) {
          setSelectedCategories(JSON.parse(stored));
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((c) => c !== categoryId)
        : [...prev, categoryId],
    );
  };

  // 🔹 Guardar preferencias en el backend
  const savePreferences = async () => {
    setSaving(true);
    try {
      const token = await getAuthToken();

      // Guardar localmente primero
      await AsyncStorage.setItem('favoriteCategories', JSON.stringify(selectedCategories));

      if (token) {
        // 🌐 Llamada PUT al backend
        const response = await fetch(`${API_BASE_URL}/preferences/`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            favorite_categories: selectedCategories,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save preferences to backend');
        }
      }

      // Verificar si es la primera vez
      const hasCompletedSetup = await AsyncStorage.getItem('hasCompletedSetup');

      if (!hasCompletedSetup) {
        await AsyncStorage.setItem('hasCompletedSetup', 'true');
        Alert.alert(t('Saved'), t('Your preferences has been saved'), [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]);
      } else {
        Alert.alert(t('Saved'), t('Your preferences has been saved'), [
          {
            text: 'OK',
            onPress: () => {
              router.back();
              setTimeout(() => router.back(), 50);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', t('Your preferences has not been saved'));
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedCategories.includes(index);
    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected ? styles.categorySelected : null]}
        onPress={() => toggleCategory(index)}
      >
        <Image source={{ uri: item.image }} style={styles.categoryImage} />
        <Text style={[styles.categoryText, { color: isSelected ? CARD : TEXT }]}>
          {item.label}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark" size={20} color={CARD} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
          <Text style={styles.loadingText}>Carregant preferències...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        keyExtractor={(item, index) => index.toString()}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
      />

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={CARD} />
          ) : (
            <Text style={styles.saveButtonText}>Guardar preferències</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: TEXT,
  },
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
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: CARD,
    fontWeight: '800',
    fontSize: 16,
  },
});