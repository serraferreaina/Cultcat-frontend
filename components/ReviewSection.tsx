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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://nattech.fib.upc.edu:40490';

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
}

export default function ReviewSection({ eventId, visible, onClose }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const currentUser = global.currentUser as {
    id: number;
    username: string;
    profile_picture: string | null;
  };

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
        headers: { Authorization: `Bearer ${token}` }, // 🔹 JWT Bearer
      });

      if (!res.ok) throw new Error(`Error fetching reviews: ${res.status}`);
      const data = await res.json();

      // Filtro de reviews con usuario válido
      const safeData = data.filter((r: any) => r.user && typeof r.user === 'object');

      setReviews(safeData);
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
    if (rating === 0) return;

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
        headers: { Authorization: `Bearer ${token}` }, // 🔹 JWT Bearer
        body: form,
      });

      const created = await res.json();

      if (created.detail === 'Ya existe una review para este usuario y evento.') {
        alert('Ja tens una ressenya per aquest esdeveniment.');
        return;
      }

      if (!created.id) {
        console.log('BACKEND ERROR:', created);
        return;
      }

      setReviews((prev) => [created, ...prev]);
      setRating(0);
      setNewComment('');
      setNewImages([]);
    } catch (e) {
      console.error('Error creating review:', e);
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
        headers: { Authorization: `Bearer ${token}` }, // 🔹 JWT Bearer
      });

      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error('Error deleting review:', e);
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
    if (!editingReview) return;

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
        headers: { Authorization: `Bearer ${token}` }, // 🔹 JWT Bearer
        body: form,
      });

      const updated = await res.json();

      setReviews((prev) => prev.map((r) => (r.id === editingReview.id ? updated : r)));
      await loadReviews(); // recarrega les imatges reals del backend

      setEditingReview(null);
    } catch (e) {
      console.error('Error editing review:', e);
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
          Authorization: `Bearer ${token}`, // 🔹 JWT Bearer
        },
      });

      if (!res.ok) {
        console.log('Error fent upvote/unvote:', await res.text());
        return;
      }

      // Després de fer el toggle, tornem a carregar les ressenyes
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
          style={[styles.card, { backgroundColor: Colors.card }]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>Reviews</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* LIST */}
          <FlatList
            data={reviews}
            keyExtractor={(item, index) => {
              return item.id ? String(item.id) : `temp_${index}`;
            }}
            style={{ flex: 1 }}
            renderItem={({ item }) => {
              if (!item.user || typeof item.user !== 'object') return null;

              return (
                <View style={styles.reviewRow}>
                  {/* USER PIC */}
                  {item.user.profilePic ? (
                    <Image
                      source={{ uri: item.user.profilePic }}
                      style={{ width: 32, height: 32, borderRadius: 16 }}
                    />
                  ) : (
                    <Ionicons name="person-circle-outline" size={30} color={Colors.text} />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', color: Colors.text }}>
                      {item.user.username}
                    </Text>

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

                    {/* TEXT */}
                    <Text style={{ color: Colors.text }}>{item.review ?? 'No text'}</Text>

                    {/* IMAGES */}
                    {item.images?.length > 0 && (
                      <ScrollView
                        horizontal
                        style={{ marginVertical: 6 }}
                        showsHorizontalScrollIndicator={false}
                      >
                        {item.images.map((img) => (
                          <Image
                            key={img.id}
                            source={{ uri: img.image }}
                            style={{
                              width: 120,
                              height: 120,
                              marginRight: 8,
                              borderRadius: 8,
                            }}
                          />
                        ))}
                      </ScrollView>
                    )}

                    {/* VOTES */}
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => toggleUpvote(item.id, item.upvoted)}
                    >
                      <Ionicons
                        name={item.upvoted ? 'heart' : 'heart-outline'}
                        size={20}
                        color={item.upvoted ? 'red' : Colors.text}
                      />
                      <Text style={{ marginLeft: 4 }}>{item.votes}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* EDIT + DELETE */}
                  {item.user.id === currentUser.id && (
                    <View style={{ gap: 10 }}>
                      <TouchableOpacity onPress={() => startEdit(item)}>
                        <Ionicons name="create-outline" size={22} color={Colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => remove(item.id)}>
                        <Ionicons name="trash-outline" size={22} color={Colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />

          {/* NEW REVIEW */}
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
              placeholder="Write a review…"
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, { color: Colors.text }]}
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
                  fontSize: 16,
                }}
              >
                Publish
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* EDIT MODAL */}
      {editingReview && (
        <Modal visible transparent animationType="fade">
          <View style={styles.editBackdrop}>
            <View style={[styles.editBox, { backgroundColor: Colors.card }]}>
              <Text style={[styles.title, { color: Colors.text }]}>Edit review</Text>

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
                style={[styles.input, { color: Colors.text }]}
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
                  <Text style={{ color: Colors.textSecondary }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={submitEdit}>
                  <Text style={{ color: Colors.accent, fontWeight: '700' }}>Save</Text>
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
    height: '80%',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 10,
  },
  starsRow: {
    flexDirection: 'row',
    marginVertical: 4,
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
