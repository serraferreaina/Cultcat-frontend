// app/(auth)/login.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import GoogleButton from '../../components/GoogleButton';

export default function LoginScreen() {
  const router = useRouter();
  const goNext = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.brandTop}>CultCat. </Text>
      <Text style={styles.title}>Inicia sessió</Text>
      <GoogleButton />

      {/* Botó temporal per saltar al main app */}
      <TouchableOpacity style={styles.nextButton} onPress={() => router.replace('/(tabs)')}>
        <Pressable onPress={goNext}>
          <Ionicons name="arrow-forward-circle" size={80} />
        </Pressable>
      </TouchableOpacity>
    </View>
  );
}

const BG = '#F7F0E2'; // beige suau del mockup
const TEXT = '#311C0C'; // marró fosc suau
const ACCENT = '#C86A2E'; // taronja marca

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    color: '#5A4632',
    fontWeight: 'bold',
    marginBottom: 30,
  },
  nextButton: {
    marginTop: 30,
  },
  brandTop: {
    fontSize: 50,
    fontWeight: '900',
    color: ACCENT,
    textAlign: 'left',
    marginBottom: 20,
  },
});
