// components/SearchBar.tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

export default function SearchBar() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  return (
    <View style={[styles.container, { backgroundColor: Colors.card, shadowColor: Colors.shadow }]}>
      <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.icon} />
      <TextInput
        placeholder="Buscar"
        placeholderTextColor={Colors.textSecondary}
        style={[styles.input, { color: Colors.text }]}
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
    marginHorizontal: 16,
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
