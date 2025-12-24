// components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface ChatMessage {
  id: string; // ✅ al teu codi els ids són string
  text: string;
  sender: 'me' | 'other';
  senderId?: number; // ✅ nou
  senderName?: string; // ✅ opcional (per grups)
}

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const isMe = message.sender === 'me';

  return (
    <View style={[styles.container, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMe ? '#4A90E2' : theme === 'dark' ? '#1a1a1a' : '#ffffff',
            alignSelf: isMe ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        {/* Nom de l'usuari en xats grupals (només si NO soc jo) */}
        {!isMe && message.senderName && (
          <Text
            style={{
              fontSize: 12,
              marginBottom: 2,
              color: Colors.textSecondary,
              fontWeight: '600',
            }}
          >
            {message.senderName}
          </Text>
        )}

        <Text style={{ color: isMe ? '#fff' : Colors.text }}>{message.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
    paddingHorizontal: 15,
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
  },
});
