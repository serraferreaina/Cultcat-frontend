// components/ChatInput.tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface ChatInputProps {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [text, setText] = useState('');

  return (
    <View style={[styles.container, { backgroundColor: Colors.card, paddingBottom: 6 }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Escriu un missatge..."
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, { color: Colors.text }]}
      />

      <TouchableOpacity
        onPress={() => {
          if (text.trim().length === 0) return;
          onSend(text);
          setText('');
        }}
      >
        <Ionicons name="send" size={24} color={Colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginRight: 10,
  },
});
