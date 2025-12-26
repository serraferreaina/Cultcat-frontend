// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const Login: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = theme === 'light' ? LightColors : DarkColors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState<'signin' | 'signup' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');

  // Estado para el modal de verificación
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // Estado para notificación de logout
  const [showLogoutNotification, setShowLogoutNotification] = useState(false);

  // Check for logout notification
  useEffect(() => {
    const checkLogoutStatus = async () => {
      const loggedOut = await AsyncStorage.getItem('justLoggedOut');
      if (loggedOut === 'true') {
        setShowLogoutNotification(true);
        await AsyncStorage.removeItem('justLoggedOut');
        // Auto-hide after 3 seconds
        setTimeout(() => setShowLogoutNotification(false), 3000);
      }
    };
    checkLogoutStatus();
  }, []);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '883633704420-rbd97nlhmkna7mqjklr0bh3h295etjrj.apps.googleusercontent.com',
    iosClientId: '883633704420-ur84mk8aov2rbhgqlbvim1747mh6s2ud.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile'],
  });

  const router = useRouter();

  // ANIMACIÓ ENTRADA
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // MANEIG RESPONSE GOOGLE
  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      console.log('🪪 ID TOKEN REBUT:', idToken);

      if (!idToken) {
        Alert.alert(t('Error'), t('Google authentication failed'));
        return;
      }

      handleGoogleAuth(idToken);
    } else if (response?.type === 'error') {
      console.log('❌ GOOGLE AUTH ERROR:', response.error);
    }
  }, [response]);

  const handleGoogleAuth = async (googleToken: string) => {
    await AsyncStorage.multiRemove(['authToken', 'refreshToken', 'isLoggedIn']);
    try {
      const res = await fetch('http://nattech.fib.upc.edu:40490/api/auth/google/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_token: googleToken }),
      });

      const data = await res.json();
      console.log('BACKEND RESPONSE:', data);

      if (res.ok && data.access) {
        await AsyncStorage.setItem('authToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // Console log dels tokens
        console.log('🔑 ACCESS TOKEN (Google):', data.access);
        console.log('🔄 REFRESH TOKEN (Google):', data.refresh);

        router.replace('/(tabs)');
      } else {
        Alert.alert(t('Error'), t('Google authentication failed'));
      }
    } catch (err) {
      console.error(err);
      Alert.alert(t('Error'), t('Network error'));
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading('signin');
    try {
      await promptAsync({ showInRecents: true });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert(t('Error'), t('Failed to initiate Google Sign-In'));
      setGoogleLoading(null);
    }
  };

  const handleManualLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('Error'), t('Please fill in all fields'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://nattech.fib.upc.edu:40490/api/auth/login/', {
        method: 'POST',
        headers: { Accept: '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email.toLowerCase().trim(),
          password,
        }),
      });
      const data = await res.json();
      if (res.ok && data.access) {
        await AsyncStorage.setItem('authToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);
        await AsyncStorage.setItem('isLoggedIn', 'true');

        // Console log dels tokens
        console.log('🔑 ACCESS TOKEN:', data.access);
        console.log('🔄 REFRESH TOKEN:', data.refresh);

        // Redirigir a tabs
        router.replace('/(tabs)');
      } else {
        Alert.alert(t('Error'), data.message || data.detail || t('Invalid credentials'));
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(t('Error'), t('An error occurred during login'));
    } finally {
      setLoading(false);
    }
  };

  const handleManualRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert(t('Error'), t('Please fill in all fields'));
      return;
    }

    if (password.length < 8) {
      Alert.alert(t('Error'), t('Password must be at least 8 characters long'));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://nattech.fib.upc.edu:40490/api/auth/register/', {
        method: 'POST',
        headers: { Accept: '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          email: email.toLowerCase().trim(),
          password,
        }),
      });
      const data = await res.json();

      // Si el registro es exitoso y devuelve el mensaje de verificación
      if (res.status === 201 && data.detail === 'Verification email sent') {
        setVerificationEmail(email.toLowerCase().trim());
        setShowVerificationModal(true);
      } else if (res.ok && data.access) {
        // Si el backend devuelve tokens directamente (sin verificación)
        await AsyncStorage.setItem('authToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);

        // Console log dels tokens
        console.log('🔑 ACCESS TOKEN (Register):', data.access);
        console.log('🔄 REFRESH TOKEN (Register):', data.refresh);

        router.replace('/(tabs)');
      } else {
        const errorMsg =
          data.username?.[0] ||
          data.email?.[0] ||
          data.password?.[0] ||
          data.message ||
          data.detail ||
          t('Registration failed');
        Alert.alert(t('Error'), errorMsg);
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert(t('Error'), t('An error occurred during registration'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationModalClose = () => {
    setShowVerificationModal(false);
    setIsRegisterMode(false);
    setUsername('');
    setEmail('');
    setPassword('');
  };

  const dynamicStyles = createDynamicStyles(colors);

  return (
    <LinearGradient
      colors={theme === 'light' ? ['#FFF8F0', '#FFEBD6'] : ['#1C1C1C', '#2C2C2C']}
      style={styles.gradient}
    >
      {/* Logout Notification */}
      {showLogoutNotification && (
        <Animated.View
          style={[
            styles.notification,
            {
              backgroundColor: colors.accent,
              opacity: fadeAnim,
            },
          ]}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.notificationText}>
            {t('You have successfully logged out. See you soon!')}
          </Text>
        </Animated.View>
      )}

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
            <View style={[styles.circleTop, { backgroundColor: `${colors.accent}15` }]} />
            <View style={[styles.circleBottom, { backgroundColor: `${colors.accent}10` }]} />

            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <View style={styles.logoSection}>
                <Image
                  source={require('../../assets/cultcat-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={[styles.title, { color: colors.text }]}>
                  {isRegisterMode ? t('Create Account') : t('Welcome Back')}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isRegisterMode
                    ? t('Join us and start your cultural journey')
                    : t('Sign in to continue your cultural journey')}
                </Text>
              </View>

              <View style={styles.formContainer}>
                {isRegisterMode && (
                  <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                    <Ionicons name="person-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      style={[dynamicStyles.input, { color: colors.text }]}
                      placeholder={t('Username')}
                      placeholderTextColor={colors.placeholder}
                      value={username}
                      onChangeText={setUsername}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                )}

                <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.placeholder} />
                  <TextInput
                    style={[dynamicStyles.input, { color: colors.text }]}
                    placeholder={isRegisterMode ? t('Email') : t('Email or Username')}
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="emailAddress"
                  />
                </View>

                <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.placeholder} />
                  <TextInput
                    style={[dynamicStyles.input, { color: colors.text }]}
                    placeholder={t('Password')}
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    textContentType="password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.placeholder}
                    />
                  </TouchableOpacity>
                </View>

                {!isRegisterMode && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => router.push('/changePassword')}
                  >
                    <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
                      {t('Change password')}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    dynamicStyles.loginButton,
                    { backgroundColor: colors.accent },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={isRegisterMode ? handleManualRegister : handleManualLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>
                      {isRegisterMode ? t('Create Account') : t('Sign In')}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchModeButton}
                  onPress={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setUsername('');
                    setEmail('');
                    setPassword('');
                  }}
                >
                  <Text style={[styles.switchModeText, { color: colors.textSecondary }]}>
                    {isRegisterMode ? t('Already have an account? ') : t("Don't have an account? ")}
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>
                      {isRegisterMode ? t('Sign In') : t('Sign Up')}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                  {t('or continue with')}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.googleButtonsContainer}>
                <TouchableOpacity
                  style={[
                    dynamicStyles.googleButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                  ]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.7}
                >
                  <Image
                    source={require('../../assets/googleLogo.png')}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={[styles.googleButtonText, { color: colors.text }]}>
                    {t('Sign In with Google')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  {t('By continuing, you agree to our')}{' '}
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>
                    {t('Terms of Service')}
                  </Text>{' '}
                  {t('and')}{' '}
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>
                    {t('Privacy Policy')}
                  </Text>
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Verificación de Email */}
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={handleVerificationModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIconContainer, { backgroundColor: `${colors.accent}20` }]}>
              <Ionicons name="mail-outline" size={60} color={colors.accent} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('Verify Your Email')}
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              {t("We've sent a verification link to:")}
            </Text>

            <Text style={[styles.modalEmail, { color: colors.accent }]}>{verificationEmail}</Text>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              {t(
                'Please check your inbox and click the verification link to activate your account.',
              )}
            </Text>

            <View style={[styles.modalInfoBox, { backgroundColor: `${colors.accent}10` }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
              <Text style={[styles.modalInfoText, { color: colors.textSecondary }]}>
                {t("You won't be able to sign in until you verify your email address.")}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.accent }]}
              onPress={handleVerificationModalClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>{t('Got it!')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={handleVerificationModalClose}
            >
              <Text style={[styles.modalSecondaryButtonText, { color: colors.accent }]}>
                {t("Didn't receive the email? Check spam folder")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const createDynamicStyles = (colors: any) =>
  StyleSheet.create({
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1.5,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    input: { flex: 1, fontSize: 16, marginLeft: 12, fontWeight: '500' },
    loginButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    googleButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1.5,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  });

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1, minHeight: height },
  circleTop: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  circleBottom: {
    position: 'absolute',
    bottom: -120,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    zIndex: 1,
    justifyContent: 'space-between',
  },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 120, height: 120, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: '700', marginBottom: 8, letterSpacing: 0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  formContainer: { width: '100%', marginBottom: 24 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { fontSize: 14, fontWeight: '600' },
  loginButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  buttonDisabled: { opacity: 0.5 },
  switchModeButton: { alignItems: 'center', marginTop: 16 },
  switchModeText: { fontSize: 14, fontWeight: '500' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, marginHorizontal: 16, fontWeight: '500' },
  googleButtonsContainer: { flexDirection: 'row', marginBottom: 24 },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 16 },
  footerText: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },

  // Notification bar
  notification: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 10,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalEmail: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  modalInfoText: {
    flex: 1,
    fontSize: 13,
    marginLeft: 12,
    lineHeight: 18,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  modalSecondaryButton: {
    paddingVertical: 8,
  },
  modalSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Login;
