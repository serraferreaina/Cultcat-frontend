import { useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSelector } from '../components/LanguageSelector';
import { NextButton } from '../components/NextButton';

export default function Welcome() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();

  const Colors = theme === 'dark' ? DarkColors : LightColors;

  useEffect(() => {
    (async () => {
      try {
        await i18n.changeLanguage('ca');
      } catch (e) {
        console.error('Error cargando idioma:', e);
      }
    })();
  }, []);

  const goNext = () => router.replace('/(auth)/login');

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const changeLanguage = async (lang: 'en' | 'es' | 'ca') => {
    await i18n.changeLanguage(lang);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.topBar}>
        <ThemeToggle theme={theme} accentColor={Colors.accent} onToggle={toggleTheme} />

        <LanguageSelector
          currentLanguage={i18n.language}
          colors={{
            accent: Colors.accent,
            card: Colors.card,
            text: Colors.text,
            border: Colors.border,
          }}
          onLanguageChange={changeLanguage}
        />

        <View style={styles.spacer} />
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

        <View style={styles.nextButtonWrapper}>
          <NextButton accentColor={Colors.accent} onPress={goNext} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 75,
  },
  spacer: { width: 44 },
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
    textAlign: 'left',
    marginTop: 6,
    paddingTop: 20,
  },
  tagline: { fontSize: 30, textAlign: 'right', fontWeight: '600' },
  logo: {
    width: '90%',
    height: '90%',
    marginBottom: 0,
  },
  nextButtonWrapper: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
});
