// components/NextButton.tsx
import React, { useRef, useEffect } from 'react';
import { Pressable, Animated, StyleSheet, View, Platform, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface NextButtonProps {
  accentColor: string;
  onPress: () => void;
}

export function NextButton({ accentColor, onPress }: NextButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const particlesAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handlePressIn = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 250,
      friction: 10,
    }).start();
  };

  const handlePressOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.2,
        tension: 200,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(particlesAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Reset animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(particlesAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start();

      // Wait a moment before triggering navigation — lets you SEE the animation
      setTimeout(() => {
        onPress();
      }, 250);
    });
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08], // tighter radius, closer to the circle
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  const particlePositions = [
    { x: 50, y: -50 },
    { x: -50, y: -50 },
    { x: 50, y: 50 },
    { x: -50, y: 50 },
    { x: 70, y: 0 },
    { x: -70, y: 0 },
    { x: 0, y: 70 },
    { x: 0, y: -70 },
  ];

  return (
    <View style={styles.container}>
      {/* Particles */}
      {particlePositions.map((pos, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              backgroundColor: accentColor,
              transform: [
                {
                  translateX: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, pos.x],
                  }),
                },
                {
                  translateY: particlesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, pos.y],
                  }),
                },
                {
                  scale: particlesAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 1, 0],
                  }),
                },
              ],
              opacity: particlesAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0, 1, 0],
              }),
            },
          ]}
        />
      ))}

      {/* Pulsing ring */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            borderColor: accentColor,
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Button */}
      <Pressable
        testID="next-button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleAnim }, { rotate: rotation }],
            },
          ]}
        >
          <Ionicons name="arrow-forward-circle" size={80} color={accentColor} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  pressable: { zIndex: 10 },
  iconContainer: { alignItems: 'center', justifyContent: 'center' },
  glowRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 5,
  },
});
