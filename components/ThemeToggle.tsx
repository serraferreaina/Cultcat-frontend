// components/ThemeToggle.tsx
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  theme: string;
  accentColor: string;
  onToggle: () => void;
}

export function ThemeToggle({ theme, accentColor, onToggle }: ThemeToggleProps) {
  return (
    <Pressable onPress={onToggle} style={styles.container}>
      <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={28} color={accentColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 8, width: 44 },
});
