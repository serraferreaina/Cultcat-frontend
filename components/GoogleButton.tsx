import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface GoogleButtonProps {
  onPress?: () => void;
}

export default function GoogleButton({ onPress }: GoogleButtonProps) {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { backgroundColor: Colors.card, borderColor: Colors.border }]}
    >
      <Image source={require('../assets/googleLogo.png')} style={styles.icon} />
      <Text style={[styles.text, { color: Colors.text }]}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  icon: { width: 20, height: 20, marginRight: 10 },
  text: { fontSize: 20, fontWeight: '500' },
});
