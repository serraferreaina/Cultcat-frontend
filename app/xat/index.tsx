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

interface ChatItem {
  id: number;
  username: string;
  lastMessage: string;
  profile: string | null;
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

  useEffect(() => {
    async function loadAllChats() {
      try {
        const [connections, users, chats] = await Promise.all([
          getConnections(),
          getUsers(),
          getGroupChats(),
        ]);

        const individual = connections.map((c: any) => {
          const user = users.find((u: any) => u.id === c.user_id);

          return {
            id: c.chat_id,
            username: c.username,
            lastMessage: '',
            profile: user?.profilePic || null,
          };
        });

        const groups = chats
          .filter((c: any) => c.name) // ← això detecta grups
          .map((c: any) => ({
            id: c.chat_id,
            username: c.name,
            lastMessage: '',
            profile: null,
          }));

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
    </SafeAreaView>
  );
}
