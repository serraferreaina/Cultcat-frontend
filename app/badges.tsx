import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { getUserBadges } from '../api';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BadgesScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { t } = useTranslation();

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
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    getUserBadges()
      .then(setBadges)
      .catch(() => setBadges([]));
  }, []);

  const openBadge = (badge: Badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const closeBadgeModal = () => {
    setSelectedBadge(null);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: Colors.text }]}>{t('Achivements')}</Text>
      </View>

      {/* BADGES */}
      <ScrollView style={{ flex: 1, backgroundColor: Colors.background, padding: 20 }}>
        <View style={styles.grid}>
          {badges.map((badge) => (
            <TouchableOpacity
              key={badge.reward_id}
              style={styles.item}
              onPress={() => openBadge(badge)}
            >
              <Image source={{ uri: badge.icon }} style={{ width: 70, height: 70 }} />
              <Text style={{ color: Colors.text, marginTop: 8, textAlign: 'center' }}>
                {badge.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeBadgeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            {selectedBadge && (
              <>
                <Image
                  source={{ uri: selectedBadge.icon }}
                  style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 16 }}
                />

                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: Colors.text,
                    textAlign: 'center',
                  }}
                >
                  {selectedBadge.name}
                </Text>

                <Text
                  style={{ fontSize: 14, textAlign: 'center', color: Colors.muted, marginTop: 8 }}
                >
                  🏅 {selectedBadge.level_label} · {t('Nivell')} {selectedBadge.level}
                </Text>

                <Text
                  style={{ fontSize: 14, textAlign: 'center', color: Colors.muted, marginTop: 8 }}
                >
                  ⭐ {t('Category')}: {selectedBadge.category}
                </Text>

                <Text
                  style={{ fontSize: 14, textAlign: 'center', color: Colors.muted, marginTop: 8 }}
                >
                  📅 {t('Obtained at')}: {new Date(selectedBadge.obtained_at).toLocaleDateString()}
                </Text>

                <TouchableOpacity onPress={closeBadgeModal} style={styles.modalButton}>
                  <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                    {t('Close')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backButton: { paddingRight: 10, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 20 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 15,
  },
  item: { width: '30%', alignItems: 'center', marginBottom: 20 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: { width: 100, height: 100, marginBottom: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  modalText: { fontSize: 14, marginBottom: 4 },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#0066ff',
    borderRadius: 8,
  },
  modalButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#6C5CE7',
  },
});
