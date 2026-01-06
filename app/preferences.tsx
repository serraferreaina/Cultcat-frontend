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
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
// 🔹 Configuración del API
const API_BASE_URL = 'http://nattech.fib.upc.edu:40490';

const ALL_CATEGORIES = [
  {
    id: 4,
    key: 'concerts',
    label: 'Conciertos',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/conciertos-en-Barcelona-2025-scaled.jpg',
  },
  {
    id: 5,
    key: 'infantil',
    label: 'Infantil',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/experto-auxiliar-en-educacion-infantil-scaled.jpg',
  },
  {
    id: 6,
    key: 'musica',
    label: 'Música',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/EEMM-288-3.jpg',
  },
  {
    id: 8,
    key: 'espectacles',
    label: 'Espectacles',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/ajuntament-de-corbins-espectacles-194043-med.jpg',
  },
  {
    id: 15,
    key: 'teatre',
    label: 'Teatre',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/17_02_239_35_49Teatre_Principal_2.jpg',
  },
  {
    id: 24,
    key: 'activitats-virtuals',
    label: 'Activitats virtuals',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/realitat_virtual.webp',
  },
  {
    id: 13,
    key: 'arts-visuals',
    label: 'Arts visuals',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/qHxzuPyzjLf6LL3xZJn4OZzSuj4uIk-metaQXJ0cyBWaXN1YWwgMjAyMy5qcGc%3D-.jpg',
  },
  {
    id: 7,
    key: 'rutes-i-visites',
    label: 'Rutes i visites',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/IoxVokxS4feM3UKrgd7IFopa6qjPJCk2qgy1a1o0.png',
  },
  {
    id: 12,
    key: 'exposicions',
    label: 'Exposicions',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/62159tutrankamon057max.jpg',
  },
  {
    id: 1,
    key: 'divulgacio',
    label: 'Divulgació',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/social-3408791_1280.jpg',
  },
  {
    id: 22,
    key: 'dansa',
    label: 'Dansa',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/9ca5b6_81d02fea4ddc43448bb3ad008a9f93c7.jpg',
  },
  {
    id: 31,
    key: 'circ',
    label: 'Circ',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Circ_Raluy_-_tent.jpg',
  },
  {
    id: 3,
    key: 'conferencies',
    label: 'Conferències',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/animer-conferences-captivantes.jpg',
  },
  {
    id: 20,
    key: 'cursos',
    label: 'Cursos',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/cursos-online-consejos.webp',
  },
  {
    id: 14,
    key: 'cinema',
    label: 'Cinema',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/cinema-Familyandmedia-1.webp',
  },
  {
    id: 2,
    key: 'llibres-i-lletres',
    label: 'Llibres i lletres',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/8314929977_4d7e817d68_h.jpg',
  },
  {
    id: 19,
    key: 'festivals-i-mostres',
    label: 'Festivals i mostres',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/0_Featured_Image.jpg',
  },
  {
    id: 10,
    key: 'tradicional-i-popular',
    label: 'Tradicional i popular',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/culturapopular01.jpg',
  },
  {
    id: 27,
    key: 'cicles',
    label: 'Cicles',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/2024_02_13_cicle_cinema_franc%C3%A8s_2a.jpg',
  },
  {
    id: 23,
    key: 'zz-altres-ambits',
    label: 'Altres àmbits',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Alimara_62_1.jpg',
  },
  {
    id: 28,
    key: 'carnavals',
    label: 'Carnavals',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Dise%C3%B1o-sin-t%C3%ADtulo-6.jpg',
  },
  {
    id: 11,
    key: 'fires-i-mercats',
    label: 'Fires i mercats',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/nadal_a_catalunya_derutaenfamilia_003.jpg',
  },
  {
    id: 18,
    key: 'gastronomia',
    label: 'Gastronomia',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/cocina-profesional+.webp',
  },
  {
    id: 9,
    key: 'festes',
    label: 'Festes',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/festes-majors-als-municipis-de-catalunya.jpg',
  },
  {
    id: 16,
    key: 'commemoracions',
    label: 'Commemoracions',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/pexels-cottonbro-3171837-scaled-1150x768.jpg',
  },
  {
    id: 29,
    key: 'setmana-santa',
    label: 'Setmana Santa',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/semanasanta-malaga-.jpg',
  },
  {
    id: 25,
    key: 'gegants',
    label: 'Gegants',
    image:
      'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/gegants-de-la-paeria-de-lleida.webp',
  },
  {
    id: 26,
    key: 'sardanes',
    label: 'Sardanes',
    image: 'https://cultcat-media.s3.us-east-1.amazonaws.com/categories/Sardanes.jpg',
  },
  {
    id: 21,
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
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

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
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId],
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
          const errText = await response.text();
          console.error('Backend error:', errText);
          throw new Error('Failed to save preferences to backend');
        }
      }

      await AsyncStorage.setItem('hasCompletedSetup', 'true');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', t('Your preferences has not been saved'));
    } finally {
      setSaving(false);
    }
  };

  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const isSelected = selectedCategories.includes(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          { backgroundColor: Colors.card },
          isSelected && { backgroundColor: Colors.accent },
        ]}
        onPress={() => toggleCategory(item.id)}
      >
        <Image source={{ uri: item.image }} style={styles.categoryImage} />
        <Text style={[styles.categoryText, { color: isSelected ? Colors.card : Colors.text }]}>
          {t(`categories.${item.key}`)}
        </Text>

        {isSelected && (
          <Ionicons name="checkmark" size={20} color={Colors.card} style={styles.checkIcon} />
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={[styles.loadingText, { color: Colors.text }]}>
            Carregant preferències...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>{t('Gestionar Preferències')}</Text>
      </View>

      <FlatList
        data={ALL_CATEGORIES}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id.toString()}
        numColumns={numColumns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 16 }}
      />

      <View
        style={[
          styles.bottomContainer,
          {
            backgroundColor: Colors.background,
            borderColor: Colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: Colors.accent },
            saving && styles.saveButtonDisabled,
          ]}
          onPress={savePreferences}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.card} />
          ) : (
            <Text style={[styles.saveButtonText, { color: Colors.card }]}>
              {t('Guardar preferències')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '700' },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  categoryItem: {
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
    borderTopWidth: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontWeight: '800',
    fontSize: 16,
  },
});
