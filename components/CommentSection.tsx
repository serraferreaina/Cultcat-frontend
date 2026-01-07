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
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const insets = useSafeAreaInsets();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const currentUser = global.currentUser;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editedText, setEditedText] = useState('');

  const BASE_URL = 'http://nattech.fib.upc.edu:40490';

  // NAVEGAR AL PERFIL D'UN USUARI
  const openProfile = async (username: string) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        Alert.alert('Error', 'No estàs autenticat');
        return;
      }

      // Primer busquem l'usuari per obtenir el seu ID
      const searchRes = await fetch(`${BASE_URL}/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!searchRes.ok) {
        throw new Error("No s'ha pogut buscar l'usuari");
      }

      const users = await searchRes.json();
      const user = users.find((u: any) => u.username === username);

      if (!user) {
        Alert.alert('Error', 'Usuari no trobat');
        return;
      }

      // Tanquem el modal de comentaris i naveguem al perfil
      onClose();
      router.push(`/user/${user.id}`);
    } catch (e) {
      console.error('Error navegant al perfil:', e);
      Alert.alert('Error', "No s'ha pogut carregar el perfil");
    }
  };

  // FETCH COMENTARIS
  const loadComments = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        setLoading(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`Error fetching comments: ${res.status}`);
      const data = await res.json();
      setComments(data);
    } catch (e) {
      console.error('Error loading comments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) loadComments();
  }, [visible]);

  // CREAR COMENTARI
  const submit = async () => {
    if (!newComment.trim()) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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

  // ESBORRAR COMENTARI
  const remove = async (commentId: number) => {
    Alert.alert(t('Delete comment'), t('Are you sure you want to delete this comment?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              console.warn('No auth token available');
              return;
            }

            const res = await fetch(`${BASE_URL}/events/${eventId}/comments/${commentId}/delete`, {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!res.ok) {
              const msg = await res.text();
              throw new Error(`Server error: ${msg}`);
            }

            setComments((prev) => prev.filter((c) => c.id !== commentId));
          } catch (e) {
            console.error('Error deleting comment:', e);
            Alert.alert('Error', "No s'ha pogut esborrar el comentari");
          }
        },
      },
    ]);
  };

  // EDITAR COMENTARI
  const submitEdit = async () => {
    if (!editingComment) return;

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.warn('No auth token available');
        return;
      }

      const res = await fetch(`${BASE_URL}/events/${eventId}/comments/${editingComment.id}/edit`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
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
      Alert.alert('Error', "No s'ha pogut editar el comentari");
    }
  };

  // REPORTAR COMENTARI
  const reportComment = async (commentId: number) => {
    Alert.alert(t('Report comment'), t('Are you sure you want to report this comment?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Report'),
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) {
              Alert.alert('Error', 'No authentication token found.');
              return;
            }

            const res = await fetch(`${BASE_URL}/events/${eventId}/comments/${commentId}/report`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            const text = await res.text();
            let data: any = null;
            try {
              data = JSON.parse(text);
            } catch {
              // no passa res
            }

            if (!res.ok) {
              const detail = data?.detail ?? 'No es pot reportar aquest comentari.';

              if (detail.includes('already reported')) {
                Alert.alert(
                  'Comentari ja reportat',
                  'Ja has reportat aquest comentari anteriorment.',
                );
                return;
              }

              if (detail.includes('your own comment')) {
                Alert.alert('Acció no permesa', 'No pots reportar els teus propis comentaris.');
                return;
              }

              Alert.alert("No s'ha pogut reportar", detail);
              return;
            }

            Alert.alert(
              'Comentari reportat',
              'Gràcies. El comentari ha estat reportat correctament.',
            );
          } catch (e) {
            console.error('Unexpected error reporting comment:', e);
            Alert.alert('Error', 'Hi ha hagut un problema inesperat. Torna-ho a provar més tard.');
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: Colors.backdrop || 'rgba(0,0,0,0.4)' }]}>
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
            <Text style={[styles.title, { color: Colors.text }]}>
              {t('Comments') || 'Comentaris'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* LOADING / LIST */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
            </View>
          ) : comments.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color={Colors.textSecondary} />
              <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                {t('No comments yet. Be the first!')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(c) => String(c.id)}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 10 }}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  {/* Foto */}
                  <TouchableOpacity onPress={() => openProfile(item.author_username)}>
                    {item.profile_picture ? (
                      <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
                    ) : (
                      <Ionicons name="person-circle-outline" size={32} color={Colors.text} />
                    )}
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <TouchableOpacity onPress={() => openProfile(item.author_username)}>
                      <Text style={[styles.username, { color: Colors.accent }]}>
                        @{item.author_username}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.commentText, { color: Colors.text }]}>{item.text}</Text>

                    <Text style={[styles.timestamp, { color: Colors.textSecondary }]}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </View>

                  {/* ACCIONS */}
                  <View style={styles.actionsContainer}>
                    {item.author_username === currentUser?.username ? (
                      <>
                        <TouchableOpacity
                          onPress={() => {
                            setEditingComment(item);
                            setEditedText(item.text);
                          }}
                          style={styles.actionButton}
                        >
                          <Ionicons name="create-outline" size={20} color={Colors.accent} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => remove(item.id)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => reportComment(item.id)}
                        style={styles.actionButton}
                      >
                        <Ionicons name="flag-outline" size={20} color={Colors.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            />
          )}

          {/* MODAL D'EDICIÓ */}
          {editingComment && (
            <Modal animationType="fade" transparent visible={true}>
              <View style={styles.editBackdrop}>
                <View style={[styles.editBox, { backgroundColor: Colors.card }]}>
                  <Text style={[styles.editTitle, { color: Colors.text }]}>
                    {t('Edit comment')}
                  </Text>

                  <TextInput
                    value={editedText}
                    onChangeText={setEditedText}
                    style={[
                      styles.editInput,
                      {
                        color: Colors.text,
                        borderColor: Colors.border,
                        backgroundColor: Colors.background,
                      },
                    ]}
                    placeholder={t('Edit comment') || 'Edita el comentari'}
                    placeholderTextColor={Colors.textSecondary}
                    multiline={true}
                    textAlignVertical="top"
                  />

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingComment(null);
                        setEditedText('');
                      }}
                      style={styles.editCancelButton}
                    >
                      <Text style={[styles.editCancelText, { color: Colors.textSecondary }]}>
                        {t('Cancel')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={submitEdit}
                      style={[styles.editSaveButton, { backgroundColor: Colors.accent }]}
                    >
                      <Text style={styles.editSaveText}>{t('Save')}</Text>
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
              style={[
                styles.input,
                {
                  color: Colors.text,
                  borderColor: Colors.border,
                  backgroundColor: Colors.background,
                },
              ]}
              multiline
            />
            <TouchableOpacity
              onPress={submit}
              disabled={!newComment.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: newComment.trim() ? Colors.accent : Colors.border,
                },
              ]}
            >
              <Ionicons name="send" size={18} color={Colors.card} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  card: {
    height: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SCREEN_WIDTH * 0.04,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: SCREEN_WIDTH * 0.04,
    marginTop: 16,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  username: {
    fontWeight: '600',
    fontSize: SCREEN_WIDTH * 0.04,
    marginBottom: 4,
  },
  commentText: {
    fontSize: SCREEN_WIDTH * 0.038,
    lineHeight: SCREEN_WIDTH * 0.053,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: SCREEN_WIDTH * 0.028,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
    paddingBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: SCREEN_WIDTH * 0.038,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editBox: {
    width: '90%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  editTitle: {
    fontSize: SCREEN_WIDTH * 0.048,
    fontWeight: '700',
    marginBottom: 16,
  },
  editInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 100,
    fontSize: SCREEN_WIDTH * 0.04,
    marginBottom: 20,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  editCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editCancelText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
  },
  editSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  editSaveText: {
    color: '#FFFFFF',
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
  },
});
