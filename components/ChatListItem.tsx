// components/ChatListItem.tsx
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface ChatItem {
  id: number;
  username: string;
  lastMessage: string;
  profile: string | null;
}
export default function ChatListItem({ chat }: { chat: ChatItem }) {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  return (
    <View style={[styles.container, { borderBottomColor: Colors.border }]}>
      <Image
        source={chat.profile ? { uri: chat.profile } : require('../assets/cultcat-logo.png')}
        style={styles.avatar}
      />

      <View style={{ flex: 1 }}>
        <Text style={[styles.username, { color: Colors.text }]}>{chat.username}</Text>
        <Text style={[styles.lastMessage, { color: Colors.textSecondary }]}>
          {chat.lastMessage}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 12,

    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    marginTop: 3,
    fontSize: 14,
  },
});
