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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

export interface Review {
  id: number;
  user: number;
  rating: number;
  review: string | null;
  votes: number;
  upvoted: boolean;
  images: string[];
}

interface Props {
  eventId: number;
  visible: boolean;
  onClose: () => void;
}

const BASE_URL = 'http://nattech.fib.upc.edu:40490';

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

  // Nova ressenya
  const [rating, setRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  // Edició
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedRating, setEditedRating] = useState(0);
  const [editedComment, setEditedComment] = useState('');

  //Carregar ressenyes (BACKEND REAL)
  const loadReviews = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/reviews/event/${eventId}/`, {
        headers: {
          Authorization: `Token ${global.authToken}`,
        },
      });

      if (!res.ok) throw new Error('Error fetching reviews');

      const data = await res.json();
      console.log('RAW REVIEWS:', data);

      setReviews(data); // ja tenen el format adequat
    } catch (e) {
      console.error('Error loading reviews:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadReviews();
    }
  }, [visible, eventId]);

  //Crear ressenya
  const publish = async () => {
    try {
      const text = newComment.trim() || '';

      if (rating === 0) return;

      const form = new FormData();
      form.append('event', String(eventId));
      form.append('rating', String(rating));
      form.append('review', text);
      form.append('user', String(currentUser.id)); // Obligatori

      const res = await fetch(`${BASE_URL}/reviews/create/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${global.authToken}`,
        },
        body: form,
      });

      const created = await res.json();

      const newReview: Review = {
        id: created.id,
        user: created.user,
        rating: created.rating,
        review: created.review,
        votes: created.votes,
        upvoted: created.upvoted,
        images: created.images ?? [],
      };

      setReviews((prev) => [newReview, ...prev]);
      setRating(0);
      setNewComment('');
    } catch (e) {
      console.error('Error creating review:', e);
    }
  };

  //Eliminar ressenya
  const remove = async (reviewId: number) => {
    try {
      await fetch(`${BASE_URL}/reviews/${reviewId}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${global.authToken}`,
        },
      });

      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) {
      console.error('Error deleting review:', e);
    }
  };

  //Obrir modal
  const startEdit = (review: Review) => {
    setEditingReview(review);
    setEditedRating(review.rating);
    setEditedComment(review.review ?? '');
  };

  //Guardar edició
  const submitEdit = async () => {
    if (!editingReview) return;

    const text = editedComment.trim() || '';

    if (editedRating === 0) return;

    try {
      const form = new FormData();
      form.append('rating', String(editedRating));
      form.append('review', text);
      form.append('user', String(currentUser.id));

      const res = await fetch(`${BASE_URL}/reviews/${editingReview.id}/edit/`, {
        method: 'PUT',
        headers: {
          Authorization: `Token ${global.authToken}`,
        },
        body: form,
      });

      const updated = await res.json();

      setReviews((prev) =>
        prev.map((r) =>
          r.id === editingReview.id ? { ...r, rating: updated.rating, review: updated.review } : r,
        ),
      );

      setEditingReview(null);
      setEditedComment('');
      setEditedRating(0);
    } catch (e) {
      console.error('Error editing review:', e);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.card, { backgroundColor: Colors.card }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>Reviews</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* List */}
          {loading ? (
            <Text style={{ color: Colors.text }}>Loading…</Text>
          ) : (
            <FlatList
              data={reviews}
              keyExtractor={(r) => String(r.id)}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.reviewRow}>
                  {/* Foto (no hi ha foto al backend) */}
                  <Ionicons name="person-circle-outline" size={26} color={Colors.text} />

                  <View style={{ flex: 1 }}>
                    {/* Autor */}
                    <Text style={{ color: Colors.text, fontWeight: '600' }}>User #{item.user}</Text>

                    {/* Estrelles */}
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

                    {/* Comentari */}
                    <Text style={{ color: Colors.text }}>{item.review ?? 'No text'}</Text>

                    {/* Likes */}
                    <TouchableOpacity style={styles.likeRow}>
                      <Ionicons
                        name={item.upvoted ? 'heart' : 'heart-outline'}
                        size={18}
                        color={item.upvoted ? 'red' : Colors.text}
                      />
                      <Text style={{ marginLeft: 6, color: Colors.text }}>{item.votes}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botons editar/esborrar (només si és teu) */}
                  {item.user === currentUser.id && (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={() => startEdit(item)}>
                        <Ionicons name="create-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => remove(item.id)}>
                        <Ionicons name="trash-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            />
          )}

          {/* FORMULARI NOVA RESSENYA */}
          <View style={[styles.composer, { borderTopColor: Colors.border }]}>
            <View style={styles.starsInputRow}>
              {[1, 2, 3, 4, 5].map((v) => (
                <TouchableOpacity key={v} onPress={() => setRating(v)}>
                  <Ionicons
                    name={v <= rating ? 'star' : 'star-outline'}
                    size={26}
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

            <TouchableOpacity
              onPress={publish}
              disabled={rating === 0}
              style={[
                styles.sendBtn,
                { backgroundColor: rating === 0 ? Colors.border : Colors.accent },
              ]}
            >
              <Text style={{ color: Colors.card, fontWeight: '700' }}>Publish</Text>
            </TouchableOpacity>
          </View>

          {/* MODAL D'EDICIÓ */}
          {editingReview && (
            <Modal transparent animationType="fade" visible={true}>
              <View style={styles.editBackdrop}>
                <View style={styles.editBox}>
                  <Text style={[styles.title, { color: Colors.text }]}>Edit review</Text>

                  <View style={styles.starsInputRow}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <TouchableOpacity key={v} onPress={() => setEditedRating(v)}>
                        <Ionicons
                          name={v <= editedRating ? 'star' : 'star-outline'}
                          size={26}
                          color="#e58e26"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    value={editedComment}
                    onChangeText={setEditedComment}
                    multiline
                    style={styles.editInput}
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
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
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  card: { height: '80%', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700' },

  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 10 },
  starsRow: { flexDirection: 'row', marginVertical: 2 },
  likeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },

  composer: { paddingTop: 10, borderTopWidth: 1 },
  starsInputRow: { flexDirection: 'row', marginBottom: 8, columnGap: 4 },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  sendBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },

  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBox: {
    width: '85%',
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: 60,
    textAlignVertical: 'top',
    marginVertical: 12,
  },
});
