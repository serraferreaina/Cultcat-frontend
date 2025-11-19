import React, { useState } from 'react';
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
  id: string | number;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  likedByMe: boolean;
  author: string;
}

interface Props {
  visible: boolean;
  initialReviews: Review[];
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export default function ReviewSection({ visible, initialReviews, onClose, onSubmit }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const currentUser = 'Tu';

  // Local state
  const [reviews, setReviews] = useState<Review[]>([]);
  React.useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);
  const [rating, setRating] = useState(0);
  const [newComment, setNewComment] = useState('');

  const publish = () => {
    if (rating === 0) return;

    const r: Review = {
      id: Date.now(),
      rating,
      comment: newComment.trim(),
      date: new Date().toISOString(),
      likes: 0,
      likedByMe: false,
      author: currentUser,
    };

    onSubmit(r.rating, r.comment);

    setRating(0);
    setNewComment('');
  };

  const remove = (reviewId: string | number) => {
    onSubmit(-1, String(reviewId)); // -1 marca que és un delete
  };

  const toggleLike = (reviewId: string | number) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              likes: r.likedByMe ? r.likes - 1 : r.likes + 1,
              likedByMe: !r.likedByMe,
            }
          : r,
      ),
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: Colors.backdrop || 'rgba(0,0,0,0.4)' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.card, { backgroundColor: Colors.card }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>
              {t('Reviews') || 'Ressenyes'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Ressenyes */}
          <FlatList
            data={reviews}
            keyExtractor={(r) => String(r.id)}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={styles.reviewRow}>
                <Ionicons name="person-circle-outline" size={26} color={Colors.text} />

                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text, fontWeight: '600' }}>{item.author}</Text>

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

                  <Text style={{ color: Colors.text }}>{item.comment || t('No text')}</Text>

                  <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                    {new Date(item.date).toLocaleString()}
                  </Text>

                  {/* Likes */}
                  <TouchableOpacity style={styles.likeRow} onPress={() => toggleLike(item.id)}>
                    <Ionicons
                      name={item.likedByMe ? 'heart' : 'heart-outline'}
                      size={18}
                      color={item.likedByMe ? 'red' : Colors.text}
                    />
                    <Text style={{ marginLeft: 6, color: Colors.text }}>{item.likes}</Text>
                  </TouchableOpacity>
                </View>

                {/* Delete only own review */}
                {item.author === currentUser && (
                  <TouchableOpacity onPress={() => remove(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          {/* Formulari de nova ressenya */}
          <View style={[styles.composer, { borderTopColor: Colors.border }]}>
            {/* Estrelles */}
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

            {/* Comentari */}
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder={t('Write a review…') || 'Escriu una ressenya…'}
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, { color: Colors.text, borderColor: Colors.border }]}
              multiline
            />

            {/* Botó publicar */}
            <TouchableOpacity
              onPress={publish}
              disabled={rating === 0}
              style={[
                styles.sendBtn,
                { backgroundColor: rating === 0 ? Colors.border : Colors.accent },
              ]}
            >
              <Text style={{ color: Colors.card, fontWeight: '700' }}>{t('Publish')}</Text>
            </TouchableOpacity>
          </View>
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
  starsInputRow: { flexDirection: 'row', marginBottom: 8 },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 10,
  },

  sendBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
});
