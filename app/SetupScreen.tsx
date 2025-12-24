// app/SetupScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSelector } from '../components/LanguageSelector';
import { useNotifications } from '../context/NotificationContext';

export default function SetupScreen() {
  const { theme, setTheme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();

  const [language, setLanguageState] = useState<'en' | 'es' | 'ca'>('en');

  useEffect(() => {
    (async () => {
      const storedLang = await AsyncStorage.getItem('appLanguage');
      if (storedLang && ['en', 'es', 'ca'].includes(storedLang)) {
        setLanguageState(storedLang as 'en' | 'es' | 'ca');
      }
    })();
  }, []);

  const saveAndNext = async () => {
    await AsyncStorage.setItem('appLanguage', language);
    await i18n.changeLanguage(language);
    Alert.alert(t('Saved'), t('Initial preferences saved'));
    router.push('/preferences');
  };

  const handleLanguageChange = async (lang: 'en' | 'es' | 'ca') => {
    setLanguageState(lang);
    await AsyncStorage.setItem('appLanguage', lang);
    await i18n.changeLanguage(lang);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={{ marginBottom: 32 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: Colors.text, textAlign: 'center' }]}>
          {t('Initial Settings')}
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: Colors.text }]}>{t('Language')}</Text>
          <LanguageSelector
            currentLanguage={language}
            colors={{
              accent: Colors.accent,
              card: Colors.card,
              text: Colors.text,
              border: Colors.border,
            }}
            onLanguageChange={handleLanguageChange}
          />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: Colors.text }]}>{t('Theme')}</Text>
          <ThemeToggle theme={theme} accentColor={Colors.accent} onToggle={handleThemeToggle} />
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, { color: Colors.text }]}>{t('Notifications')}</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#767577', true: Colors.accent }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: Colors.accent }]}
          onPress={saveAndNext}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('Next')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 16, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 32, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  label: { fontSize: 16, fontWeight: '600' },
  nextButton: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
