// app/welcome.tsx
import { useEffect, useRef } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

//===============================
// For translations
import { useTranslation } from 'react-i18next';
import '../i18n'; // make sure i18n.ts is imported once
//===============================

export default function Welcome() {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const goNext = () => {
    // Canvia això si vols passar primer pel login:
    // router.replace("/(auth)/login");
    router.replace('/(tabs)');
  };

  const changeLanguage = (lang: 'en' | 'es' | 'ca') => {
    i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Selector at top */}
      <View style={styles.languageContainer}>
        <Pressable
          onPress={() => changeLanguage('en')}
          style={[styles.languageButton, i18n.language === 'en' && styles.activeLanguage]}
        >
          <Text style={[styles.languageText, i18n.language === 'en' && styles.activeText]}>EN</Text>
        </Pressable>

        <Pressable
          onPress={() => changeLanguage('es')}
          style={[styles.languageButton, i18n.language === 'es' && styles.activeLanguage]}
        >
          <Text style={[styles.languageText, i18n.language === 'es' && styles.activeText]}>ES</Text>
        </Pressable>

        <Pressable
          onPress={() => changeLanguage('ca')}
          style={[styles.languageButton, i18n.language === 'ca' && styles.activeLanguage]}
        >
          <Text style={[styles.languageText, i18n.language === 'ca' && styles.activeText]}>CA</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.brandTop}>CultCat. </Text>
        <Text style={styles.tagline}>{t('welcome')}</Text>
        <Text style={styles.tagline}>{t('cultivate')}</Text>

        <Image
          source={require('../assets/cultcat-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Pressable onPress={goNext}>
          <Ionicons name="arrow-forward-circle" size={80} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const BG = '#F7F0E2'; // beige suau del mockup
const TEXT = '#311C0C'; // marró fosc suau
const ACCENT = '#C86A2E'; // taronja marca

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  languageContainer: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    paddingTop: 15,
    paddingBottom: 25,
  },
  languageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 106, 46, 0.1)',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 50,
    alignItems: 'center',
  },
  activeLanguage: {
    borderColor: ACCENT,
    backgroundColor: ACCENT,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginTop: -50,
  },
  brandTop: {
    fontSize: 50,
    fontWeight: '900',
    color: ACCENT,
    textAlign: 'left',
    marginTop: 6,
    paddingTop: 20,
  },
  tagline: { fontSize: 30, color: TEXT, textAlign: 'right' },
  logoWrap: { width: '90%', aspectRatio: 1, alignSelf: 'center', justifyContent: 'center' },
  logo: { width: '70%', height: '70%' },
  color: { color: ACCENT },
});
