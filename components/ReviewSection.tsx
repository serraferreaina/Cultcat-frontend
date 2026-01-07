import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const BASE_URL = 'http://nattech.fib.upc.edu:40490';

// POSSIBLE PROFILE ENDPOINTS - Try these in order
const PROFILE_ENDPOINTS = [
  '/users/profile/',
  '/user/profile/',
  '/api/users/profile/',
  '/api/user/profile/',
  '/profile/',
  '/users/me/',
  '/user/me/',
];

// ---------------------------
// TYPES
// ---------------------------

export interface ReviewUser {
  id: number;
  username: string;
  profilePic: string | null;
}

export interface ReviewImage {
  id: number;
  image: string;
}

export interface Review {
  id: number;
  user: ReviewUser;
  rating: number;
  review: string | null;
  votes: number;
  upvoted: boolean;
  images: ReviewImage[];
}

interface Props {
  eventId: number;
  visible: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

export default function ReviewSection({ eventId, visible, onClose, readOnly = false }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    profile_picture: string | null;
  } | null>(null);

  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  // Create new
  const [rating, setRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [newImages, setNewImages] = useState<any[]>([]);

  // Edit review
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState('');
  const [editedImages, setEditedImages] = useState<any[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);

  // ---------------------------
  // NAVEGAR AL PERFIL
  // ---------------------------

  const openProfile = async (userId: number) => {
    try {
      // Tanquem el modal de reviews i naveguem al perfil
      onClose();
      router.push(`/user/${userId}`);
    } catch (e) {
      console.error('Error navegant al perfil:', e);
      Alert.alert('Error', "No s'ha pogut obrir el perfil");
    }
  };

  // ---------------------------
  // LOAD CURRENT USER
  // ---------------------------

  useEffect(() => {
    const loadCurrentUser = async () => {
      setUserLoading(true);
      setUserError(null);

      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          setUserError('No auth token');
          console.warn('⚠️ No auth token available');
          setUserLoading(false);
          return;
        }

        // Try each endpoint until one works
        let userData = null;
        let workingEndpoint = null;

        for (const endpoint of PROFILE_ENDPOINTS) {
          try {
            const url = `${BASE_URL}${endpoint}`;

            const res = await fetch(url, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (res.ok) {
              userData = await res.json();
              workingEndpoint = endpoint;
              break;
            }
          } catch (err) {
            continue;
          }
        }

        if (!userData || !workingEndpoint) {
          setUserError('Profile endpoint not found');

          Alert.alert(
            'Error de configuració',
            `No s'ha trobat l'endpoint del perfil d'usuari. Contacta amb suport tècnic.\n\nEndpoints provats: ${PROFILE_ENDPOINTS.join(', ')}`,
            [{ text: 'OK', onPress: onClose }],
          );

          setUserLoading(false);
          return;
        }

        // Parse user data with flexible field names
        setCurrentUser({
          id: userData.id,
          username: userData.username || userData.user || userData.name,
          profile_picture:
            userData.profile_picture || userData.profilePic || userData.avatar || null,
        });

        setUserLoading(false);
      } catch (e) {
        console.error('❌ Unexpected error loading user:', e);
        setUserError('Error de connexió');

        Alert.alert('Error', "No s'ha pogut carregar el perfil. Comprova la connexió a internet.", [
          { text: 'Tancar', onPress: onClose },
          { text: 'Reintentar', onPress: () => loadCurrentUser() },
        ]);

        setUserLoading(false);
      }
    };

    if (visible) {
      loadCurrentUser();
    }
  }, [visible]);

  // ---------------------------
  // LOAD REVIEWS
  // ---------------------------

