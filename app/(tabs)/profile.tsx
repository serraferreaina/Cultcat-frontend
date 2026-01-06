// app/(tabs)/profile.tsx
// Perfil amb integració de notificacions de rewards

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  ActivityIndicator,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useRouter } from 'expo-router';
import { getProfile, getUserBadges } from '../../api';
import { getConnections } from '../../api/connections';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShareProfileModal } from '../../components/ShareProfileModal';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [showMenu, setShowMenu] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [user, setUser] = useState<any>(global.currentUser);
  const [showSavedNotification, setShowSavedNotification] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  const [shareModalVisible, setShareModalVisible] = useState(false);

  const [connectionsModalVisible, setConnectionsModalVisible] = useState(false);
  const [connections, setConnections] = useState<any[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);

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

  const fetchConnections = async () => {
    setLoadingConnections(true);
    try {
      const data = await getConnections();
      setConnections(data || []);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setConnections([]);
    } finally {
      setLoadingConnections(false);
    }
  };

  const openConnectionsModal = async () => {
    await fetchConnections();
    setConnectionsModalVisible(true);
  };

  const router = useRouter();

  const DEFAULT_AVATAR =
    'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png';

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUser((prev: any) => ({
        ...prev,
        profile_picture: uri,
      }));

      if (global.currentUser) {
        global.currentUser.profile_picture = uri;
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const loadUser = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          if (!token) return;

          const res = await fetch('http://nattech.fib.upc.edu:40490/profile/', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) throw new Error(`HTTP ${res.status}`);

          const data = await res.json();

          const normalized = {
            id: data.id ?? 0,
            username: data.username ?? '',
            profile_description: data.bio ?? '',
            email: data.email ?? '',
            profile_picture:
              data.profilePic ??
              'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png',
          };

          global.currentUser = normalized;
          setUser(normalized);
        } catch (err) {
          console.error('Error cargando perfil:', err);
        }
      };

      loadUser();

      // Recarregar insígnies quan tornem a la pantalla
      getUserBadges()
        .then((data) => setBadges(data))
        .catch(() => setBadges([]));
    }, []),
  );

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  useEffect(() => {
    if (!global.currentUser) {
      getProfile().then((data) => {
        const normalized = {
          ...data,
          profile_description: data.description ?? '',
          profile_picture: data.profile_picture ?? DEFAULT_AVATAR,
        };
        setUser(normalized);
        global.currentUser = normalized;
      });

      getUserBadges()
        .then((data) => setBadges(data))
        .catch(() => setBadges([]));
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const checkSavedStatus = async () => {
        const justSaved = await AsyncStorage.getItem('justSavedProfile');
        if (justSaved === 'true') {
          setShowSavedNotification(true);
          await AsyncStorage.removeItem('justSavedProfile');

          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();

          setTimeout(() => {
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setShowSavedNotification(false);
            });
          }, 3000);
        }
      };
      checkSavedStatus();
    }, []),
  );

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: Colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Profile Saved Notification Toast */}
      {showSavedNotification && (
        <Animated.View
          style={[
            styles.notification,
            {
              backgroundColor: Colors.accent,
              opacity: fadeAnim,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.notificationText}>{t('Changes saved successfully')}</Text>
        </Animated.View>
      )}

      {/* Overlay y Menú fuera del ScrollView */}
      {showMenu && (
        <>
          <TouchableWithoutFeedback
            onPress={() => {
              setShowMenu(false);
              setShowLanguageSelector(false);
            }}
          >
            <View style={styles.overlay} />
          </TouchableWithoutFeedback>

          <View style={[styles.menuContainer, { backgroundColor: Colors.card }]}>
            {!showLanguageSelector ? (
              <>
                <Text style={[styles.menuTitle, { color: Colors.text }]}>{t('Options')}</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/calendar');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
                    <Text style={[styles.menuItemText, { marginLeft: 8, color: Colors.text }]}>
                      {t('Calendar')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/save_events');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="bookmarks-outline" size={18} color={Colors.accent} />
                    <Text style={[styles.menuItemText, { marginLeft: 8, color: Colors.text }]}>
                      {t('Saved')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/userconfig');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="settings-outline" size={18} color={Colors.accent} />
                    <Text style={[styles.menuItemText, { marginLeft: 8, color: Colors.text }]}>
                      {t('Configuration')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={[styles.menuDivider, { backgroundColor: Colors.border }]} />

                <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                      style={{
                        transform: [{ scale: 0.8 }],
                        marginLeft: -10,
                        marginBottom: -10,
                        marginTop: -10,
                      }}
                    >
                      <ThemeToggle
                        theme={theme}
                        accentColor={Colors.accent}
                        onToggle={toggleTheme}
                      />
                    </View>
                    <Text style={[styles.menuItemText, { marginLeft: -5, color: Colors.text }]}>
                      {t('Theme')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setShowLanguageSelector(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="language-outline" size={18} color={Colors.accent} />
                    <Text style={[styles.menuItemText, { marginLeft: 8, color: Colors.text }]}>
                      {t('Language')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowLanguageSelector(false)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                >
                  <Ionicons name="chevron-back" size={22} color={Colors.text} />
                  <Text style={[styles.menuTitle, { marginLeft: 6, color: Colors.text }]}>
                    {t('Language')}
                  </Text>
                </TouchableOpacity>

                <LanguageSelector
                  currentLanguage={language}
                  onLanguageChange={async (lang) => {
                    setLanguage(lang);
                    await i18n.changeLanguage(lang);
                    await AsyncStorage.setItem('appLanguage', lang);
                    setShowLanguageSelector(false);
                    setShowMenu(false);
                  }}
                  colors={{
                    accent: Colors.accent,
                    card: Colors.card,
                    text: Colors.text,
                    border: Colors.border,
                  }}
                />
              </>
            )}
          </View>
        </>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header: nombre + menu */}
        <View style={styles.headerRow}>
          <Text style={[styles.username, { color: Colors.text }]}>{user?.username}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setShowMenu((p) => !p)}>
              <Ionicons name="menu-outline" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Perfil */}
        <View style={[styles.card, { backgroundColor: Colors.card }]}>
          <View style={styles.topRow}>
            <View>
              <Image
                source={{ uri: user?.profile_picture ?? DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                <Ionicons name="add" size={16} color={Colors.accent} />
              </TouchableOpacity>
            </View>

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
                {user?.username}
              </Text>

              <Text style={{ fontSize: 16, marginBottom: -10, color: Colors.text }}>
                {user?.profile_description || t('No description added yet')}
              </Text>

              <Text style={[styles.points, { color: Colors.text }]}></Text>
              <TouchableOpacity
                style={[styles.pastBtn, { backgroundColor: Colors.background }]}
                activeOpacity={0.8}
                onPress={() => router.push('/previous_events')}
              >
                <Text style={[styles.pastBtnText, { color: Colors.accent }]}>
                  {t('Previus events')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.background }]}
              onPress={() => router.push('/userconfig')}
            >
              <Ionicons name="pencil-outline" size={16} color={Colors.text} />
              <Text style={[styles.actionText, { color: Colors.text, marginLeft: 4 }]}>
                {t('Edit')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: Colors.background }]}
              onPress={openConnectionsModal}
            >
              <Ionicons name="people-outline" size={16} color={Colors.text} />
              <Text style={[styles.actionText, { color: Colors.text, marginLeft: 4 }]}>
                {t('Connections')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insignias */}
        <View style={[styles.section, { backgroundColor: Colors.card }]}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={[styles.sectionTitle, { color: Colors.text }]}>{t('Achivements')}</Text>

            {badges.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/badges')}>
                <Text style={{ color: Colors.accent, fontWeight: '600' }}>{t('See more...')}</Text>
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
      {user && (
        <>
          <ShareProfileModal
            visible={shareModalVisible}
            onClose={() => setShareModalVisible(false)}
            profile={{
              id: user.id,
              username: user.username,
              profile_picture: user.profile_picture || DEFAULT_AVATAR,
              profile_description: user.profile_description,
            }}
            Colors={Colors}
          />

          {/* Connections Modal */}
          <Modal
            visible={connectionsModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setConnectionsModalVisible(false)}
          >
            <SafeAreaView style={[styles.modalScreen, { backgroundColor: Colors.background }]}>
              <View style={styles.connectionsHeader}>
                <TouchableOpacity onPress={() => setConnectionsModalVisible(false)}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={[styles.connectionsTitle, { color: Colors.text }]}>
                  {t('Connections')}
                </Text>
                <Text style={[styles.connectionsCount, { color: Colors.muted }]}>
                  {connections.length}
                </Text>
              </View>

              {loadingConnections ? (
                <View style={styles.connectionsCenterContent}>
                  <ActivityIndicator size="large" color={Colors.accent} />
                </View>
              ) : connections.length === 0 ? (
                <View style={styles.connectionsCenterContent}>
                  <Ionicons name="people-outline" size={48} color={Colors.muted} />
                  <Text style={[styles.connectionsEmptyText, { color: Colors.muted }]}>
                    {t('No connections yet')}
                  </Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={styles.connectionsList}>
                  {connections.map((connection, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.connectionItem,
                        {
                          backgroundColor: Colors.card,
                        },
                      ]}
                      onPress={() => {
                        setConnectionsModalVisible(false);
                        router.push({
                          pathname: '/user/[id]',
                          params: { id: connection.user_id },
                        });
                      }}
                    >
                      <Image
                        source={{
                          uri: DEFAULT_AVATAR,
                        }}
                        style={styles.connectionAvatar}
                      />
                      <View style={styles.connectionItemContent}>
                        <Text style={[styles.connectionUsername, { color: Colors.text }]}>
                          {connection.username}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </SafeAreaView>
          </Modal>
        </>
      )}
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
  username: {
    fontSize: 22,
    fontWeight: '700',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    right: SCREEN_WIDTH * 0.04,
    top: 50,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1000,
    minWidth: SCREEN_WIDTH * 0.55,
  },
  menuTitle: {
    fontWeight: '700',
    fontSize: SCREEN_WIDTH * 0.04,
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
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
    alignItems: 'center',
  },
  avatar: {
    width: SCREEN_WIDTH * 0.2,
    height: SCREEN_WIDTH * 0.2,
    borderRadius: SCREEN_WIDTH * 0.1,
    backgroundColor: '#DDD',
  },
  addPhoto: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: SCREEN_WIDTH * 0.062,
    height: SCREEN_WIDTH * 0.062,
    borderRadius: SCREEN_WIDTH * 0.031,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E1DA',
  },
  points: {},
  pastBtn: {
    alignSelf: 'flex-start',
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pastBtnText: {
    fontWeight: '700',
    paddingBottom: 2,
    paddingTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionText: {
    fontWeight: '700',
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
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: 12,
    marginTop: 8,
    marginHorizontal: SCREEN_WIDTH * 0.04,
    borderRadius: 10,
    gap: 10,
    zIndex: 1001,
  },
  notificationText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: SCREEN_WIDTH * 0.037,
    flex: 1,
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
  modalScreen: {
    flex: 1,
  },
  connectionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E1DA',
  },
  connectionsTitle: {
    fontSize: SCREEN_WIDTH * 0.047,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  connectionsCount: {
    fontSize: SCREEN_WIDTH * 0.037,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'right',
  },
  connectionsCenterContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionsEmptyText: {
    fontSize: SCREEN_WIDTH * 0.042,
    fontWeight: '500',
    marginTop: 12,
  },
  connectionsList: {
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    paddingTop: 12,
    paddingBottom: 24,
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.03,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  connectionAvatar: {
    width: SCREEN_WIDTH * 0.13,
    height: SCREEN_WIDTH * 0.13,
    borderRadius: SCREEN_WIDTH * 0.065,
    marginRight: SCREEN_WIDTH * 0.03,
    backgroundColor: '#DDD',
  },
  connectionItemContent: {
    flex: 1,
  },
  connectionUsername: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '600',
  },
  connectionChatName: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '400',
  },
});
