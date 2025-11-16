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

export interface Comment {
  id: string | number;
  author: string;
  text: string;
  createdAt: string;
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

  const currentUser = t('You') || 'Tu';

  // Estat de comentaris PER EVENT
  const [commentsByEvent, setCommentsByEvent] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState('');

  // Mock inicial
  const comments = commentsByEvent[eventId] ?? [];

  const submit = () => {
    const text = newComment.trim();
    if (!text) return;

    const newItem: Comment = {
      id: `temp-${Date.now()}`,
      author: currentUser,
      text,
      createdAt: new Date().toISOString(),
    };

    setCommentsByEvent((prev) => ({
      ...prev,
      [eventId]: [newItem, ...(prev[eventId] || [])],
    }));

    setNewComment('');
  };

  const remove = (commentId: string | number) => {
    setCommentsByEvent((prev) => ({
      ...prev,
      [eventId]: (prev[eventId] || []).filter((c) => c.id !== commentId),
    }));
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
              {t('Comments') || 'Comentaris'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Comentaris */}
          <FlatList
            data={comments}
            keyExtractor={(c) => String(c.id)}
            style={{ flex: 1 }}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Ionicons name="person-circle-outline" size={26} color={Colors.text} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: Colors.text, fontWeight: '600' }}>{item.author}</Text>
                  <Text style={{ color: Colors.text }}>{item.text}</Text>
                  <Text style={{ fontSize: 10, color: Colors.textSecondary }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>

                {/* Botó esborrar només si és el teu comentari */}
                {item.author === currentUser && (
                  <TouchableOpacity onPress={() => remove(item.id)}>
                    <Ionicons name="trash-outline" size={20} color={Colors.text} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          {/* Input */}
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
});
