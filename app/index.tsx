// app/index.tsx
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
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

  const effectiveScheme = theme || 'light';
  const Colors = effectiveScheme === 'dark' ? DarkColors : LightColors;

  const goNext = () => router.replace('/(auth)/login');
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  const changeLanguage = (lang: 'en' | 'es' | 'ca') => i18n.changeLanguage(lang);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={styles.topBar}>
        <ThemeToggle theme={effectiveScheme} accentColor={Colors.accent} onToggle={toggleTheme} />

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

        <NextButton accentColor={Colors.accent} onPress={goNext} />
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
    paddingBottom: 25,
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
  tagline: { fontSize: 30, textAlign: 'right' },
  logo: { width: '70%', height: '70%' },
});
