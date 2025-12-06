// components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface ChatMessage {
  id: number;
  text: string;
  sender: 'me' | 'other';
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
            backgroundColor: isMe ? '#4a90e2' : theme === 'dark' ? '#1a1a1a' : '#ffffff',

            alignSelf: isMe ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <Text
          style={{
            color: isMe ? '#fff' : Colors.text,
            fontSize: 15,
          }}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
    paddingHorizontal: 15, // 👈 marge lateral
  },
  bubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
});
