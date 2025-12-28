// components/ShareEventModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { getConnections } from '../api/connections';
import { getUsers } from '../api/users';
import { getGroupChats } from '../api/groupchats';
import { getProfile } from '../api';
import { sendChatMessage } from '../api/chat';

interface ShareEventModalProps {
  visible: boolean;
  onClose: () => void;
  event: any;
  Colors: any;
}

interface ChatItem {
  id: number;
  username: string;
  profile: string | null;
  isGroup: boolean;
}

export function ShareEventModal({ visible, onClose, event, Colors }: ShareEventModalProps) {
  const [tab, setTab] = useState<'individual' | 'group'>('individual');
  const [individualChats, setIndividualChats] = useState<ChatItem[]>([]);
  const [groupChats, setGroupChats] = useState<ChatItem[]>([]);
  const [filteredIndividual, setFilteredIndividual] = useState<ChatItem[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<ChatItem[]>([]);
  const [selectedChats, setSelectedChats] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const ORANGE = '#d87c3a';

  useEffect(() => {
    if (visible) {
      loadChats();
      setSelectedChats(new Set());
      setSearchQuery('');
      setMessage('');
      setTab('individual');
      setLinkCopied(false);
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredIndividual(individualChats);
      setFilteredGroups(groupChats);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredIndividual(
        individualChats.filter((chat) => chat.username.toLowerCase().includes(query)),
      );
      setFilteredGroups(groupChats.filter((chat) => chat.username.toLowerCase().includes(query)));
    }
  }, [searchQuery, individualChats, groupChats]);

  const currentData = tab === 'individual' ? filteredIndividual : filteredGroups;

  const loadChats = async () => {
    setLoading(true);
    try {
      const [connections, users, chats, profile] = await Promise.all([
        getConnections(),
        getUsers(),
        getGroupChats(),
        getProfile(),
      ]);

      const individual = connections
        .map((c: any) => {
          const otherUser = users.find((u: any) => u.id !== profile.id && u.id === c.user_id);
          return {
            id: c.chat_id,
            username: c.username,
            profile: otherUser?.profilePic ?? null,
            isGroup: false,
          };
        })
        .sort((a: ChatItem, b: ChatItem) => a.username.localeCompare(b.username));

      const groups = chats
        .filter((c: any) => c.participants?.length > 2)
        .map((c: any) => ({
          id: c.chat_id,
          username: c.name,
          profile: null,
          isGroup: true,
        }))
        .sort((a: ChatItem, b: ChatItem) => a.username.localeCompare(b.username));

      setIndividualChats(individual);
      setGroupChats(groups);
      setFilteredIndividual(individual);
      setFilteredGroups(groups);
    } catch (error) {
      console.error('Error loading chats:', error);
      Alert.alert('Error', "No s'han pogut carregar els xats");
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = (chatId: number) => {
    setSelectedChats((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(chatId)) {
        newSet.delete(chatId);
      } else {
        newSet.add(chatId);
      }
      return newSet;
    });
  };

  const copyLinkToClipboard = async () => {
    try {
      // TODO: Quan tinguis el domini de la teva app, canvia això per:
      // const eventUrl = `https://tuapp.com/events/${event.id}`;
      // o un deep link com: `tuapp://events/${event.id}`

      // De moment, usem l'enllaç de l'API
      const eventUrl = `https://nattech.fib.upc.edu:40490/events/${event.id}`;

      await Clipboard.setStringAsync(eventUrl);
      setLinkCopied(true);

      // Mostrar feedback visual temporal
      setTimeout(() => {
        setLinkCopied(false);
      }, 2000);

      Alert.alert('Enllaç copiat!', "L'enllaç de l'esdeveniment s'ha copiat al porta-retalls", [
        { text: "D'acord" },
      ]);
    } catch (error) {
      console.error('Error copying link:', error);
      Alert.alert('Error', "No s'ha pogut copiar l'enllaç");
    }
  };

  const sendToChats = async () => {
    if (selectedChats.size === 0) {
      Alert.alert('Atenció', 'Selecciona almenys un xat');
      return;
    }

    setSending(true);
    try {
      let imageUri = null;

      if (event.imgApp && event.imgApp.trim() !== '') {
        imageUri = `https://agenda.cultura.gencat.cat${event.imgApp}`;
      } else if (event.imatges && event.imatges.trim() !== '') {
        const firstImage = event.imatges.split(',')[0].trim();
        imageUri = `https://agenda.cultura.gencat.cat${firstImage}`;
      }

      const eventData = {
        type: 'event_share',
        eventId: event.id,
        title: event.titol,
        image: imageUri,
        date: event.data_inici,
        dateEnd: event.data_fi || null,
        location: event.localitat,
        description: event.descripcio?.substring(0, 100),
        userMessage: message.trim() || null,
      };

      const messageContent = JSON.stringify(eventData);

      const promises = Array.from(selectedChats).map((chatId) =>
        sendChatMessage(Number(chatId), messageContent),
      );

      await Promise.all(promises);

      Alert.alert(
        'Compartit!',
        `L'esdeveniment s'ha compartit a ${selectedChats.size} ${selectedChats.size === 1 ? 'xat' : 'xats'}`,
        [{ text: "D'acord", onPress: onClose }],
      );
    } catch (error) {
      console.error('Error sending messages:', error);
      Alert.alert('Error', "No s'ha pogut compartir l'esdeveniment");
    } finally {
      setSending(false);
    }
  };

  const renderChatGrid = (chats: ChatItem[]) => {
    const rows: ChatItem[][] = [];
    for (let i = 0; i < chats.length; i += 3) {
      rows.push(chats.slice(i, i + 3));
    }

    return rows.map((row, rowIndex) => (
      <View key={rowIndex} style={styles.gridRow}>
        {row.map((chat) => {
          const isSelected = selectedChats.has(chat.id);
          return (
            <TouchableOpacity
              key={chat.id}
              onPress={() => toggleChat(chat.id)}
              style={styles.gridItem}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={
                    chat.profile ? { uri: chat.profile } : require('../assets/foto_perfil1.jpg')
                  }
                  style={styles.gridAvatar}
                />
                {isSelected && (
                  <View style={[styles.checkmarkBadge, { backgroundColor: ORANGE }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </View>
              <Text style={[styles.gridName, { color: Colors.text }]} numberOfLines={2}>
                {chat.username}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: Colors.card }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: Colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: Colors.text }]}>Compartir</Text>
            <TouchableOpacity onPress={sendToChats} disabled={selectedChats.size === 0 || sending}>
              {sending ? (
                <ActivityIndicator size="small" color={ORANGE} />
              ) : (
                <Text
                  style={[
                    styles.sendText,
                    {
                      color: selectedChats.size === 0 ? Colors.textSecondary : ORANGE,
                      fontWeight: '700',
                    },
                  ]}
                >
                  Enviar
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Copy Link Button */}
          <TouchableOpacity
            onPress={copyLinkToClipboard}
            style={[
              styles.copyLinkButton,
              {
                backgroundColor: linkCopied ? Colors.success || '#4CAF50' : Colors.background,
              },
            ]}
          >
            <View style={styles.copyLinkContent}>
              <Ionicons
                name={linkCopied ? 'checkmark-circle' : 'link'}
                size={24}
                color={linkCopied ? '#fff' : ORANGE}
              />
              <Text style={[styles.copyLinkText, { color: linkCopied ? '#fff' : Colors.text }]}>
                {linkCopied ? 'Enllaç copiat!' : "Copiar enllaç de l'esdeveniment"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Search bar */}
          <View style={[styles.searchContainer, { backgroundColor: Colors.background }]}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: Colors.text }]}
              placeholder="Cerca..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setTab('individual')}
              style={[
                styles.tabButton,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: tab === 'individual' ? ORANGE : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={tab === 'individual' ? ORANGE : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: tab === 'individual' ? ORANGE : Colors.textSecondary },
                ]}
              >
                Individuals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('group')}
              style={[
                styles.tabButton,
                {
                  borderBottomWidth: 2,
                  borderBottomColor: tab === 'group' ? ORANGE : 'transparent',
                },
              ]}
            >
              <Ionicons
                name="people-outline"
                size={20}
                color={tab === 'group' ? ORANGE : Colors.textSecondary}
              />
              <Text
                style={[styles.tabText, { color: tab === 'group' ? ORANGE : Colors.textSecondary }]}
              >
                Grups
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected count */}
          {selectedChats.size > 0 && (
            <View style={styles.selectedContainer}>
              <Text style={[styles.selectedText, { color: Colors.textSecondary }]}>
                {selectedChats.size} seleccionat{selectedChats.size !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Content */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={ORANGE} />
            </View>
          ) : (
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
              {currentData.length > 0 ? (
                <View style={styles.section}>{renderChatGrid(currentData)}</View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name={tab === 'individual' ? 'person-outline' : 'people-outline'}
                    size={48}
                    color={Colors.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
                    {searchQuery
                      ? "No s'han trobat resultats"
                      : `No hi ha ${tab === 'individual' ? 'xats individuals' : 'grups'}`}
                  </Text>
                </View>
              )}

              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* Message input */}
          {selectedChats.size > 0 && (
            <View
              style={[
                styles.messageContainer,
                {
                  borderTopColor: Colors.border,
                  backgroundColor: Colors.card,
                },
              ]}
            >
              <Text style={[styles.messageLabel, { color: Colors.text }]}>Afegir missatge</Text>
              <TextInput
                style={[
                  styles.messageInput,
                  {
                    backgroundColor: Colors.background,
                    color: Colors.text,
                  },
                ]}
                placeholder="Escriu un missatge..."
                placeholderTextColor={Colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={200}
              />
              <Text style={[styles.characterCount, { color: Colors.textSecondary }]}>
                {message.length}/200
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  sendText: {
    fontSize: 16,
  },
  copyLinkButton: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyLinkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
  },
  selectedContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  gridItem: {
    width: '31%',
    marginRight: '3.5%',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  gridAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ccc',
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  gridName: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  messageLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  messageInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
});
