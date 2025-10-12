// components/LanguageSelector.tsx
import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LanguageSelectorProps {
  currentLanguage: string;
  colors: {
    accent: string;
    card: string;
    text: string;
    border: string;
  };
  onLanguageChange: (lang: 'en' | 'es' | 'ca') => void;
}

const LANGUAGE_LABELS = {
  en: 'English',
  es: 'Español',
  ca: 'Català',
};

const LANGUAGES = ['en', 'es', 'ca'] as const;

export function LanguageSelector({
  currentLanguage,
  colors,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getLanguageLabel = () => {
    return LANGUAGE_LABELS[currentLanguage as keyof typeof LANGUAGE_LABELS] || 'English';
  };

  const handleLanguageSelect = (lang: 'en' | 'es' | 'ca') => {
    onLanguageChange(lang);
    setShowDropdown(false);
  };

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setShowDropdown(!showDropdown)}
        style={[styles.currentButton, { borderColor: colors.accent, backgroundColor: colors.card }]}
      >
        <Text style={[styles.currentText, { color: colors.text }]}>{getLanguageLabel()}</Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.accent}
          style={{ marginLeft: 4 }}
        />
      </Pressable>

      {showDropdown && (
        <View
          style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {LANGUAGES.filter((l) => l !== currentLanguage).map((lang) => (
            <Pressable key={lang} onPress={() => handleLanguageSelect(lang)} style={styles.option}>
              <Text style={[styles.optionText, { color: colors.text }]}>{lang.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', position: 'relative' },
  currentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
  },
  currentText: { fontSize: 16, fontWeight: '600' },
  dropdown: {
    position: 'absolute',
    top: 50,
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 8,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  option: { paddingHorizontal: 20, paddingVertical: 12 },
  optionText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
});
