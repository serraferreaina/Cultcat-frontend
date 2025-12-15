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

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const Login: React.FC = () => {
  const { theme } = useTheme();
  const colors = theme === 'light' ? LightColors : DarkColors;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState<'signin' | 'signup' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: '883633704420-rbd97nlhmkna7mqjklr0bh3h295etjrj.apps.googleusercontent.com',
    iosClientId: '883633704420-ur84mk8aov2rbhgqlbvim1747mh6s2ud.apps.googleusercontent.com',
    scopes: ['openid', 'email', 'profile'],
  });

  const router = useRouter();

  /*useEffect(() => {
    console.log('GOOGLE REQUEST >>>', request);
    if (request?.redirectUri) {
      console.log('🚀 REDIRECT URI UTILITZAT:', request.redirectUri);
    }
  }, [request]);*/

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
        Alert.alert('Error', 'Google no ha retornat cap ID Token');
        return;
      }

      handleGoogleAuth(idToken);
    } else if (response?.type === 'error') {
      console.log('❌ GOOGLE AUTH ERROR:', response.error);
    }
  }, [response]);



  const handleGoogleAuth = async (googleToken: string) => {
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
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Google authentication failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network error');
    }
  };
  
 const handleGoogleSignIn = async () => {
    setGoogleLoading('signin');
    try {
      await promptAsync({ showInRecents: true });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to initiate Google Sign-In');
      setGoogleLoading(null);
    }
  };


  const handleManualLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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

        // Redirigir a tabs
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', data.message || data.detail || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleManualRegister = async () => {
    if (!username || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
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
      if (res.ok && data.access) {
        await AsyncStorage.setItem('authToken', data.access);
        await AsyncStorage.setItem('refreshToken', data.refresh);

        // Redirigir a tabs
        router.replace('/(tabs)');
      } else {
        const errorMsg =
          data.username?.[0] ||
          data.email?.[0] ||
          data.password?.[0] ||
          data.message ||
          data.detail ||
          'Registration failed';
        Alert.alert('Error', errorMsg);
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Error', 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDisclaimer = () => {
    setShowGoogleDisclaimerModal(true);
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
                  {isRegisterMode ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {isRegisterMode
                    ? 'Join us and start your cultural journey'
                    : 'Sign in to continue your cultural journey'}
                </Text>
              </View>

              <View style={styles.formContainer}>
                {isRegisterMode && (
                  <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                    <Ionicons name="person-outline" size={20} color={colors.placeholder} />
                    <TextInput
                      style={[dynamicStyles.input, { color: colors.text }]}
                      placeholder="Username"
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
                    placeholder={isRegisterMode ? 'Email' : 'Email or Username'}
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
                    placeholder="Password"
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
                      Change Password
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
                      {isRegisterMode ? 'Create Account' : 'Sign In'}
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
                    {isRegisterMode ? 'Already have an account? ' : "Don't have an account? "}
                    <Text style={{ color: colors.accent, fontWeight: '700' }}>
                      {isRegisterMode ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
                  or continue with
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
                    Sign In with Google
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  By continuing, you agree to our{' '}
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>Terms of Service</Text>{' '}
                  and{' '}
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>Privacy Policy</Text>
                </Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
});

export default Login;
