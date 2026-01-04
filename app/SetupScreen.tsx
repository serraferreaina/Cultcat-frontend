// app/SetupScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../services/pushNotifications';

import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSelector } from '../components/LanguageSelector';
import { useNotifications } from '../context/NotificationContext';
import { savePreferencesToBackend } from '../hooks/usePreferencesSync';

export default function SetupScreen() {
  const { theme, setTheme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();

  const [language, setLanguageState] = useState<'en' | 'es' | 'ca'>('en');

  useEffect(() => {
    (async () => {
      // Cargar desde preferredLanguage (preferencias guardadas)
      const storedLang = await AsyncStorage.getItem('preferredLanguage');
      if (storedLang && ['en', 'es', 'ca'].includes(storedLang)) {
        setLanguageState(storedLang as 'en' | 'es' | 'ca');
      }
    })();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      try {
        const token = await registerForPushNotifications();

        if (token) {
          setNotificationsEnabled(true);
          Alert.alert('✅', 'Notificacions activades correctament');
        } else {
          Alert.alert('⚠️', "No s'han pogut activar les notificacions. Comprova els permisos.");
        }
      } catch (error) {
        console.error('Error:', error);
        Alert.alert('❌', 'Error activant notificacions');
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert('🔕', 'Notificacions desactivades');
    }
  };

  const saveAndNext = async () => {
    await AsyncStorage.multiSet([
      ['preferredLanguage', language],
      ['appLanguage', language],
      ['darkMode', JSON.stringify(theme === 'dark')],
      ['allowNotifications', JSON.stringify(notificationsEnabled)],
    ]);

    await i18n.changeLanguage(language);

    const success = await savePreferencesToBackend({
      language,
      dark_mode: theme === 'dark',
      allow_notifications: notificationsEnabled,
    });

    if (!success) {
      Alert.alert(t('Warning'), t('Settings saved locally but could not sync with server'));
    }

    // 🔴 SEMPRE anar a Preferences
    router.push('/preferences');
  };

  const handleLanguageChange = async (lang: 'en' | 'es' | 'ca') => {
    setLanguageState(lang);
    // Guardar en ambas claves
    await AsyncStorage.setItem('preferredLanguage', lang);
    await AsyncStorage.setItem('appLanguage', lang);
    await i18n.changeLanguage(lang);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
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
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: Colors.text }]}>{t('Notifications')}</Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              {t('Receive event reminders') || "Rebre recordatoris d'esdeveniments"}
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleNotificationToggle}
            trackColor={{ false: '#767577', true: Colors.accent }}
            thumbColor={notificationsEnabled ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: Colors.accent }]}
          onPress={saveAndNext}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('Continue')}</Text>
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
  subtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  nextButton: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
});