  const loadReviews = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/reviews/event/${eventId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.error(`Error fetching reviews: ${res.status}`);
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Filtro de reviews con usuario válido
      const safeData = data.filter((r: any) => r.user && typeof r.user === 'object');

      // Carregar informació completa de cada usuari
      const reviewsWithFullUserData = await Promise.all(
        safeData.map(async (review: any) => {
          try {
            // Si ja tenim l'objecte user complet, no cal fer res més
            if (review.user.id && review.user.username) {
              return review;
            }

            // Si només tenim l'ID de l'usuari, carreguem les dades completes
            const userId = typeof review.user === 'number' ? review.user : review.user.id;

            if (!userId) {
              console.warn('Review sense user ID:', review);
              return review;
            }

            const userRes = await fetch(`${BASE_URL}/users/${userId}/`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            if (userRes.ok) {
              const fullUserData = await userRes.json();
              return {
                ...review,
                user: {
                  id: fullUserData.id,
                  username: fullUserData.username || fullUserData.user || fullUserData.name,
                  profilePic:
                    fullUserData.profile_picture ||
                    fullUserData.profilePic ||
                    fullUserData.avatar ||
                    null,
                },
              };
            }

            return review;
          } catch (err) {
            console.error("Error carregant dades d'usuari:", err);
            return review;
          }
        }),
      );

      setReviews(reviewsWithFullUserData);
    } catch (e) {
      console.error('Error loading reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadReviews();
  }, [visible, eventId]);

  // ---------------------------
  // IMAGE PICKER
  // ---------------------------

  const pickImages = async (setter: any) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) setter(result.assets);
  };

  // ---------------------------
  // CREATE REVIEW
  // ---------------------------

  const publish = async () => {
    if (rating === 0) {
      Alert.alert('Atenció', 'Selecciona una puntuació');
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', "No s'ha pogut obtenir la informació de l'usuari");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const form = new FormData();
      form.append('user', String(currentUser.id));
      form.append('event', String(eventId));
      form.append('rating', String(rating));
      form.append('review', newComment.trim());

      newImages.forEach((img, i) =>
        form.append('images', {
          uri: img.uri,
          name: `img_${i}.jpg`,
          type: 'image/jpeg',
        } as any),
      );

      const res = await fetch(`${BASE_URL}/reviews/create/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const created = await res.json();

      if (created.detail === 'Ya existe una review para este usuario y evento.') {
        Alert.alert('Avís', 'Ja tens una ressenya per aquest esdeveniment.');
        return;
      }

      if (!created.id) {
        Alert.alert('Error', "No s'ha pogut crear la ressenya");
        return;
      }

      setReviews((prev) => [created, ...prev]);
      setRating(0);
      setNewComment('');
      setNewImages([]);
      Alert.alert('Èxit', 'Ressenya publicada correctament');
    } catch (e) {
      console.error('Error creating review:', e);
      Alert.alert('Error', "No s'ha pogut publicar la ressenya");
    }
  };

  // ---------------------------
  // DELETE REVIEW
  // ---------------------------

  const remove = async (id: number) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      await fetch(`${BASE_URL}/reviews/${id}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      setReviews((prev) => prev.filter((r) => r.id !== id));
      Alert.alert('Èxit', 'Ressenya eliminada');
    } catch (e) {
      console.error('Error deleting review:', e);
      Alert.alert('Error', "No s'ha pogut eliminar la ressenya");
    }
  };

  // ---------------------------
  // EDIT REVIEW
  // ---------------------------

  const startEdit = (review: Review) => {
    setEditingReview(review);
    setEditedRating(review.rating);
    setEditedComment(review.review ?? '');
    setEditedImages([]);
    setRemovedImageIds([]);
  };

  const submitEdit = async () => {
    if (!editingReview || !currentUser) return;

    try {
      const form = new FormData();

      form.append('user', String(currentUser.id));
      form.append('rating', String(editedRating));
      form.append('review', editedComment.trim());

      if (removedImageIds.length > 0) {
        removedImageIds.forEach((id) => {
          form.append('remove_image_ids', String(id));
        });
      }

      editedImages.forEach((img, i) =>
        form.append('images', {
          uri: img.uri,
          name: `edit_img_${i}.jpg`,
          type: 'image/jpeg',
        } as any),
      );

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const res = await fetch(`${BASE_URL}/reviews/${editingReview.id}/edit/`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const updated = await res.json();

      setReviews((prev) => prev.map((r) => (r.id === editingReview.id ? updated : r)));
      await loadReviews();

      setEditingReview(null);
      Alert.alert('Èxit', 'Ressenya actualitzada');
    } catch (e) {
      console.error('Error editing review:', e);
      Alert.alert('Error', "No s'ha pogut actualitzar la ressenya");
    }
  };

  const toggleUpvote = async (reviewId: number, alreadyUpvoted: boolean) => {
    try {
      const url = alreadyUpvoted
        ? `${BASE_URL}/reviews/${reviewId}/upvote/remove/`
        : `${BASE_URL}/reviews/${reviewId}/upvote/`;

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const res = await fetch(url, {
        method: alreadyUpvoted ? 'DELETE' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return;
      }

      await loadReviews();
    } catch (err) {
      console.error('Error toggleUpvote:', err);
    }
  };

  // ---------------------------
  // UI
  // ---------------------------

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.card,
            {
              backgroundColor: Colors.card,
              paddingBottom: insets.bottom + 8,
            },
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>{t('Reviews')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* USER ERROR BANNER */}
          {userError && (
            <View style={[styles.errorBanner, { backgroundColor: Colors.border }]}>
              <Ionicons name="warning-outline" size={20} color={Colors.text} />
              <Text style={[styles.errorText, { color: Colors.text }]}>
                No s'ha pogut carregar el perfil. Pots veure ressenyes però no crear-ne de noves.
              </Text>
            </View>
          )}

          {/* LIST */}
          <FlatList
            data={reviews}
            keyExtractor={(item, index) => {
              return item.id ? String(item.id) : `temp_${index}`;
            }}
            style={{ flex: 1 }}
            ListEmptyComponent={
              loading ? (
                <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                  Carregant ressenyes...
                </Text>
              ) : (
                <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                  No hi ha ressenyes encara
                </Text>
              )
            }
            renderItem={({ item }) => {
              if (!item.user || typeof item.user !== 'object') return null;

              return (
                <View style={styles.reviewRow}>
                  {/* USER PIC - CLICKABLE */}
                  <TouchableOpacity
                    style={styles.userSection}
                    onPress={() => openProfile(item.user.id)}
                  >
                    {item.user.profilePic ? (
                      <Image source={{ uri: item.user.profilePic }} style={styles.profilePic} />
                    ) : (
                      <View
                        style={[styles.profilePicPlaceholder, { backgroundColor: Colors.border }]}
                      >
                        <Ionicons name="person" size={24} color={Colors.text} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    {/* USERNAME - CLICKABLE */}
                    <TouchableOpacity onPress={() => openProfile(item.user.id)}>
                      <Text style={[styles.username, { color: Colors.accent }]}>
                        @{item.user.username}
                      </Text>
                    </TouchableOpacity>

                    {/* STARS */}
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((v) => (
                        <Ionicons
                          key={v}
                          name={v <= item.rating ? 'star' : 'star-outline'}
                          size={18}
                          color="#e58e26"
                        />
                      ))}
                    </View>

                    {/* REVIEW TEXT */}
                    {item.review && (
                      <Text style={[styles.reviewText, { color: Colors.text }]}>{item.review}</Text>
                    )}

                    {/* REVIEW IMAGES */}
                    {item.images?.length > 0 && (
                      <ScrollView
                        horizontal
                        style={styles.imagesScroll}
                        showsHorizontalScrollIndicator={false}
                      >
                        {item.images.map((img) => (
                          <Image
                            key={img.id}
                            source={{ uri: img.image }}
                            style={styles.reviewImage}
                          />
                        ))}
                      </ScrollView>
                    )}

                    {/* VOTES */}
                    <TouchableOpacity
                      style={styles.votesButton}
                      onPress={() => toggleUpvote(item.id, item.upvoted)}
                      disabled={!currentUser}
                    >
                      <Ionicons
                        name={item.upvoted ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.upvoted ? '#FF4458' : Colors.text}
                      />
                      <Text style={[styles.votesCount, { color: Colors.text }]}>{item.votes}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* EDIT + DELETE */}
                  {currentUser && item.user.id === currentUser.id && (
                    <View style={styles.actionsColumn}>
                      <TouchableOpacity onPress={() => startEdit(item)}>
                        <Ionicons name="create-outline" size={22} color={Colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => remove(item.id)}>
                        <Ionicons name="trash-outline" size={22} color="#FF4458" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />

          {/* NEW REVIEW - Only show if user is loaded AND not in read-only mode */}
          {currentUser && !userError && !readOnly && (
            <View style={[styles.composer, { borderTopColor: Colors.border }]}>
              <View style={styles.starsInputRow}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity key={v} onPress={() => setRating(v)}>
                    <Ionicons
                      name={v <= rating ? 'star' : 'star-outline'}
                      size={28}
                      color="#e58e26"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                value={newComment}
                onChangeText={setNewComment}
                placeholder={t('Write a review…')}
                placeholderTextColor={Colors.textSecondary}
                style={[styles.input, { color: Colors.text, borderColor: Colors.border }]}
                multiline
              />

              {/* SELECT IMAGES */}
              <TouchableOpacity onPress={() => pickImages(setNewImages)}>
                <Ionicons name="image-outline" size={28} color={Colors.text} />
              </TouchableOpacity>

              {newImages.length > 0 && (
                <ScrollView horizontal style={{ marginVertical: 8 }}>
                  {newImages.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img.uri }}
                      style={{
                        width: 80,
                        height: 80,
                        marginRight: 8,
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                onPress={publish}
                disabled={rating === 0}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: rating === 0 ? Colors.border : Colors.accent,
                  },
                ]}
              >
                <Text
                  style={{
                    color: Colors.card,
                    fontWeight: '700',
                    fontSize: SCREEN_WIDTH * 0.04,
                  }}
                >
                  {t('Publish')}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>

      {/* EDIT MODAL */}
      {editingReview && (
        <Modal visible transparent animationType="fade">
          <View style={styles.editBackdrop}>
            <View style={[styles.editBox, { backgroundColor: Colors.card }]}>
              <Text style={[styles.title, { color: Colors.text }]}>{t('Edit review')}</Text>

              {/* STARS */}
              <View style={styles.starsInputRow}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity key={v} onPress={() => setEditedRating(v)}>
                    <Ionicons
                      name={v <= editedRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#e58e26"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* TEXT */}
              <TextInput
                value={editedComment}
                onChangeText={setEditedComment}
                multiline
                style={[styles.input, { color: Colors.text, borderColor: Colors.border }]}
              />

              {/* OLD IMAGES WITH DELETE BUTTON */}
              {editingReview.images.length > 0 && (
                <ScrollView horizontal style={{ marginVertical: 8 }}>
                  {editingReview.images.map((img) => (
                    <View key={img.id} style={{ marginRight: 8 }}>
                      <Image
                        source={{ uri: img.image }}
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: 8,
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          setRemovedImageIds((prev) => [...prev, img.id]);
                          setEditingReview((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  images: prev.images.filter((i) => i.id !== img.id),
                                }
                              : null,
                          );
                        }}
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                        }}
                      >
                        <Ionicons name="close-circle" size={24} color="red" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* SELECT NEW IMAGES */}
              <TouchableOpacity onPress={() => pickImages(setEditedImages)}>
                <Ionicons name="image-outline" size={28} color={Colors.text} />
              </TouchableOpacity>

              {editedImages.length > 0 && (
                <ScrollView horizontal style={{ marginVertical: 8 }}>
                  {editedImages.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img.uri }}
                      style={{
                        width: 80,
                        height: 80,
                        marginRight: 8,
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </ScrollView>
              )}

              {/* ACTIONS */}
              <View style={styles.editActions}>
                <TouchableOpacity onPress={() => setEditingReview(null)}>
                  <Text style={{ color: Colors.textSecondary, fontSize: SCREEN_WIDTH * 0.04 }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={submitEdit}>
                  <Text
                    style={{
                      color: Colors.accent,
                      fontWeight: '700',
                      fontSize: SCREEN_WIDTH * 0.04,
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

// ---------------------------
// STYLES
// ---------------------------

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    height: SCREEN_HEIGHT * 0.8,
    padding: SCREEN_WIDTH * 0.04,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.048,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: SCREEN_WIDTH * 0.034,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  userSection: {
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profilePicPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontWeight: '600',
    fontSize: SCREEN_WIDTH * 0.04,
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  reviewText: {
    fontSize: SCREEN_WIDTH * 0.037,
    lineHeight: SCREEN_WIDTH * 0.053,
    marginTop: 6,
  },
  imagesScroll: {
    marginVertical: 8,
  },
  reviewImage: {
    width: 120,
    height: 120,
    marginRight: 8,
    borderRadius: 8,
  },
  votesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  votesCount: {
    marginLeft: 6,
    fontSize: SCREEN_WIDTH * 0.037,
    fontWeight: '500',
  },
  actionsColumn: {
    gap: 12,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  composer: {
    paddingTop: 10,
    borderTopWidth: 1,
  },
  starsInputRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 60,
    textAlignVertical: 'top',
    marginVertical: 10,
    fontSize: SCREEN_WIDTH * 0.038,
  },
  sendBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
  },
  editBox: {
    width: '85%',
    borderRadius: 20,
    padding: 20,
    alignSelf: 'center',
  },
  editActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
