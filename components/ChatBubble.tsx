// components/ChatBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import EventShareBubble from './EventShareBubble';
import { Image } from 'react-native';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'other';
  senderId?: number;
  senderName?: string;
  senderAvatar?: string;
}

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const isMe = message.sender === 'me';

  // Try to parse as event share
  let eventData = null;
  try {
    const parsed = JSON.parse(message.text);
    if (parsed.type === 'event_share') {
      eventData = parsed;
    }
  } catch (e) {
    // Not JSON, regular message
  }

  // If it's an event share, use EventShareBubble
  if (eventData) {
    return (
      <View style={[styles.container, { justifyContent: isMe ? 'flex-end' : 'flex-start' }]}>
        <EventShareBubble eventData={eventData} isMine={isMe} senderName={message.senderName} />
      </View>
    );
  }

  // Regular text message
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
        {!isMe && (
          <View style={styles.senderInfo}>
            {message.senderAvatar && (
              <Image source={{ uri: message.senderAvatar }} style={styles.avatar} />
            )}
            <Text style={styles.senderName}>{message.senderName}</Text>
          </View>
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
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
});
