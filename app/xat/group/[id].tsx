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
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChatMessages, sendChatMessage } from '../../../api/chat';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../../../api';
import { getConnections } from '../../../api/connections';
import { getGroupChats } from '../../../api/groupchats';

type UiMessage = {
  id: string;
  text: string;
  sender: 'me' | 'other';
  senderId?: number; // ✅ IMPORTANT (per grups / debug)
  senderName?: string; // (en individuals no cal, però no molesta)
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [myUserId, setMyUserId] = useState<number | null>(null); // ✅ AFEGIT
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
        const groups = await getGroupChats(); // endpoint que ja tens
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
        // 1️⃣ Usuari loguejat real
        const me = await getProfile();
        const myId = me.id;

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

        console.log('👥 USER MAP >>>', map);

        console.log('🧑‍💻 MY USER ID >>>', myId);

        // 2️⃣ Missatges del xat
        const data = await getChatMessages(Number(id));
        console.log('📩 RAW MESSAGES >>>', data);
        const formatted: UiMessage[] = data.map((m: any) => {
          const isMine = m.sender === myId;
          const user = map[m.sender];

          return {
            id: m.id.toString(),
            text: m.content,
            sender: isMine ? 'me' : 'other',
            senderId: m.sender,
            senderName: !isMine ? user?.username : undefined,
            senderAvatar: !isMine ? user?.profilePic : undefined,
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
          senderId: myUserId ?? undefined, // ✅ evita "variable no existeix"
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
        {/* HEADER */}
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

        {/* MISSATGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <ChatBubble message={item as any} />}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 20 }}
          style={{ flex: 1, backgroundColor: Colors.background }}
        />

        {/* INPUT */}
        <ChatInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
