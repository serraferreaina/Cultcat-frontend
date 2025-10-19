// app/(tabs)/profile.tsx
import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';

const BG = '#F7F0E2';
const TEXT = '#311C0C';
const ACCENT = '#C86A2E';
const MUTED = '#8B7355';
const CARD = '#FFF';

const mockUser = {
  username: 'tonigratacos',
  avatar: 'https://i.pravatar.cc/200?img=12', // placeholder
  description: 'bcn | Ingeniería informática',
  points: 750,
  level: 2,
  stats: {
    eventos: 11,
    logros: 20,
    amigos: 60,
  },
};

export default function Profile() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header: nombre + acciones (calendar/bookmark/menu placeholder) */}
        <View style={styles.headerRow}>
          <Text style={styles.username}>{mockUser.username}</Text>
          <View style={styles.headerIcons}>
            <Ionicons name="calendar-outline" size={22} color={TEXT} />
            <Ionicons name="bookmarks-outline" size={22} color={TEXT} style={{ marginLeft: 12 }} />
            <Ionicons name="menu-outline" size={24} color={TEXT} style={{ marginLeft: 12 }} />
          </View>
        </View>

        {/* Perfil básico */}
        <View style={styles.card}>
          <View style={styles.topRow}>
            <View>
              <Image source={{ uri: mockUser.avatar }} style={styles.avatar} />
              {/* Botoncito de añadir foto (solo UI) */}
              <View style={styles.addPhoto}>
                <Ionicons name="add" size={16} color={ACCENT} />
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.desc}>{mockUser.description}</Text>
              <Text style={styles.points}>
                <Text style={{ fontWeight: '700' }}>{t('Punts')}:</Text> {mockUser.points} pts.
              </Text>
              {/* Botón Eventos pasados */}
              <TouchableOpacity style={styles.pastBtn} activeOpacity={0.8}>
                <Text style={styles.pastBtnText}>{t('Esdevenmients passats')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockUser.stats.eventos}</Text>
              <Text style={styles.statLabel}>{t('Assistits')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockUser.stats.logros}</Text>
              <Text style={styles.statLabel}>{t('Assoliments')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{mockUser.stats.amigos}</Text>
              <Text style={styles.statLabel}>{t('Amics')}</Text>
            </View>
          </View>

          {/* Nivel + barra simple */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.levelText}>
              {t('Nivell')} {mockUser.level}
            </Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.progressHint}>900 pts.</Text>
          </View>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ECE6DA' }]}>
              <Text style={[styles.actionText, { color: TEXT }]}>{t('Editar')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: CARD, borderWidth: 1, borderColor: '#E4D8C8' },
              ]}
            >
              <Text style={[styles.actionText, { color: TEXT }]}>{t('Compartir')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Insignias (vacío) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Insígnies')}</Text>
          <View style={styles.emptyBox}>
            <Ionicons name="ribbon-outline" size={20} color={MUTED} />
            <Text style={styles.emptyText}>{t('Sense insígnies per ara')}</Text>
          </View>
        </View>

        {/* Eventos próximos (vacío) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('Próxims esdeveniments')}</Text>
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-outline" size={20} color={MUTED} />
            <Text style={styles.emptyText}>{t('No hi ha events pròxims')}</Text>
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
  headerIcons: { flexDirection: 'row', alignItems: 'center' },

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
  topRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 78, height: 78, borderRadius: 40, backgroundColor: '#DDD' },
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
  desc: { color: MUTED, marginBottom: 6 },
  points: { color: TEXT },

  pastBtn: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: '#EFD6C6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  pastBtnText: { color: ACCENT, fontWeight: '700' },

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
  statItem: { alignItems: 'center', flex: 1 },
  statNumber: { color: TEXT, fontSize: 18, fontWeight: '800' },
  statLabel: { color: MUTED, fontSize: 12 },
  divider: { width: 1, height: 26, backgroundColor: '#E4D8C8' },

  levelText: { color: TEXT, fontWeight: '700', marginBottom: 6 },
  progressBg: { height: 6, backgroundColor: '#E7E0D2', borderRadius: 999 },
  progressFill: { height: 6, backgroundColor: '#7057FF', borderRadius: 999, width: '0%' },
  progressHint: { color: MUTED, fontSize: 12, marginTop: 6, textAlign: 'right' },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontWeight: '700' },

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
  sectionTitle: { color: TEXT, fontWeight: '800', fontSize: 16, marginBottom: 10 },
  emptyBox: {
    backgroundColor: BG,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { color: MUTED, marginTop: 6 },
});
