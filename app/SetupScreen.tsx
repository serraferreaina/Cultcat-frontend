// app/SetupScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

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
      // Cargar desde preferredLanguage (preferencias guardadas)
      const storedLang = await AsyncStorage.getItem('preferredLanguage');
      if (storedLang && ['en', 'es', 'ca'].includes(storedLang)) {
        setLanguageState(storedLang as 'en' | 'es' | 'ca');
      }
    })();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      // Intentar activar notificacions - demanar permisos
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        // Si no té permisos, demanar-los
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          Alert.alert(
            t('Permission Required') || 'Permís necessari',
            t('Please enable notifications in your device settings') || 
            'Si us plau, activa les notificacions a la configuració del teu dispositiu',
            [{ text: 'OK' }]
          );
          return;
        }

        // Permisos concedits
        setNotificationsEnabled(true);
        Alert.alert(
          '✅ ' + (t('Enabled') || 'Activat'),
          t('Notifications enabled successfully') || 'Notificacions activades correctament'
        );
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
        Alert.alert(
          t('Error') || 'Error',
          t('Could not enable notifications') || 'No s\'han pogut activar les notificacions'
        );
      }
    } else {
      // Desactivar notificacions
      setNotificationsEnabled(false);
      Alert.alert(
        '🔕 ' + (t('Disabled') || 'Desactivat'),
        t('Notifications disabled') || 'Notificacions desactivades'
      );
    }
  };

  const saveAndNext = async () => {
    // Guardar en ambas claves: preferredLanguage y appLanguage
    await AsyncStorage.setItem('preferredLanguage', language);
    await AsyncStorage.setItem('appLanguage', language); // También actualizar appLanguage
    await i18n.changeLanguage(language);
    Alert.alert(t('Saved'), t('Initial preferences saved'));
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
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: Colors.text }]}>
              {t('Notifications')}
            </Text>
            <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
              {t('Receive event reminders') || 'Rebre recordatoris d\'esdeveniments'}
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