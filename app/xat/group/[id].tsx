// app/xat/group/[id].tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../../theme/colors';
import ChatBubble from '../../../components/ChatBubble';
import ChatInput from '../../../components/ChatInput';
import ProfileShareBubble from '../../../components/ProfileShareBubble';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChatMessages, sendChatMessage } from '../../../api/chat';
import { getProfile } from '../../../api';
import { getConnections } from '../../../api/connections';
import { getGroupChats } from '../../../api/groupchats';

type UiMessage = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
  type?: 'text' | 'profile_share';
  profileData?: {
    userId: number;
    username: string;
    profilePicture: string;
    description?: string | null;
    userMessage?: string | null;
  };
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const flatListRef = useRef<FlatList<UiMessage>>(null);

  const [chatUsername, setChatUsername] = useState<string>('Usuari');

  const [userMap, setUserMap] = useState<
    Record<
      number,
      {
        username: string;
        profilePic: string | null;
      }
    >
  >({});

  const [groupName, setGroupName] = useState<string>('Grup');

  useEffect(() => {
    async function loadGroup() {
      try {
        const groups = await getGroupChats();
        const group = groups.find((g: any) => g.chat_id === Number(id));

        if (group) {
          setGroupName(group.name);
        }
      } catch (e) {
        console.error('Error loading group info', e);
      }
    }

    loadGroup();
  }, [id]);

  useEffect(() => {
    async function loadMessages() {
      try {
        const me = await getProfile();
        const myId = me.id;
        setMyUserId(myId);

        const map: Record<number, { username: string; profilePic: string | null }> = {
          [myId]: {
            username: me.username,
            profilePic: me.profile_picture ?? null,
          },
        };

        const connections = await getConnections();
        connections.forEach((c: any) => {
          map[c.user_id] = {
            username: c.username,
            profilePic: c.profile_picture ?? null,
          };
        });

        setUserMap(map);

        const data = await getChatMessages(Number(id));

        const formatted: UiMessage[] = data.map((m: any) => {
          const isMine = m.sender === myId;
          const user = map[m.sender];

          let messageType: 'text' | 'profile_share' = 'text';
          let profileData = undefined;

          try {
            const parsed = JSON.parse(m.content);

            if (parsed.type === 'profile_share') {
              messageType = 'profile_share';
              profileData = {
                userId: parsed.userId,
                username: parsed.username,
                profilePicture: parsed.profilePicture,
                description: parsed.description,
                userMessage: parsed.userMessage,
              };
            }
          } catch (e) {}

          return {
            id: m.id.toString(),
            text: m.content,
            sender: isMine ? 'me' : 'other',
            senderId: m.sender,
            senderName: !isMine ? user?.username : undefined,
            senderAvatar: !isMine ? user?.profilePic : undefined,
            type: messageType,
            profileData,
          };
        });

        setMessages(formatted);

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 50);
      } catch (e) {
        console.error('❌ Error loading messages', e);
      }
    }

    loadMessages();
  }, [id]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    try {
      const response = await sendChatMessage(Number(id), text);

      setMessages((prev) => [
        ...prev,
        {
          id: response.id.toString(),
          text: response.content,
          sender: 'me',
          senderId: myUserId ?? undefined,
          type: 'text',
        },
      ]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    } catch (e) {
      console.error(e);
    }
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginLeft: 10,
      backgroundColor: '#ccc',
    },
    title: {
      marginLeft: 12,
      fontSize: 18,
      fontWeight: '600',
      color: Colors.text,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -10}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={Colors.text} />
          </TouchableOpacity>

          <Image source={require('../../../assets/foto_perfil1.jpg')} style={styles.avatar} />

          <Text style={styles.title}>{groupName}</Text>

          <TouchableOpacity
            style={{ marginLeft: 'auto', marginRight: 10 }}
            onPress={() =>
              router.push({
                pathname: '/xat/group/members/[id]',
                params: { id, groupName },
              })
            }
          >
            <Ionicons name="people-outline" size={26} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => {
            if (item.type === 'profile_share' && item.profileData) {
              return <ProfileShareBubble data={item.profileData} sender={item.sender} />;
            }

            return <ChatBubble message={item} />;
          }}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 20 }}
          style={{ flex: 1, backgroundColor: Colors.background }}
        />

        <ChatInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
