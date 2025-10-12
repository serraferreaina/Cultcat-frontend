// app/welcome.tsx
import { useRef, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

export default function Welcome() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [showLanguages, setShowLanguages] = useState(false);

  const effectiveScheme = theme || 'light';
  const Colors = effectiveScheme === 'dark' ? DarkColors : LightColors;

  const goNext = () => router.replace('/(auth)/login');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const getLanguageLabel = () => {
    switch (i18n.language) {
      case 'en':
        return 'English';
      case 'es':
        return 'Español';
      case 'ca':
        return 'Català';
      default:
        return 'English';
    }
  };

  const changeLanguage = (lang: 'en' | 'es' | 'ca') => {
    i18n.changeLanguage(lang);
    setShowLanguages(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.topBar}>
        <Pressable onPress={toggleTheme} style={styles.themeToggle}>
          <Ionicons
            name={effectiveScheme === 'dark' ? 'sunny' : 'moon'}
            size={28}
            color={Colors.accent}
          />
        </Pressable>

        <View style={styles.languageWrapper}>
          <Pressable
            onPress={() => setShowLanguages(!showLanguages)}
            style={[
              styles.currentLanguageButton,
              { borderColor: Colors.accent, backgroundColor: Colors.card },
            ]}
          >
            <Text style={[styles.currentLanguageText, { color: Colors.text }]}>
              {getLanguageLabel()}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.accent}
              style={{ marginLeft: 4 }}
            />
          </Pressable>

          {showLanguages && (
            <View
              style={[
                styles.languageDropdown,
                { backgroundColor: Colors.card, borderColor: Colors.border },
              ]}
            >
              {['en', 'es', 'ca']
                .filter((l) => l !== i18n.language)
                .map((lang) => (
                  <Pressable
                    key={lang}
                    onPress={() => changeLanguage(lang as 'en' | 'es' | 'ca')}
                    style={styles.languageOption}
                  >
                    <Text style={[styles.languageOptionText, { color: Colors.text }]}>
                      {lang.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
            </View>
          )}
        </View>

        <View style={styles.themeToggle} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.brandTop, { color: Colors.accent }]}>CultCat.</Text>
        <Text style={[styles.tagline, { color: Colors.text }]}>{t('welcome')}</Text>
        <Text style={[styles.tagline, { color: Colors.text }]}>{t('cultivate')}</Text>

        <Image
          source={require('../assets/cultcat-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Pressable onPress={goNext}>
          <Ionicons name="arrow-forward-circle" size={80} color={Colors.accent} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// styles remain mostly unchanged
const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
  },
  themeToggle: { padding: 8, width: 44 },
  languageWrapper: { flex: 1, alignItems: 'center', position: 'relative' },
  currentLanguageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
  },
  currentLanguageText: { fontSize: 16, fontWeight: '600' },
  languageDropdown: {
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
  languageOption: { paddingHorizontal: 20, paddingVertical: 12 },
  languageOptionText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: -50,
  },
  brandTop: { fontSize: 50, fontWeight: '900', textAlign: 'left', marginTop: 6, paddingTop: 20 },
  tagline: { fontSize: 30, textAlign: 'right' },
  logo: { width: '70%', height: '70%' },
});
