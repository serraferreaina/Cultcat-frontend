// app/changePassword.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const ChangePassword: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme === 'light' ? LightColors : DarkColors;
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePasswords = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('Error'), t('Please fill in all fields'));
      return false;
    }

    if (newPassword.length < 8) {
      Alert.alert(t('Error'), t('New password must be at least 8 characters long'));
      return false;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('Error'), t('New passwords do not match'));
      return false;
    }

    if (oldPassword === newPassword) {
      Alert.alert(t('Error'), t('New password must be different from the old password'));
      return false;
    }

    return true;
  };

  const handleChangePassword = async () => {
    if (!validatePasswords()) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        Alert.alert(t('Error'), t('No authentication token found'));
        router.replace('/(auth)/login');
        return;
      }

      const res = await fetch('http://nattech.fib.upc.edu:40490/api/auth/change-password/', {
        method: 'POST',
        headers: {
          Accept: '*/*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert(t('Success'), t('Password changed successfully!'), [
          {
            text: t('OK'),
            onPress: () => {
              setOldPassword('');
              setNewPassword('');
              setConfirmPassword('');
              router.back();
            },
          },
        ]);
      } else {
        const errorMsg =
          data.old_password?.[0] ||
          data.new_password?.[0] ||
          data.confirm_password?.[0] ||
          data.message ||
          data.detail ||
          t('Failed to change password');
        Alert.alert(t('Error'), errorMsg);
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert(t('Error'), t('An error occurred while changing password'));
    } finally {
      setLoading(false);
    }
  };

  const dynamicStyles = createDynamicStyles(colors);

  return (
    <LinearGradient
      colors={theme === 'light' ? ['#FFF8F0', '#FFEBD6'] : ['#1C1C1C', '#2C2C2C']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={[dynamicStyles.backButton, { backgroundColor: colors.card }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {t('Change Password')}
              </Text>
              <View style={{ width: 40 }} />
            </View>

            {/* Content */}
            <View style={styles.content}>
              <View style={[styles.iconContainer, { backgroundColor: `${colors.accent}20` }]}>
                <Ionicons name="lock-closed" size={48} color={colors.accent} />
              </View>

              <Text style={[styles.title, { color: colors.text }]}>
                {t('Update Your Password')}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {t('Enter your current password and choose a new secure password')}
              </Text>

              <View style={styles.formContainer}>
                {/* Old Password */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t('Current Password')}
                  </Text>
                  <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      style={[dynamicStyles.input, { color: colors.text }]}
                      placeholder={t('Enter current password')}
                      placeholderTextColor={colors.placeholder}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      secureTextEntry={!showOldPassword}
                      autoCapitalize="none"
                      textContentType="password"
                    />
                    <TouchableOpacity onPress={() => setShowOldPassword(!showOldPassword)}>
                      <Ionicons
                        name={showOldPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Password */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t('New Password')}
                  </Text>
                  <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                    <Ionicons name="key-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      style={[dynamicStyles.input, { color: colors.text }]}
                      placeholder={t('Enter new password')}
                      placeholderTextColor={colors.placeholder}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                      textContentType="newPassword"
                    />
                    <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                      <Ionicons
                        name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                    {t('Must be at least 8 characters long')}
                  </Text>
                </View>

                {/* Confirm Password */}
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {t('Confirm New Password')}
                  </Text>
                  <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={colors.placeholder}
                    />
                    <TextInput
                      style={[dynamicStyles.input, { color: colors.text }]}
                      placeholder={t('Confirm new password')}
                      placeholderTextColor={colors.placeholder}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      textContentType="newPassword"
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={colors.placeholder}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    dynamicStyles.submitButton,
                    { backgroundColor: colors.accent },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleChangePassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.submitButtonText}>{t('Update Password')}</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Security Tips */}
              <View style={[styles.tipsContainer, { backgroundColor: colors.card }]}>
                <View style={styles.tipRow}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {t('Use a mix of letters, numbers, and symbols')}
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {t('Avoid using personal information')}
                  </Text>
                </View>
                <View style={styles.tipRow}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.accent} />
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    {t("Don't reuse passwords from other accounts")}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const createDynamicStyles = (colors: any) =>
  StyleSheet.create({
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    input: {
      flex: 1,
      fontSize: 16,
      marginLeft: 12,
      fontWeight: '500',
    },
    submitButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
  });

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  tipsContainer: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

export default ChangePassword;
