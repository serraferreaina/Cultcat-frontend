import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';

export interface Comment {
  id: number;
  author_username: string;
  profile_picture: string | null;
  text: string;
  created_at: string;
}

interface Props {
  eventId: number;
  visible: boolean;
  onClose: () => void;
}

export default function CommentSection({ eventId, visible, onClose }: Props) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const currentUser = global.currentUser;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // EDIT
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editedText, setEditedText] = useState('');

  const BASE_URL = 'http://nattech.fib.upc.edu:40490';

  //FETCH COMENTARIS
  const loadComments = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/`, {
        headers: {
          Authorization: `Token ${global.authToken}`,
        },
      });

      if (!res.ok) throw new Error('Error fetching comments');
      const data = await res.json();
      setComments(data);
    } catch (e) {
      console.error('Error load comments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadComments();
  }, [visible]);

  //CREAR COMENTARI
  const submit = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${global.authToken}`,
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Server error: ${msg}`);
      }

      await loadComments();
      setNewComment('');
    } catch (e) {
      console.error('Error adding comment:', e);
    }
  };

  //ESBORRAR COMENTARI
  const remove = async (commentId: number) => {
    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/${commentId}/delete`, {
        method: 'DELETE',
        headers: {
          Authorization: `Token ${global.authToken}`,
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Server error: ${msg}`);
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error('Error deleting comment:', e);
    }
  };

  //EDIT COMMENT
  const submitEdit = async () => {
    if (!editingComment) return;

    try {
      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/${editingComment.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${global.authToken}`,
        },
        body: JSON.stringify({ text: editedText }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }

      setEditingComment(null);
      setEditedText('');
      await loadComments();
    } catch (e) {
      console.error('Error editing comment:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: Colors.backdrop || 'rgba(0,0,0,0.4)' }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.card, { backgroundColor: Colors.card }]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: Colors.text }]}>
              {t('Comments') || 'Comentaris'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* LOADING / LIST */}
          {loading ? (
            <ActivityIndicator size="large" color={Colors.accent} />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => String(c.id)}
              style={{ flex: 1 }}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  {/* Foto */}
                  {item.profile_picture ? (
                    <Image
                      source={{ uri: item.profile_picture }}
                      style={{ width: 30, height: 30, borderRadius: 15 }}
                    />
                  ) : (
                    <Ionicons name="person-circle-outline" size={26} color={Colors.text} />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.text, fontWeight: '600' }}>
                      {item.author_username}
                    </Text>

                    <Text style={{ color: Colors.text }}>{item.text}</Text>

                    <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>

                  {/* EDIT + DELETE (nomes dels teus comentaris) */}
                  {item.author_username === currentUser?.username && (
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingComment(item);
                          setEditedText(item.text);
                        }}
                      >
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

          {/* MODAL D’EDICIÓ */}
          {editingComment && (
            <Modal animationType="fade" transparent visible={true}>
              <View style={styles.editBackdrop}>
                <View style={[styles.editBox, { backgroundColor: Colors.card }]}>
                  <Text style={[styles.title, { color: Colors.text }]}>Edit comment</Text>

                  <TextInput
                    value={editedText}
                    onChangeText={setEditedText}
                    style={[
                      styles.editInput,
                      {
                        color: Colors.text,
                        borderColor: Colors.border,
                        backgroundColor: Colors.card,
                      },
                    ]}
                    placeholder={t('Edit comment') || 'Edita el comentari'}
                    placeholderTextColor={Colors.textSecondary}
                    multiline={true}
                    textAlignVertical="top"
                  />

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => setEditingComment(null)}>
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

          {/* INPUT PER CREAR COMENTARI */}
          <View style={[styles.composer, { borderTopColor: Colors.border }]}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder={t('Write a comment…') || 'Escriu un comentari…'}
              placeholderTextColor={Colors.textSecondary}
              style={[styles.input, { color: Colors.text, borderColor: Colors.border }]}
            />
            <TouchableOpacity
              onPress={submit}
              disabled={!newComment.trim()}
              style={[styles.sendBtn, { backgroundColor: Colors.accent }]}
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
  card: { height: '70%', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginVertical: 8 },
  composer: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  sendBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginLeft: 8 },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBox: { width: '85%', padding: 20, borderRadius: 12 },
  editInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    fontSize: 16,
  },
});
