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
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { useNotifications } from '../context/NotificationContext';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteAccount, logout } from '../api';
import * as WebBrowser from 'expo-web-browser';

const RED = '#E74C3C';

export default function UserConfig() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();
  const DEFAULT_AVATAR =
    'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png';

  const [username, setUsername] = useState(global.currentUser?.username ?? '');
  const [description, setDescription] = useState(global.currentUser?.profile_description ?? '');
  const [email, setEmail] = useState(global.currentUser?.email ?? '');
  const [avatar, setAvatar] = useState(global.currentUser?.profile_picture ?? DEFAULT_AVATAR);
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeletePhotoModal, setShowDeletePhotoModal] = useState(false);

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      // 2. Construir FormData
      let formData = new FormData();
      formData.append('id', global.currentUser?.id?.toString() ?? '0');
      formData.append('username', username);
      formData.append('email', email);
      formData.append('bio', description);

      if (!avatar.startsWith('http')) {
        formData.append('profilePic', {
          uri: avatar,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      } else {
        formData.append('profilePic', avatar);
      }

      const res = await fetch('http://nattech.fib.upc.edu:40490/profile/edit/', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`, // <--- nuevo formato JWT
        },
        body: formData,
      });

      const data = await res.json();

      // 3. Actualizar usuario global
      global.currentUser = {
        id: data.id ?? global.currentUser?.id ?? 0,
        username: data.username ?? username,
        email: data.email ?? email,
        profile_picture: data.profilePic ?? avatar,
        profile_description: data.bio ?? description,
      };

      await AsyncStorage.setItem('justSavedProfile', 'true');
      router.back();
    } catch (err) {
      console.error('Error actualizando perfil:', err);
      alert('Error al actualizar perfil');
    }
  };

  const updateProfilePicture = async (imageUri: string) => {
    try {
      let formData = new FormData();
      formData.append('id', global.currentUser?.id?.toString() ?? '0');
      formData.append('username', username);
      formData.append('email', email);
      formData.append('bio', description);

      if (!imageUri.startsWith('http')) {
        formData.append('profilePic', {
          uri: imageUri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);
      } else {
        formData.append('profilePic', imageUri);
      }

      const token = await AsyncStorage.getItem('authToken');

      const res = await fetch('http://nattech.fib.upc.edu:40490/profile/edit/', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      // Actualizamos global.currentUser con todos los datos
      global.currentUser = {
        id: data.id ?? global.currentUser?.id ?? 0,
        username: data.username ?? username,
        email: data.email ?? email,
        profile_picture: data.profilePic ?? imageUri,
        profile_description: data.bio ?? description,
      };

      setAvatar(global.currentUser.profile_picture || DEFAULT_AVATAR);
      setUsername(global.currentUser.username);
      setDescription(global.currentUser.profile_description);
      setEmail(global.currentUser.email || '');
    } catch (err) {
      console.error('Error updating avatar:', err);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setAvatar(uri);
      updateProfilePicture(uri);
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      await AsyncStorage.setItem('justLoggedOut', 'true');
      router.replace('(auth)/login');
    } catch (e) {
      console.error(e);
      Alert.alert(t('Error logging out'));
    }
  };

  const handleDeleteAcc = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await deleteAccount();
      await AsyncStorage.setItem('justDeleted', 'true');
      router.replace('(auth)/login');
    } catch (e) {
      console.error(e);
      Alert.alert(t('Error deleting account'));
    }
  };

  const handleDeletePhotoPress = () => {
    setShowDeletePhotoModal(true);
  };

  const confirmDeletePhoto = async () => {
    setShowDeletePhotoModal(false);
    setAvatar(DEFAULT_AVATAR);

    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      updateProfilePicture(DEFAULT_AVATAR);
    }
  };

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>{t('Configuració')}</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Foto de perfil')}</Text>
          <View style={styles.avatarSection}>
            <Image source={{ uri: avatar }} style={styles.avatarLarge} />
            <View style={{ flex: 1, marginLeft: 16 }}>
              <TouchableOpacity
                style={[styles.changePhotoBtn, { backgroundColor: colors.accent }]}
                onPress={pickImage}
              >
                <Ionicons name="camera-outline" size={20} color={colors.card} />
                <Text style={[styles.changePhotoText, { color: colors.card }]}>
                  {t('Canviar foto')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.removePhotoBtn, { backgroundColor: colors.background }]}
                onPress={handleDeletePhotoPress}
              >
                <Text style={[styles.removePhotoText, { color: colors.accent }]}>
                  {t('Eliminar foto')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('Personal information')}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('User name')}</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder={t('Introduce your user name') || "Introdueix el teu nom d'usuari"}
              placeholderTextColor={colors.placeholder}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('Description')}</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('Write a short description') || 'Escriu una breu descripció'}
              placeholderTextColor={colors.placeholder}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>{t('Email')}</Text>
            <View
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  opacity: 0.7,
                },
              ]}
            >
              <Text style={[{ color: colors.text, fontSize: 15 }]}>
                {email || 'correu@exemple.com'}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Preferences')}</Text>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() =>
              WebBrowser.openBrowserAsync(
                'https://www.privacypolicies.com/live/2089d660-61b9-4d0c-a4f3-4231974ef74e',
              )
            }
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="document-text-outline" size={22} color={colors.text} />
              <Text style={[styles.preferenceText, { color: colors.text }]}>
                {t('Privacy policy')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => router.push('/SetupScreen')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="heart-outline" size={22} color={colors.text} />
              <Text style={[styles.preferenceText, { color: colors.text }]}>
                {t('Config preferences')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('Account')}</Text>

          <TouchableOpacity
            style={styles.preferenceItem}
            onPress={() => router.push('/changePassword')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="key-outline" size={22} color={colors.text} />
              <Text style={[styles.preferenceText, { color: colors.text }]}>
                {t('Change password')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.preferenceItem} onPress={handleLogout}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="log-out-outline" size={22} color={RED} />
              <Text style={[styles.preferenceText, { color: RED }]}>{t('Close session')}</Text>
            </View>
          </TouchableOpacity>

          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.preferenceItem} onPress={handleDeleteAcc}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="trash-outline" size={22} color={RED} />
              <Text style={[styles.preferenceText, { color: RED }]}>{t('Delete account')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSave}
        >
          <Text style={[styles.saveButtonText, { color: colors.card }]}>{t('Save changes')}</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Custom Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="log-out-outline" size={48} color={colors.accent} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('Close session')}</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              {t('Are you sure you want to log out?')}
              {'\n\n'}
              {t('You will need to log in again to access your account.')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.accent }]}>
                  {t('Cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.logoutButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={confirmLogout}
              >
                <Text style={[styles.logoutButtonText, { color: colors.card }]}>
                  {t('Close session')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Photo Modal */}
      <Modal visible={showDeletePhotoModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${colors.accent}15` }]}>
              <Ionicons name="trash-outline" size={48} color={colors.accent} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('Delete photo')}</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              {t('Are you sure you want to delete your photo?')}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowDeletePhotoModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.accent }]}>
                  {t('Cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.logoutButton,
                  { backgroundColor: colors.accent },
                ]}
                onPress={confirmDeletePhoto}
              >
                <Text style={[styles.logoutButtonText, { color: colors.card }]}>
                  {t('Delete')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Account Modal */}
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.backdrop }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${RED}15` }]}>
              <Ionicons name="trash-outline" size={48} color={RED} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('Delete account')}</Text>
            <Text style={[styles.modalMessage, { color: colors.text }]}>
              {t('Are you sure you want to delete your account?')}
              {'\n\n'}
              <Text style={{ fontWeight: '600', color: RED }}>
                {t('This action cannot be undone')}
              </Text>
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={[styles.cancelButtonText, { color: colors.accent }]}>
                  {t('Cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton, { backgroundColor: RED }]}
                onPress={confirmDeleteAccount}
              >
                <Text style={[styles.deleteButtonText, { color: '#FFF' }]}>
                  {t('Delete account')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  sectionTitle: {
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  changePhotoText: {
    fontWeight: '700',
    marginLeft: 6,
  },
  removePhotoBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  removePhotoText: {
    fontWeight: '600',
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '500',
    marginLeft: 12,
  },
  dividerLine: {
    height: 1,
  },
  saveButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
