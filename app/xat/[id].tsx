// app/xat/[id].tsx
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import ChatBubble from '../../components/ChatBubble';
import ChatInput from '../../components/ChatInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getChatMessages, sendChatMessage } from '../../api/chat';
import { getConnections } from '../../api/connections';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../../api';
import { getUsers } from '../../api/users';
import EventShareBubble from '../../components/EventShareBubble';
import ProfileShareBubble from '../../components/ProfileShareBubble';

export default function ChatScreen() {
  const { id, username, profilePicture } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const name = Array.isArray(username) ? username[0] : username || 'Usuari';
  const pic = Array.isArray(profilePicture) ? profilePicture[0] : profilePicture || null;

  const [messages, setMessages] = useState<any[]>([]);
  const flatListRef = useRef<FlatList<any>>(null);

  const [chatUsername, setChatUsername] = useState<string>('Usuari');
  const [chatAvatar, setChatAvatar] = useState<string | null>(null);

  useEffect(() => {
    async function loadHeader() {
      const me = await getProfile();
      const users = await getUsers();
      const connections = await getConnections();

      const connection = connections.find((c: any) => c.chat_id === Number(id));
      if (!connection) return;

      setChatUsername(connection.username);

      const otherUser = users.find((u: any) => u.username === connection.username);
      setChatAvatar(otherUser?.profilePic ?? null);
    }

    loadHeader();
  }, [id]);

  useEffect(() => {
    async function loadChatUser() {
      try {
        const connections = await getConnections();

        const connection = connections.find((c: any) => c.chat_id === Number(id));

        if (connection) {
          setChatUsername(connection.username);
        }
      } catch (e) {
        console.error('Error loading chat user', e);
      }
    }

    loadChatUser();
  }, [id]);

  useEffect(() => {
    async function loadMessages() {
      try {
        const me = await getProfile();
        const myUserId = me.id;

        const data = await getChatMessages(Number(id));

        const formatted = data.map((m: any) => {
          const isMine = m.sender === myUserId;

          let messageType = 'text';
          let profileData = null;

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
          id: response.id,
          text: response.content,
          sender: 'me',
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

          <Image
            source={chatAvatar ? { uri: chatAvatar } : require('../../assets/foto_perfil1.jpg')}
            style={styles.avatar}
          />

          <Text style={styles.title}>{chatUsername}</Text>
        </View>

        {/* MISSATGES */}
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

        {/* INPUT */}
        <ChatInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
