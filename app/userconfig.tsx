// app/userconfig.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

const BG = '#F7F0E2';
const TEXT = '#311C0C';
const ACCENT = '#C86A2E';
const MUTED = '#8B7355';
const CARD = '#FFF';

export default function UserConfig() {
  const { t } = useTranslation();
  const router = useRouter();

  // Estats per al formulari
  const [username, setUsername] = useState('tonigratacos');
  const [description, setDescription] = useState('bcn | Ingeniería informática');
  const [email, setEmail] = useState('toni@example.com');
  const [phone, setPhone] = useState('+34 600 000 000');
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/200?img=12');

  const handleSave = () => {
    // Aquí es faria la lògica per guardar les dades
    Alert.alert(
      t('Canvis guardats') || 'Canvis guardats',
      t("El teu perfil s'ha actualitzat correctament") ||
        "El teu perfil s'ha actualitzat correctament",
    );
    router.back();
  };

  const handleChangeAvatar = () => {
    // Aquí es faria la lògica per canviar la foto
    Alert.alert(
      t('Canviar foto') || 'Canviar foto',
      t('Funcionalitat per seleccionar una nova foto') ||
        'Funcionalitat per seleccionar una nova foto',
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={TEXT} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('Configuració')}</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Foto de perfil */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Foto de perfil')}</Text>
          <View style={styles.avatarSection}>
            <Image source={{ uri: avatar }} style={styles.avatarLarge} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangeAvatar}>
                <Ionicons name="camera-outline" size={20} color={CARD} />
                <Text style={styles.changePhotoText}>{t('Canviar foto')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.removePhotoBtn}>
                <Text style={styles.removePhotoText}>{t('Eliminar foto')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Informació personal */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Informació personal')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t("Nom d'usuari")}</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder={t("Introdueix el teu nom d'usuari") || "Introdueix el teu nom d'usuari"}
              placeholderTextColor={MUTED}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('Descripció')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('Escriu una breu descripció') || 'Escriu una breu descripció'}
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('Correu electrònic')}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correu@exemple.com"
              placeholderTextColor={MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('Telèfon')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+34 600 000 000"
              placeholderTextColor={MUTED}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Preferències */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Preferències')}</Text>

          <TouchableOpacity style={styles.preferenceItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="notifications-outline" size={22} color={TEXT} />
              <Text style={styles.preferenceText}>{t('Notificacions')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          <TouchableOpacity style={styles.preferenceItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="lock-closed-outline" size={22} color={TEXT} />
              <Text style={styles.preferenceText}>{t('Privacitat')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          <TouchableOpacity style={styles.preferenceItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="shield-checkmark-outline" size={22} color={TEXT} />
              <Text style={styles.preferenceText}>{t('Seguretat')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </TouchableOpacity>
        </View>

        {/* Compte */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('Compte')}</Text>

          <TouchableOpacity style={styles.preferenceItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="key-outline" size={22} color={TEXT} />
              <Text style={styles.preferenceText}>{t('Canviar contrasenya')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={MUTED} />
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          <TouchableOpacity style={styles.preferenceItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
              <Text style={[styles.preferenceText, { color: '#E74C3C' }]}>
                {t('Tancar sessió')}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerLine} />

          <TouchableOpacity style={styles.preferenceItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="trash-outline" size={22} color="#E74C3C" />
              <Text style={[styles.preferenceText, { color: '#E74C3C' }]}>
                {t('Eliminar compte')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Botó de guardar */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('Guardar canvis')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: TEXT,
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
  sectionTitle: {
    color: TEXT,
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 14,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DDD',
  },
  changePhotoBtn: {
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  changePhotoText: {
    color: CARD,
    fontWeight: '700',
    marginLeft: 6,
  },
  removePhotoBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  removePhotoText: {
    color: '#E74C3C',
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: TEXT,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E4D8C8',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  preferenceText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E4D8C8',
  },
  saveButton: {
    backgroundColor: ACCENT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: CARD,
    fontWeight: '800',
    fontSize: 16,
  },
});
