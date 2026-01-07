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
  TouchableWithoutFeedback,
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
  const { t, i18n } = useTranslation();

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
        } else if (normalized.connection_status === 'pending') {
          // If status is pending (request sent by current user), keep it
          setConnectionStatus('pending');
          setPendingRequestId(null);
          setActiveConnection(null);
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
      setConnectionStatus('pending');
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
      // Reload page after brief delay to ensure UI updates properly
      setTimeout(() => {
        router.replace({
          pathname: '/user/[id]',
          params: { id: String(id) },
        });
      }, 500);
    } catch (e) {}
  };

  const getButtonText = () => {
    if (connectionStatus === 'Connected') return t('Connected');
    if (connectionStatus === 'pending') return t('Request sent');
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

              <Text style={{ fontSize: 16, marginBottom: 16, color: Colors.text }}>
                {user.profile_description || t('This user has no description.')}
              </Text>

              {/* Connection actions - Enhanced */}
              <View style={styles.connectionSection}>
                {connectionStatus === 'Connected' ? (
                  <View style={{ width: '100%' }}>
                    <TouchableOpacity
                      onPress={() => setShowConnectedMenu((v) => !v)}
                      style={[
                        styles.connectedRow,
                        {
                          borderColor: Colors.accent,
                          backgroundColor: Colors.accent + '15',
                        },
                      ]}
                    >
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}
                      >
                        <Ionicons name="people" size={20} color={Colors.accent} />
                        <Text style={[styles.connectedText, { color: Colors.text }]}>
                          {t('Connected')}
                        </Text>
                      </View>
                      <Ionicons
                        name={showConnectedMenu ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={Colors.text}
                      />
                    </TouchableOpacity>
                    {showConnectedMenu && (
                      <View
                        style={[
                          styles.connectedMenu,
                          {
                            backgroundColor: Colors.card,
                            borderColor: Colors.border,
                            shadowColor: Colors.shadow,
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                          },
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
                          <Ionicons name="chatbubble" size={18} color={Colors.accent} />
                          <Text style={[styles.menuItemText, { color: Colors.text }]}>
                            {t('Send message')}
                          </Text>
                        </TouchableOpacity>
                        <View style={[styles.menuDivider, { borderColor: Colors.border }]} />
                        <TouchableOpacity
                          style={styles.connectedMenuItem}
                          onPress={handleDeleteConnection}
                        >
                          <Ionicons name="close-circle" size={18} color="#ff4444" />
                          <Text style={[styles.menuItemText, { color: '#ff4444' }]}>
                            {t('Delete connection')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ) : (
                  <TouchableOpacity
                    disabled={isSending || connectionStatus === 'pending'}
                    onPress={pendingRequestId ? handleApproveRequest : handleSendRequest}
                    style={[
                      styles.actionBtn,
                      {
                        backgroundColor:
                          connectionStatus === 'pending'
                            ? Colors.muted
                            : pendingRequestId
                              ? Colors.going
                              : Colors.accent,
                        shadowColor:
                          connectionStatus === 'pending'
                            ? 'transparent'
                            : pendingRequestId
                              ? Colors.going
                              : Colors.accent,
                        shadowOpacity: connectionStatus === 'pending' ? 0 : 0.2,
                        shadowRadius: connectionStatus === 'pending' ? 0 : 8,
                        elevation: connectionStatus === 'pending' ? 0 : 4,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        connectionStatus === 'pending'
                          ? 'time-outline'
                          : pendingRequestId
                            ? 'checkmark'
                            : 'person-add'
                      }
                      size={18}
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.actionText, { color: '#fff' }]}>{getButtonText()}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Botó de compartir - Enhanced */}
          <TouchableOpacity
            style={[
              styles.shareButton,
              {
                backgroundColor: Colors.accent,
                shadowColor: Colors.accent,
                shadowOpacity: 0.15,
                shadowRadius: 6,
              },
            ]}
            onPress={() => setShareModalVisible(true)}
          >
            <Ionicons name="share-social" size={18} color="#fff" />
            <Text style={[styles.shareButtonText, { color: '#fff' }]}>{t('Share profile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Achievements - Styled like own profile */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: Colors.card,
              shadowColor: Colors.shadow,
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: Colors.accent + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="ribbon" size={22} color={Colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t('Achivements')}</Text>
            </View>

            {badges.length > 0 && (
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/badges', params: { userId: String(user?.id) } })
                }
                style={{
                  backgroundColor: Colors.accent + '15',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 12 }}>
                  {t('See more')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {badges.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: Colors.background,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: Colors.border,
                  paddingVertical: 40,
                },
              ]}
            >
              <View
                style={{
                  width: 70,
                  height: 70,
                  borderRadius: 16,
                  backgroundColor: Colors.accent + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                <Ionicons name="ribbon-outline" size={36} color={Colors.accent} />
              </View>
              <Text
                style={[styles.emptyText, { color: Colors.muted, fontSize: 15, fontWeight: '600' }]}
              >
                {t('No achievements yet')}
              </Text>
              <Text
                style={{
                  color: Colors.muted,
                  fontSize: 13,
                  marginTop: 8,
                  lineHeight: 18,
                  textAlign: 'center',
                }}
              >
                {t('Complete events and activities to earn badges!')}
              </Text>
            </View>
          ) : (
            <View>
              <View style={styles.badgesGrid}>
                {badges.slice(0, 6).map((badge, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.badgeItem,
                      {
                        backgroundColor: Colors.background,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: Colors.border,
                        paddingVertical: 12,
                        shadowColor: Colors.shadow,
                        shadowOpacity: 0.06,
                        shadowRadius: 6,
                        elevation: 1,
                      },
                    ]}
                    onPress={() => openBadgeModal(badge)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: 65,
                        height: 65,
                        borderRadius: 14,
                        backgroundColor: Colors.accent + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <Image
                        source={{ uri: badge.icon }}
                        style={{ width: 50, height: 50, borderRadius: 10 }}
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: Colors.text,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {t(badge.name)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {badges.length > 6 && (
                <TouchableOpacity
                  style={[
                    styles.seeMoreBtn,
                    {
                      backgroundColor: Colors.accent + '15',
                      borderColor: Colors.accent,
                    },
                  ]}
                  onPress={() =>
                    router.push({ pathname: '/badges', params: { userId: String(user?.id) } })
                  }
                  activeOpacity={0.7}
                >
                  <Text style={{ color: Colors.accent, fontWeight: '700', fontSize: 14 }}>
                    +{badges.length - 6} {t('more')}
                  </Text>
                </TouchableOpacity>
              )}
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <TouchableWithoutFeedback onPress={closeBadgeModal}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: Colors.card,
                shadowColor: Colors.shadow,
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 15,
              },
            ]}
          >
            {selectedBadge && (
              <ScrollView
                scrollEnabled
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <TouchableOpacity onPress={closeBadgeModal} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>

                <View
                  style={{
                    width: 140,
                    height: 140,
                    borderRadius: 24,
                    backgroundColor: Colors.accent + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    alignSelf: 'center',
                    marginBottom: 24,
                    shadowColor: Colors.accent,
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                    elevation: 5,
                  }}
                >
                  <Image
                    source={{ uri: selectedBadge.icon }}
                    style={{ width: 110, height: 110, borderRadius: 18 }}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: '800',
                    color: Colors.text,
                    textAlign: 'center',
                    marginBottom: 4,
                    letterSpacing: 0.5,
                  }}
                >
                  {t(selectedBadge.name)}
                </Text>

                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    marginBottom: 20,
                    paddingHorizontal: 16,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: Colors.going + '25',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="star-half" size={16} color={Colors.going} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.going }}>
                      {selectedBadge.level_label}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: Colors.accent + '25',
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 10,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="medal" size={16} color={Colors.accent} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.accent }}>
                      {t('Level')} {selectedBadge.level}
                    </Text>
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: Colors.border, marginBottom: 20 }} />

                <View style={{ gap: 14, marginBottom: 20 }}>
                  <View
                    style={{
                      backgroundColor: Colors.background,
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: Colors.accent + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="bookmark" size={18} color={Colors.accent} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: Colors.muted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {t('Category')}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: Colors.text,
                        marginLeft: 46,
                      }}
                    >
                      {selectedBadge.category}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: Colors.background,
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: Colors.going + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="calendar" size={18} color={Colors.going} />
                      </View>
                      <Text
                        style={{
                          fontSize: 12,
                          color: Colors.muted,
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {t('Obtained at')}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        color: Colors.text,
                        marginLeft: 46,
                      }}
                    >
                      {new Date(selectedBadge.obtained_at).toLocaleDateString(i18n.language, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={closeBadgeModal}
                  style={[
                    styles.modalButton,
                    {
                      backgroundColor: Colors.accent,
                      shadowColor: Colors.accent,
                      shadowOpacity: 0.15,
                      shadowRadius: 8,
                      elevation: 3,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: '700',
                      textAlign: 'center',
                      fontSize: 16,
                      letterSpacing: 0.5,
                    }}
                  >
                    {t('Close')}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>

          <TouchableWithoutFeedback onPress={closeBadgeModal}>
            <View style={{ flex: 0.3 }} />
          </TouchableWithoutFeedback>
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
    borderRadius: 20,
    padding: SCREEN_WIDTH * 0.045,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.22,
    borderRadius: SCREEN_WIDTH * 0.11,
    backgroundColor: '#DDD',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: SCREEN_WIDTH * 0.042,
    fontWeight: '700',
  },
  section: {
    borderRadius: 20,
    padding: SCREEN_WIDTH * 0.045,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: SCREEN_WIDTH * 0.045,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeMoreLink: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyBox: {
    borderRadius: 14,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  connectionSection: {
    marginTop: 20,
    width: '100%',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 16,
  },
  actionBtn: {
    width: '100%',
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
  },
  connectedRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
  },
  connectedText: {
    fontWeight: '700',
    fontSize: 16,
  },
  connectedMenu: {
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
  },
  connectedMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
  },
  menuDivider: {
    height: 1,
    borderBottomWidth: 1,
    marginHorizontal: 14,
  },
  menuItemText: {
    fontWeight: '600',
    fontSize: 15,
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
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 6,
  },
  badgeItem: {
    width: '31%',
    alignItems: 'center',
  },
  seeMoreBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    width: '92%',
    borderRadius: 28,
    padding: 24,
    paddingTop: 20,
    marginBottom: 20,
    maxHeight: '85%',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#6C5CE7',
  },
});
