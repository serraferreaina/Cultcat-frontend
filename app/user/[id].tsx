// app/user/[id].tsx amb botó de compartir

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { ShareProfileModal } from '../../components/ShareProfileModal';
import { useTranslation } from 'react-i18next';
import { sendConnectionRequest, getUserBadgesByUserId } from '../../api';

export default function PublicProfile() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
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

  const openBadgeModal = (badge: Badge) => {
    setSelectedBadge(badge);
    setModalVisible(true);
  };

  const closeBadgeModal = () => {
    setSelectedBadge(null);
    setModalVisible(false);
  };

  const DEFAULT_AVATAR =
    'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png';

  const fetchUser = async () => {
    try {
      const res = await fetch(`http://nattech.fib.upc.edu:40490/users/${id}`);
      const data = await res.json();

      const normalized = {
        id: data.id,
        username: data.username,
        email: data.email,
        profile_picture: data.profilePic || DEFAULT_AVATAR,
        profile_description: data.bio || '',
        connection_status: data.connection_status || null,
      };

      setUser(normalized);
      setConnectionStatus(normalized.connection_status);
    } catch (err) {
      console.error('Error cargando usuario:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    if (id) {
      getUserBadgesByUserId(String(id))
        .then(setBadges)
        .catch(() => setBadges([]));
    }
  }, [id]);

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Colors.accent} />;

  if (!user)
    return (
      <Text style={{ marginTop: 50, textAlign: 'center', color: Colors.text }}>User not found</Text>
    );

  const handleSendRequest = async () => {
    if (!id) return;
    try {
      await sendConnectionRequest(String(id));
      setConnectionStatus('Pending');
    } catch (e) {
      console.log(' Error:', e);
    }
  };

  const getButtonText = () => {
    if (connectionStatus === 'Pending') return t('Requested');
    if (connectionStatus === 'Following') return t('Following');
    return t('Connect');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: Colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header amb botó de tornar */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={[styles.username, { color: Colors.text }]}>{user.username}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Card Perfil */}
        <View style={[styles.card, { backgroundColor: Colors.card }]}>
          <View style={styles.topRow}>
            <Image source={{ uri: user.profile_picture }} style={styles.avatar} />

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text
                style={{
                  marginTop: 10,
                  marginBottom: 10,
                  fontSize: 15,
                  fontWeight: '600',
                  color: Colors.text,
                }}
              >
                {user.username}
              </Text>

              <Text style={{ fontSize: 16, marginBottom: -10, color: Colors.text }}>
                {user.profile_description || t('This user has no description.')}
              </Text>

              <View style={{ marginTop: 16 }}>
                <View style={[styles.progressBg, { backgroundColor: Colors.background }]}>
                  <View
                    style={[styles.progressFill, { width: '60%', backgroundColor: Colors.accent }]}
                  />
                </View>
                <Text style={[styles.progressHint, { color: Colors.muted }]}>900 pts.</Text>
              </View>

              {/* Botón Solicitud de Amistad */}
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                  disabled={connectionStatus === 'Pending' || connectionStatus === 'Following'}
                  onPress={handleSendRequest}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor:
                        connectionStatus === 'Following'
                          ? Colors.going
                          : connectionStatus === 'Pending'
                            ? Colors.muted
                            : Colors.accent,
                    },
                  ]}
                >
                  <Text style={[styles.actionText, { color: Colors.card }]}>{getButtonText()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Botó de compartir */}
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: Colors.background }]}
            onPress={() => setShareModalVisible(true)}
          >
            <Ionicons name="share-social-outline" size={18} color={Colors.accent} />
            <Text style={[styles.shareButtonText, { color: Colors.accent }]}>
              {t('Share profile')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Insignias */}
        <View style={[styles.section, { backgroundColor: Colors.card }]}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t('Achivements')}</Text>

            {badges.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/badges',
                    params: { userId: String(user.id) },
                  })
                }
              >
                <Text style={{ color: Colors.accent, fontWeight: '600' }}>{t('See more')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {badges.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: Colors.background }]}>
              <Ionicons name="ribbon-outline" size={20} color={Colors.muted} />
              <Text style={[styles.emptyText, { color: Colors.muted }]}>
                {t('No achievements yet')}
              </Text>
            </View>
          ) : (
            <View style={styles.badgesGrid}>
              {badges.slice(0, 6).map((badge, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.badgeItem}
                  onPress={() => openBadgeModal(badge)}
                >
                  <Image
                    source={{ uri: badge.icon }}
                    style={{ width: 60, height: 60, borderRadius: 8 }}
                  />
                  <Text
                    style={{ fontSize: 12, marginTop: 4, color: Colors.text, textAlign: 'center' }}
                  >
                    {t(badge.name)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

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
                  {t(selectedBadge.name)}
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

      {/* Modal de compartir */}
      <ShareProfileModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        profile={{
          id: user.id,
          username: user.username,
          profile_picture: user.profile_picture,
          profile_description: user.profile_description,
        }}
        Colors={Colors}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 4,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 40,
    backgroundColor: '#DDD',
  },
  progressBg: {
    height: 6,
    borderRadius: 999,
  },
  progressFill: {
    height: 6,
    borderRadius: 999,
  },
  progressHint: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 10,
  },
  emptyBox: {
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 6,
  },
  actionText: {
    fontWeight: '700',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginTop: 10,
    gap: 15,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#6C5CE7',
  },
});
