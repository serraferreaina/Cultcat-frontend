// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { LanguageSelector } from '../../components/LanguageSelector';
import { useRouter } from 'expo-router';
import { getProfile } from '../../api';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

const BG = '#F7F0E2';
const TEXT = '#311C0C';
const ACCENT = '#C86A2E';
const MUTED = '#8B7355';
const CARD = '#FFF';

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const [showMenu, setShowMenu] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [user, setUser] = useState<any>(global.currentUser);

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
      if (global.currentUser) {
        setUser(global.currentUser);
      }
    }, []),
  );

  useEffect(() => {
    if (!global.currentUser) {
      getProfile().then((data) => {
        const normalized = {
          ...data,
          profile_description: data.description ?? '',
          profile_picture: data.profile_picture ?? null,
        };
        setUser(normalized);
        global.currentUser = normalized;
      });
    }
  }, []);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header: nombre + menu */}
        <View style={styles.headerRow}>
          <Text style={styles.username}>{user?.username}</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity onPress={() => setShowMenu((p) => !p)}>
              <Ionicons name="menu-outline" size={24} color={TEXT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Menú */}
        {showMenu && (
          <View style={styles.menuContainer}>
            {!showLanguageSelector ? (
              <>
                <Text style={styles.menuTitle}>{t('Options')}</Text>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    router.push('/calendar');
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={18} color={ACCENT} />
                    <Text style={[styles.menuItemText, { marginLeft: 8 }]}>{t('Calendar')}</Text>
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
                    <Ionicons name="bookmarks-outline" size={18} color={ACCENT} />
                    <Text style={[styles.menuItemText, { marginLeft: 8 }]}>{t('Saved')}</Text>
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
                    <Ionicons name="settings-outline" size={18} color={ACCENT} />
                    <Text style={[styles.menuItemText, { marginLeft: 8 }]}>
                      {t('Configuration')}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

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
                      <ThemeToggle theme={theme} accentColor={ACCENT} onToggle={toggleTheme} />
                    </View>
                    <Text style={[styles.menuItemText, { marginLeft: -5 }]}>{t('Theme')}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => setShowLanguageSelector(true)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="language-outline" size={18} color={ACCENT} />
                    <Text style={[styles.menuItemText, { marginLeft: 8 }]}>{t('Language')}</Text>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowLanguageSelector(false)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}
                >
                  <Ionicons name="chevron-back" size={22} color={TEXT} />
                  <Text style={[styles.menuTitle, { marginLeft: 6 }]}>{t('Language')}</Text>
                </TouchableOpacity>

                <LanguageSelector
                  currentLanguage={language}
                  onLanguageChange={(lang) => {
                    setLanguage(lang);
                    i18n.changeLanguage(lang);
                    setShowLanguageSelector(false);
                    setShowMenu(false);
                  }}
                  colors={{
                    accent: ACCENT,
                    card: CARD,
                    text: TEXT,
                    border: '#E4D8C8',
                  }}
                />
              </>
            )}
          </View>
        )}

        {/* Perfil */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View>
              <Image
                source={{ uri: user?.profile_picture ?? DEFAULT_AVATAR }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                <Ionicons name="add" size={16} color={ACCENT} />
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
                {user?.username ?? 'Usuario'}
              </Text>

              <Text
                style={{
                  fontSize: 16,
                  marginBottom: -10,
                  color: Colors.text,
                }}
              >
                {user?.profile_description || 'Encara no has afegit una descripció.'}
              </Text>

              <TouchableOpacity style={styles.pastBtn} activeOpacity={0.8}>
                <Text style={styles.pastBtnText}>{t('Previus events')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Nivel + barra */}
          <View style={{ marginTop: 12 }}>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.progressHint}>900 pts.</Text>
          </View>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECE6DA' }]}>
              <Text style={[styles.actionText, { color: TEXT }]}>{t('Edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: CARD, borderWidth: 1, borderColor: '#E4D8C8' },
              ]}
            >
              <Text style={[styles.actionText, { color: TEXT }]}>{t('Share')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insignias */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Achivements')}</Text>
          <View style={styles.emptyBox}>
            <Ionicons name="ribbon-outline" size={20} color={MUTED} />
            <Text style={styles.emptyText}>{t('No achievements yet')}</Text>
          </View>
        </View>

        {/* Eventos próximos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Next events')}</Text>
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={20} color={MUTED} />
            <Text style={styles.emptyText}>{t('No upcoming events')}</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    top: 50,
    backgroundColor: CARD,
    padding: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    zIndex: 1000,
    minWidth: 220,
  },
  menuTitle: {
    color: TEXT,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 8,
  },
  menuItem: {
    paddingVertical: 12,
  },
  menuItemText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E4D8C8',
    marginVertical: 8,
  },

  card: {
    backgroundColor: CARD,
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
  addPhoto: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E1DA',
  },
  desc: {
    color: MUTED,
    marginBottom: 6,
  },
  points: {
    color: TEXT,
  },
  pastBtn: {
    alignSelf: 'flex-start',
    marginTop: 20,
    backgroundColor: '#EFD6C6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pastBtnText: {
    color: ACCENT,
    fontWeight: '700',
    paddingBottom: 2,
    paddingTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: MUTED,
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: '#E4D8C8',
  },
  levelText: {
    color: TEXT,
    fontWeight: '700',
    marginBottom: 6,
  },
  progressBg: {
    height: 6,
    backgroundColor: '#E7E0D2',
    borderRadius: 999,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#7057FF',
    borderRadius: 999,
    width: '0%',
  },
  progressHint: {
    color: MUTED,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
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
  },
  actionText: {
    fontWeight: '700',
  },
  section: {
    backgroundColor: CARD,
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
    color: TEXT,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 10,
  },
  emptyBox: {
    backgroundColor: BG,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: MUTED,
    marginTop: 6,
  },
});
