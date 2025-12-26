import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getUserBadges } from '../api';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useRouter } from 'expo-router';

export default function BadgesScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  type Badge = {
    reward_id: number;
    name: string;
    category: string;
    level: number;
    level_label: string;
    condition_type: string;
    condition_value: number;
    icon: string;
    obtained_at: string;
  };

  const [badges, setBadges] = useState<Badge[]>([]);

  useEffect(() => {
    getUserBadges()
      .then(setBadges)
      .catch(() => setBadges([]));
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors.background, padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: Colors.accent, marginBottom: 10 }}>⬅ Back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 20, color: Colors.text }}>
        Insignias obtenidas
      </Text>

      <View style={styles.grid}>
        {badges.map((b, i) => (
          <View key={i} style={styles.item}>
            <Image source={{ uri: b.icon }} style={{ width: 70, height: 70 }} />
            <Text style={{ color: Colors.text, marginTop: 8, textAlign: 'center' }}>{b.name}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  item: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
  },
});
