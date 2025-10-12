// components/LanguageSelector.tsx
import { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface LanguageSelectorProps {
  currentLanguage: string;
  colors: {
    accent: string;
    card: string;
    text: string;
    border: string;
  };
  onLanguageChange: (lang: 'en' | 'es' | 'ca') => void;
}

const LANGUAGE_LABELS = {
  en: 'English',
  es: 'Español',
  ca: 'Català',
};

const LANGUAGES = ['en', 'es', 'ca'] as const;

export function LanguageSelector({
  currentLanguage,
  colors,
  onLanguageChange,
}: LanguageSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Animations
  const chevronRotation = useRef(new Animated.Value(0)).current;
  const dropdownScale = useRef(new Animated.Value(0.9)).current;
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const dropdownTranslateY = useRef(new Animated.Value(-5)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Create animated values per language
  const optionScales = useMemo(
    () =>
      LANGUAGES.reduce(
        (acc, lang) => {
          acc[lang] = new Animated.Value(1);
          return acc;
        },
        {} as Record<(typeof LANGUAGES)[number], Animated.Value>,
      ),
    [],
  );

  // Idle pulse for button
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  useEffect(() => {
    // Chevron rotation
    Animated.spring(chevronRotation, {
      toValue: showDropdown ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Dropdown animations
    if (showDropdown) {
      Animated.parallel([
        Animated.spring(dropdownScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 90,
          friction: 7,
        }),
        Animated.spring(dropdownTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 7,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(dropdownScale, {
          toValue: 0.95,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dropdownTranslateY, {
          toValue: -8,
          duration: 180,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dropdownOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDropdown]);

  const handleLanguageSelect = async (lang: 'en' | 'es' | 'ca') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    onLanguageChange(lang);
    setShowDropdown(false);
  };

  const handleButtonPress = async () => {
    await Haptics.selectionAsync();

    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.93,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    setShowDropdown((prev) => !prev);
  };

  const chevronRotate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={styles.wrapper}>
      {/* Main Button */}
      <Animated.View style={{ transform: [{ scale: Animated.multiply(buttonScale, pulseAnim) }] }}>
        <Pressable
          onPress={handleButtonPress}
          style={[
            styles.currentButton,
            {
              borderColor: colors.accent,
              backgroundColor: colors.card,
              shadowOpacity: showDropdown ? 0.3 : 0.15,
              shadowRadius: showDropdown ? 8 : 4,
              transform: [{ scale: 1 }],
            },
          ]}
        >
          <Text style={[styles.currentText, { color: colors.text }]}>
            {LANGUAGE_LABELS[currentLanguage as keyof typeof LANGUAGE_LABELS]}
          </Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.accent}
              style={{ marginLeft: 4 }}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Dropdown */}
      {showDropdown && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              opacity: dropdownOpacity,
              transform: [{ scale: dropdownScale }, { translateY: dropdownTranslateY }],
            },
          ]}
        >
          {LANGUAGES.filter((l) => l !== currentLanguage).map((lang, index) => {
            const scale = optionScales[lang];
            return (
              <Pressable
                key={lang}
                onPressIn={() => {
                  Animated.spring(scale, {
                    toValue: 0.94,
                    useNativeDriver: true,
                    tension: 200,
                    friction: 6,
                  }).start();
                }}
                onPressOut={() => {
                  Animated.spring(scale, {
                    toValue: 1,
                    useNativeDriver: true,
                    tension: 200,
                    friction: 6,
                  }).start();
                }}
                onPress={() => handleLanguageSelect(lang)}
                style={styles.option}
              >
                <Animated.View style={{ transform: [{ scale }] }}>
                  <Text style={[styles.optionText, { color: colors.text }]}>
                    {LANGUAGE_LABELS[lang]}
                  </Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  currentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  currentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    position: 'absolute',
    top: 55,
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 1000,
  },
  option: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
