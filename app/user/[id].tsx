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
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { ShareProfileModal } from '../../components/ShareProfileModal';
import { useTranslation } from 'react-i18next';
import {
  sendConnectionRequest,
  getUserBadgesByUserId,
  getNotifications,
  acceptConnection,
  deleteConnection,
} from '../../api';
import { getConnections } from '../../api/connections';

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
  const [pendingRequestId, setPendingRequestId] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [activeConnection, setActiveConnection] = useState<{
    connection_id: number;
    chat_id?: number;
  } | null>(null);
  const [showConnectedMenu, setShowConnectedMenu] = useState(false);

  // Toast state
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];

  const showToastMessage = (message: string) => {
    setToastText(message);
    setShowToast(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
          setShowToast(false),
        );
      }, 2000);
    });
  };

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
    setLoading(true);
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

      // Check if already connected
      try {
        const connections = await getConnections();
        const match = connections.find((conn: any) => conn.user_id === data.id);
        const isConnected = !!match;

        if (isConnected) {
          setConnectionStatus('Connected');
          setActiveConnection({ connection_id: match.connection_id, chat_id: match.chat_id });
          setPendingRequestId(null);
        } else {
          // If not connected, check if there is a pending request received from this user
          try {
            const notifications = await getNotifications();
            const pending = (notifications || []).find(
              (n: any) =>
                n.type === 'connection_request_received' && n.payload?.from_user_id === data.id,
            );
            if (pending) {
              setPendingRequestId(pending.reference_id);
              setActiveConnection(null);
            } else {
              setPendingRequestId(null);
              setActiveConnection(null);
            }
          } catch (e) {
            setPendingRequestId(null);
            setActiveConnection(null);
          }
        }
      } catch (err) {
        console.error('Error checking connections:', err);
      }
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
      setIsSending(true);
      await sendConnectionRequest(String(id));
      showToastMessage(t('Connection request sent'));
    } catch (e) {
    } finally {
      setIsSending(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!pendingRequestId) return;
    try {
      await acceptConnection(pendingRequestId);
      setConnectionStatus('Connected');
      setPendingRequestId(null);
      showToastMessage(t('Connection accepted'));
      // Refresh connections to capture ids
      try {
        const connections = await getConnections();
        const match = connections.find((c: any) => c.user_id === Number(id));
        if (match)
          setActiveConnection({ connection_id: match.connection_id, chat_id: match.chat_id });
      } catch {}
    } catch (e) {}
  };

  const handleDeleteConnection = async () => {
    if (!activeConnection) return;
    try {
      await deleteConnection(activeConnection.connection_id);
      setActiveConnection(null);
      setConnectionStatus(null);
      setShowConnectedMenu(false);
      showToastMessage(t('Connection deleted'));
      // Refresh full user and connections state after deletion
      await fetchUser();
    } catch (e) {}
  };

  const getButtonText = () => {
    if (connectionStatus === 'Connected') return t('Connected');
    if (pendingRequestId) return t('Approve connection');
    return t('Connect');
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: Colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {showToast && (
        <Animated.View
          style={[styles.toast, { backgroundColor: Colors.accent, opacity: fadeAnim }]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>{toastText}</Text>
        </Animated.View>
      )}
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

              {/* Connection actions */}
              <View style={{ marginTop: 20 }}>
                {connectionStatus === 'Connected' ? (
                  <View>
                    <TouchableOpacity
                      onPress={() => setShowConnectedMenu((v) => !v)}
                      style={[styles.connectedRow, { borderColor: Colors.border }]}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={Colors.going} />
                      <Text style={{ color: Colors.text, fontWeight: '700', marginLeft: 8 }}>
                        {t('Connected')}
                      </Text>
                      <View style={{ flex: 1 }} />
                      <Ionicons
                        name={showConnectedMenu ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.text}
                      />
                    </TouchableOpacity>
                    {showConnectedMenu && (
                      <View
                        style={[
                          styles.connectedMenu,
                          { backgroundColor: Colors.card, borderColor: Colors.border },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.connectedMenuItem}
                          onPress={() => {
                            setShowConnectedMenu(false);
                            if (activeConnection?.chat_id) {
                              router.push({
                                pathname: '/xat/[id]',
                                params: { id: String(activeConnection.chat_id) },
                              });
                            }
                          }}
                        >
                          <Ionicons name="chatbubbles-outline" size={16} color={Colors.text} />
                          <Text style={{ color: Colors.text, marginLeft: 8 }}>
                            {t('Send message')}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.connectedMenuItem}
                          onPress={handleDeleteConnection}
                        >
                          <Ionicons name="trash-outline" size={16} color={Colors.accent} />
                          <Text style={{ color: Colors.accent, marginLeft: 8 }}>
                            {t('Delete connection')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    disabled={isSending}
                    onPress={pendingRequestId ? handleApproveRequest : handleSendRequest}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor: pendingRequestId ? Colors.going : Colors.accent,
                      },
                    ]}
                  >
                    <Text style={[styles.actionText, { color: Colors.card }]}>
                      {getButtonText()}
                    </Text>
                  </TouchableOpacity>
                )}
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
  content: { paddingHorizontal: SCREEN_WIDTH * 0.04, paddingTop: 8, paddingBottom: 24 },
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
    fontSize: SCREEN_WIDTH * 0.057,
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: SCREEN_WIDTH * 0.04,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: SCREEN_WIDTH * 0.2,
    height: SCREEN_WIDTH * 0.2,
    borderRadius: SCREEN_WIDTH * 0.1,
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
    fontSize: SCREEN_WIDTH * 0.032,
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
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    padding: SCREEN_WIDTH * 0.04,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: SCREEN_WIDTH * 0.042,
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
  connectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    borderRadius: 12,
    borderWidth: 1,
  },
  connectedMenu: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  connectedMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: SCREEN_WIDTH * 0.03,
  },
  // Toast styles similar to profile screen
  toast: {
    position: 'absolute',
    top: 8,
    left: SCREEN_WIDTH * 0.04,
    right: SCREEN_WIDTH * 0.04,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
