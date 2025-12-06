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

export default function ChatScreen() {
  const { id, username, profilePicture } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const name = Array.isArray(username) ? username[0] : username || 'Usuari';
  const pic = Array.isArray(profilePicture) ? profilePicture[0] : profilePicture || null;

  const [messages, setMessages] = useState<any[]>([]);
  const flatListRef = useRef<FlatList<any>>(null);

  useEffect(() => {
    setMessages([
      { id: 1, text: 'Hola!', sender: 'other' },
      { id: 2, text: 'Ei, què tal?', sender: 'me' },
    ]);
  }, []);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const newMessage = {
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
      paddingHorizontal: 14,
      backgroundColor: Colors.card,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 3, // Android shadow
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
            source={pic ? { uri: pic } : require('../../assets/foto_perfil1.jpg')}
            style={styles.avatar}
          />

          <Text style={styles.title}>{name}</Text>
        </View>

        {/* MISSATGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => <ChatBubble message={item} />}
          keyExtractor={(item) => item.id}
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
