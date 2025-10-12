import { useRef } from 'react';
import { Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ThemeToggleProps {
  theme: string;
  accentColor: string;
  onToggle: () => void;
}

export function ThemeToggle({ theme, accentColor, onToggle }: ThemeToggleProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    // Reset rotateAnim to 0 before animating
    rotateAnim.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.3,
          useNativeDriver: true,
          tension: 100,
          friction: 15,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
      ]),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset rotateAnim for next press
      rotateAnim.setValue(0);
    });

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
