import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

type SearchBarProps = {
  onSearch?: (text: string) => void | Promise<void>;
  value?: string;
  onChangeText?: (text: string) => void;
};

export default function SearchBar({ onSearch, value, onChangeText }: SearchBarProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const [text, setText] = useState('');

  const inputValue = value !== undefined ? value : text;
  const handleChangeText = onChangeText ?? setText;

  return (
    <View style={[styles.container, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}>
      <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.icon} />

      <TextInput
        placeholder={t('search') || 'Buscar'}
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, { color: Colors.text }]}
        value={inputValue}
        onChangeText={handleChangeText}
        onSubmitEditing={() => {
          if (inputValue.trim() && onSearch) {
            onSearch(inputValue.trim());
          }
        }}
        returnKeyType="search"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginHorizontal: 5,
    marginTop: 10,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
});
