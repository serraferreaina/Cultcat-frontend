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

        {/* Perfil Card - Enhanced */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: Colors.card,
              shadowColor: Colors.shadow,
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 4,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: user?.profile_picture ?? DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={[
                  styles.addPhoto,
                  {
                    backgroundColor: Colors.accent,
                    borderColor: Colors.card,
                  },
                ]}
                onPress={pickImage}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text
                style={{
                  marginTop: 10,
                  marginBottom: 6,
                  fontSize: 17,
                  fontWeight: '700',
                  color: Colors.text,
                }}
              >
                {user?.username}
              </Text>

              <Text
                style={{
                  fontSize: 14,
                  marginBottom: 12,
                  color: Colors.muted,
                  lineHeight: 20,
                }}
                numberOfLines={2}
              >
                {user?.profile_description || t('No description added yet')}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pastBtn,
                  {
                    backgroundColor: Colors.background,
                    borderWidth: 1.5,
                    borderColor: Colors.accent,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => router.push('/previous_events')}
              >
                <Ionicons name="time-outline" size={14} color={Colors.accent} />
                <Text style={[styles.pastBtnText, { color: Colors.accent, marginLeft: 4 }]}>
                  {t('Previous events')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Actions - Enhanced */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: Colors.background,
                  borderWidth: 1.5,
                  borderColor: Colors.border,
                  shadowColor: 'transparent',
                },
              ]}
              onPress={() => router.push('/userconfig')}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={17} color={Colors.accent} />
              <Text style={[styles.actionText, { color: Colors.accent, marginLeft: 6 }]}>
                {t('Edit Profile')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: Colors.accent,
                  shadowColor: Colors.accent,
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
              onPress={openConnectionsModal}
              activeOpacity={0.8}
            >
              <Ionicons name="people" size={17} color="#fff" />
              <Text style={[styles.actionText, { color: '#fff', marginLeft: 6 }]}>
                {t('Connections')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insignias Section - Enhanced A LOT */}
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
                onPress={() => router.push('/badges')}
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
                  onPress={() => router.push('/badges')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      color: Colors.accent,
                      fontWeight: '700',
                      fontSize: 14,
                    }}
                  >
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
                scrollEnabled={true}
                bounces={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* Close Button */}
                <TouchableOpacity onPress={closeBadgeModal} style={styles.modalCloseButton}>
                  <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>

                {/* Badge Icon Container - Enhanced */}
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

                {/* Badge Name - Enhanced */}
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

                {/* Badge Level - Enhanced */}
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: Colors.going,
                      }}
                    >
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
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: Colors.accent,
                      }}
                    >
                      {t('Level')} {selectedBadge.level}
                    </Text>
                  </View>
                </View>

                {/* Divider */}
                <View
                  style={{
                    height: 1,
                    backgroundColor: Colors.border,
                    marginBottom: 20,
                  }}
                />

                {/* Details Grid - Enhanced */}
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

                {/* Close Button - Enhanced */}
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
            animationType="slide"
            presentationStyle="pageSheet"
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
                      <View style={styles.connectionChevron}>
                        <Ionicons name="chevron-forward" size={20} color={Colors.accent} />
                      </View>
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
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
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
    borderRadius: 16,
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
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginVertical: 8,
  },
  card: {
    borderRadius: 20,
    padding: SCREEN_WIDTH * 0.045,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: SCREEN_WIDTH * 0.22,
    height: SCREEN_WIDTH * 0.22,
    borderRadius: SCREEN_WIDTH * 0.11,
    backgroundColor: '#DDD',
    borderWidth: 3,
  },
  addPhoto: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: SCREEN_WIDTH * 0.08,
    height: SCREEN_WIDTH * 0.08,
    borderRadius: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  points: {},
  pastBtn: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pastBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  actionText: {
    fontWeight: '700',
    fontSize: 15,
  },
  section: {
    borderRadius: 20,
    padding: SCREEN_WIDTH * 0.045,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '800',
    fontSize: SCREEN_WIDTH * 0.048,
    letterSpacing: -0.3,
  },
  sectionLink: {
    fontWeight: '600',
    fontSize: 12,
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
  seeMoreLink: {
    fontWeight: '600',
    fontSize: 14,
  },
  emptyBox: {
    borderRadius: 16,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: 12,
    marginTop: 8,
    marginHorizontal: SCREEN_WIDTH * 0.04,
    borderRadius: 12,
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
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 12,
  },
  badgeItem: {
    width: '31%',
    alignItems: 'center',
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
  modalScreen: {
    flex: 1,
  },
  connectionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingTop: SCREEN_WIDTH * 0.04,
    paddingBottom: SCREEN_WIDTH * 0.04,
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
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
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
  connectionChevron: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  connectionUsername: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontWeight: '700',
  },
  connectionChatName: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontWeight: '400',
  },
});
