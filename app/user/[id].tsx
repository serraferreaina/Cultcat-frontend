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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { ShareProfileModal } from '../../components/ShareProfileModal';
import { useTranslation } from 'react-i18next';

export default function PublicProfile() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const { t } = useTranslation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const { t, i18n } = useTranslation();

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
      };

      setUser(normalized);
    } catch (err) {
      console.error('Error cargando usuario:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (loading)
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={Colors.accent} />;

  if (!user)
    return (
      <Text style={{ marginTop: 50, textAlign: 'center', color: Colors.text }}>User not found</Text>
    );

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
                {user.profile_description || 'This user has no description.'}
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
                  style={[styles.actionBtn, { backgroundColor: Colors.accent }]}
                  // onPress={() => {}}
                >
                  <Text style={[styles.actionText, { color: Colors.card }]}>{t('Connect')}</Text>
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

        {/* Achievements */}
        <View style={[styles.section, { backgroundColor: Colors.card }]}>
          <Text style={[styles.sectionTitle, { color: Colors.text }]}>Achievements</Text>
          <View style={[styles.emptyBox, { backgroundColor: Colors.background }]}>
            <Ionicons name="ribbon-outline" size={20} color={Colors.muted} />
            <Text style={[styles.emptyText, { color: Colors.muted }]}>No achievements yet</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

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
});
