// app/(auth)/login.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GoogleButton from '../../components/GoogleButton';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const effectiveScheme = theme || 'light';
  const Colors = effectiveScheme === 'dark' ? DarkColors : LightColors;

  const goNext = () => router.replace('/(tabs)');
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.brandTop}>CultCat. </Text>
      <Text style={styles.title}>{t('Inicia sessió')}</Text>

      <GoogleButton />

      <TouchableOpacity style={styles.nextButton} onPress={goNext}>
        <Ionicons name="arrow-forward-circle" size={80} color={Colors.accent} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  nextButton: { marginTop: 30 },
  brandTop: { fontSize: 50, fontWeight: '900', textAlign: 'left', marginBottom: 20 },
});
