// app/xat/index.tsx
import React, { useEffect, useState } from 'react';
import { View, FlatList, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import ChatListItem from '../../components/ChatListItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getConnections } from '../../api/connections';
import { getUsers } from '../../api/users';
import { getGroupChats } from '../../api/groupchats';
import { createGroup } from '../../api/groupchats';
import { TextInput, Modal } from 'react-native';
import { getProfile } from '../../api';

interface ChatItem {
  id: number;
  username: string;
  lastMessage: string;
  profile: string | null;
  isGroup: boolean;
}

export default function ChatList() {
  const { t } = useTranslation();
  const router = useRouter();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [tab, setTab] = useState<'individual' | 'group'>('individual');
  const [individualChats, setIndividualChats] = useState<ChatItem[]>([]);
  const [groupChats, setGroupChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ORANGE = '#d87c3a';
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [connectionsList, setConnectionsList] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);

  useEffect(() => {
    async function loadAllChats() {
      try {
        const [connections, usersResponse, chats, profile] = await Promise.all([
          getConnections(),
          getUsers(), // altres usuaris
          getGroupChats(),
          getProfile(), // TU
        ]);

        setConnectionsList(connections); // Only use connections for group creation
        setCurrentUserId(profile.id);

        // 2️⃣ afegim avatar correcte a cada xat individual
        const chatsWithAvatar = chats.map((chat: any) => {
          // xat individual → busquem l'altre usuari
          const other = chat.participants.find((p: any) => p.id !== currentUserId);

          const fullUser = usersResponse.find((u: any) => u.id === other?.id);

          return {
            ...chat,
            avatar: fullUser?.profilePic ?? null,
          };
        });

        // 3️⃣ guardem a l’estat
        // Ordenem els xats per data de missatge més recent (descendent)
        const sortedChats = [...chatsWithAvatar].sort((a: any, b: any) => {
          const aTime = new Date(
            a.last_message_time || a.updated_at || a.created_at || 0,
          ).getTime();
          const bTime = new Date(
            b.last_message_time || b.updated_at || b.created_at || 0,
          ).getTime();
          return bTime - aTime;
        });
        setChats(sortedChats);

        const individual = connections
          .map((c: any) => {
            // busquem l'altre usuari (NO tu)
            const otherUser = usersResponse.find(
              (u: any) => u.id !== profile.id && u.id === c.user_id,
            );

            return {
              id: c.chat_id,
              username: c.username,
              lastMessage: '',
              profile: otherUser?.profilePic ?? null,
              isGroup: false,
              lastMessageTime: c.last_message_time || c.updated_at || c.created_at || 0,
            };
          })
          .sort(
            (a: any, b: any) =>
              new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
          );

        const groups = chats
          .filter((c: any) => c.participants?.length > 2)
          .map((c: any) => ({
            id: c.chat_id,
            username: c.name,
            lastMessage: '',
            profile: null, // els grups NO tenen foto d’usuari
            isGroup: true,
            lastMessageTime: c.last_message_time || c.updated_at || c.created_at || 0,
          }))
          .sort(
            (a: any, b: any) =>
              new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime(),
          );

        setIndividualChats(individual);
        setGroupChats(groups);
      } catch (e) {
        console.error('Error loading chats', e);
      } finally {
        setLoading(false);
      }
    }

    loadAllChats();
  }, []);

  const data = tab === 'individual' ? individualChats : groupChats;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.card} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* HEADER + TITOL */}
      {/* HEADER */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: Colors.card,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={26} color={Colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 22, fontWeight: '600', color: Colors.text }}>Xats</Text>
      </View>

      {/* TABS */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 4,
          gap: 8,
          backgroundColor: Colors.background,
        }}
      >
        {/* TAB INDIVIDUALS */}
        <TouchableOpacity
          onPress={() => setTab('individual')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: tab === 'individual' ? ORANGE : Colors.card,
            borderWidth: 1,
            borderColor: ORANGE,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              color: tab === 'individual' ? '#fff' : ORANGE,
              fontWeight: '700',
            }}
          >
            Individuals
          </Text>
        </TouchableOpacity>

        {/* TAB GRUPALS */}
        <TouchableOpacity
          onPress={() => setTab('group')}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 20,
            backgroundColor: tab === 'group' ? ORANGE : Colors.card,
            borderWidth: 1,
            borderColor: ORANGE,
          }}
        >
          <Text
            style={{
              textAlign: 'center',
              color: tab === 'group' ? '#fff' : ORANGE,
              fontWeight: '700',
            }}
          >
            Grupals
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'group' && (
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          style={{
            marginHorizontal: 16,
            marginTop: 10,
            marginBottom: 6,
            paddingVertical: 14,
            borderRadius: 16,
            backgroundColor: ORANGE,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Crear grup</Text>
        </TouchableOpacity>
      )}

      {/* LLISTA DE XATS */}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              if (tab === 'individual') {
                router.push({
                  pathname: `/xat/${item.id}`,
                  params: {
                    username: item.username,
                    profilePicture: item.profile,
                  },
                });
              } else {
                router.push({
                  pathname: `/xat/group/${item.id}`,
                  params: {
                    groupName: item.username,
                    groupAvatar: item.profile,
                  },
                });
              }
            }}
          >
            <ChatListItem chat={item} />
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 10 }}
      />
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: Colors.card,
              borderRadius: 20,
              padding: 20,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                marginBottom: 12,
                color: Colors.text,
              }}
            >
              Crear grup
            </Text>

            <TextInput
              placeholder="Nom del grup"
              placeholderTextColor={Colors.text + '88'}
              value={groupName}
              onChangeText={setGroupName}
              style={{
                borderWidth: 1,
                borderColor: Colors.border,
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                color: Colors.text,
              }}
            />

            {/* Llista de participants */}
            <FlatList
              data={connectionsList}
              keyExtractor={(u) => u.user_id.toString()}
              renderItem={({ item }) => {
                const selected = selectedUsers.includes(item.user_id);
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedUsers((prev) =>
                        selected
                          ? prev.filter((id) => id !== item.user_id)
                          : [...prev, item.user_id],
                      );
                    }}
                    style={{
                      paddingVertical: 10,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text style={{ color: Colors.text }}>{item.username}</Text>
                    {selected && <Ionicons name="checkmark" size={20} color={ORANGE} />}
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: 200 }}
            />

            {/* ACCIONS */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.border,
                }}
              >
                <Text style={{ textAlign: 'center', color: Colors.text }}>Cancel·lar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  try {
                    if (!currentUserId) {
                      alert('No s’ha pogut identificar l’usuari');
                      return;
                    }

                    const participantIds = [currentUserId, ...selectedUsers];

                    if (participantIds.length < 3) {
                      alert('Un grup ha de tenir com a mínim 3 participants');
                      return;
                    }

                    if (groupName.length < 1) {
                      alert('Un grup ha de tenir un nom');
                      return;
                    }

                    const chat = await createGroup(groupName, participantIds);

                    setShowCreateModal(false);
                    setGroupName('');
                    setSelectedUsers([]);

                    // refrescar llista
                    setGroupChats((prev) => [
                      ...prev,
                      {
                        id: chat.chat_id,
                        username: chat.name,
                        lastMessage: '',
                        profile: null,
                        isGroup: true,
                      },
                    ]);

                    router.push({
                      pathname: `/xat/group/${chat.chat_id}`,
                      params: {
                        groupName: chat.name,
                      },
                    });
                  } catch (e) {
                    console.error('Error creating group', e);
                  }
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: ORANGE,
                }}
              >
                <Text style={{ textAlign: 'center', color: '#fff', fontWeight: '700' }}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
