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

interface GroupMessage {
  id: number;
  text: string;
  sender: 'me' | 'other';
  senderName?: string;
}

export default function GroupChatScreen() {
  const { id, groupName, groupAvatar } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const name = Array.isArray(groupName) ? groupName[0] : groupName || 'Grup';
  const avatar = Array.isArray(groupAvatar) ? groupAvatar[0] : groupAvatar || null;

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const flatListRef = useRef<FlatList<GroupMessage>>(null);

  useEffect(() => {
    // TODO: substituir per GET /group-chats/:id/messages
    setMessages([
      { id: 1, text: 'Hola, equip! 😄', sender: 'other', senderName: 'Anna' },
      { id: 2, text: 'Tot bé, organitzem la sortida?', sender: 'me' },
      { id: 3, text: 'Jo puc dissabte!', sender: 'other', senderName: 'Pau' },
    ]);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMessage: GroupMessage = {
      id: Date.now(),
      text,
      sender: 'me',
    };

    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
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
    membersButton: {
      marginLeft: 'auto',
      paddingLeft: 10,
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -20}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color={Colors.text} />
          </TouchableOpacity>

          <Image
            source={avatar ? { uri: avatar } : require('../../../assets/foto_perfil1.jpg')}
            style={styles.avatar}
          />

          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() =>
              router.push({
                pathname: `/xat/group/members/${id}`,
                params: { groupName: name },
              })
            }
          >
            <Text style={styles.title}>{name}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.membersButton}
            onPress={() =>
              router.push({
                pathname: `/xat/group/members/${id}`,
                params: { groupName: name },
              })
            }
          >
            <Ionicons name="people-outline" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>

        {/* MISSATGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <ChatBubble message={item} />}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingVertical: 20 }}
          style={{ flex: 1 }}
        />

        {/* INPUT */}
        <ChatInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
