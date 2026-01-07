import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { getUserBadges, getUserBadgesByUserId } from '../api';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function BadgesScreen() {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBadges = async () => {
      try {
        setLoading(true);
        if (userId) {
          //perfil extern
          const data = await getUserBadgesByUserId(userId);
          setBadges(data);
        } else {
          //perfil loggejat
          const data = await getUserBadges();
          setBadges(data);
        }
      } catch {
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    loadBadges();
  }, [userId]);

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
      {/* HEADER - Enhanced */}
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[
            styles.backButton,
            {
              backgroundColor: Colors.accent + '15',
            },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.accent} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: Colors.text }]}>{t('Achivements')}</Text>
          <Text style={[styles.subtitle, { color: Colors.muted }]}>
            {badges.length} {badges.length === 1 ? t('badge') : t('badges')}
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.accent} />
        </View>
      ) : badges.length === 0 ? (
        <View style={styles.centerContent}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: Colors.accent + '15',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Ionicons name="ribbon-outline" size={44} color={Colors.accent} />
          </View>
          <Text style={[styles.emptyTitle, { color: Colors.text }]}>
            {t('No achievements yet')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: Colors.muted }]}>
            {t('Complete events and activities to earn badges!')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1, backgroundColor: Colors.background }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* BADGES GRID - Enhanced with 4-column layout */}
          <View style={styles.grid}>
            {badges.map((badge, index) => (
              <TouchableOpacity
                key={badge.reward_id}
                style={[
                  styles.badgeCard,
                  {
                    backgroundColor: Colors.card,
                    shadowColor: Colors.shadow,
                  },
                ]}
                onPress={() => openBadge(badge)}
                activeOpacity={0.75}
              >
                {/* Badge Frame with gradient effect */}
                <View
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    backgroundColor: Colors.accent + '12',
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                    borderWidth: 1.5,
                    borderColor: Colors.accent + '25',
                    overflow: 'hidden',
                  }}
                >
                  {/* Decorative background elements */}
                  <View
                    style={{
                      position: 'absolute',
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      backgroundColor: Colors.accent + '08',
                      top: -20,
                      right: -20,
                    }}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: Colors.going + '08',
                      bottom: -15,
                      left: -10,
                    }}
                  />

                  {/* Badge Image */}
                  <Image
                    source={{ uri: badge.icon }}
                    style={{ width: 60, height: 60, borderRadius: 10, zIndex: 1 }}
                  />
                </View>

                <Text style={[styles.badgeName, { color: Colors.text }]} numberOfLines={2}>
                  {t(badge.name)}
                </Text>

                {/* Level Badge */}
                <View
                  style={{
                    backgroundColor: Colors.going + '25',
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 6,
                    marginTop: 6,
                    borderWidth: 0.5,
                    borderColor: Colors.going + '40',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: Colors.going,
                    }}
                  >
                    Lvl {badge.level}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* MODAL - Enhanced */}
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
                    marginBottom: 24,
                    paddingHorizontal: 16,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: Colors.going + '25',
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="star-half" size={18} color={Colors.going} />
                    <Text
                      style={{
                        fontSize: 14,
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
                      paddingVertical: 8,
                      borderRadius: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="medal" size={18} color={Colors.accent} />
                    <Text
                      style={{
                        fontSize: 14,
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
                    marginBottom: 24,
                  }}
                />

                {/* Details Grid - Enhanced */}
                <View style={{ gap: 14, marginBottom: 20 }}>
                  <View
                    style={{
                      backgroundColor: Colors.background,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
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
                        <Ionicons name="bookmark" size={20} color={Colors.accent} />
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: Colors.muted,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        {t('Category')}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: Colors.text,
                        marginLeft: 52,
                      }}
                    >
                      {selectedBadge.category}
                    </Text>
                  </View>

                  <View
                    style={{
                      backgroundColor: Colors.background,
                      padding: 16,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: Colors.border,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          backgroundColor: Colors.going + '20',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="calendar" size={20} color={Colors.going} />
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          color: Colors.muted,
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                        }}
                      >
                        {t('Obtained at')}
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: Colors.text,
                        marginLeft: 52,
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginHorizontal: -4,
  },
  badgeCard: {
    width: '23%',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalContent: {
    width: '92%',
    borderRadius: 28,
    padding: 24,
    paddingTop: 20,
    marginBottom: 20,
    maxHeight: '90%',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 15,
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
    padding: 16,
    borderRadius: 14,
    marginTop: 16,
  },
});
