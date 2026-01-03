// components/ThemeToggle.tsx
import { useRef } from 'react';
import { Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ThemeToggleProps {
  theme: string;
  accentColor: string;
  onToggle: () => void;
  permanent?: boolean; // Nueva prop para indicar si el cambio es permanente
}

export function ThemeToggle({ theme, accentColor, onToggle, permanent = false }: ThemeToggleProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    rotateAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.25,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => rotateAnim.setValue(0));

    onToggle();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      <Animated.View
        style={{
          transform: [{ rotate: rotation }, { scale: scaleAnim }],
        }}
      >
        <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={28} color={accentColor} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
