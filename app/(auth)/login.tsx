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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { LightColors, DarkColors } from '../../theme/colors';
import { Ionicons } from '@expo/vector-icons';
//import { makeRedirectUri } from 'expo-auth-session';

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
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    console.log('GOOGLE REQUEST >>>', request);
    if (request?.redirectUri) {
      console.log('🚀 REDIRECT URI UTILITZAT:', request.redirectUri);
    }
  }, [request]);

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
      const { authentication } = response;
      if (authentication?.accessToken) {
        handleGoogleAuth(authentication.accessToken);
      } else {
        Alert.alert('Google Sign-In', 'No access token returned by Google.');
        setGoogleLoading(null);
      }
    } else if (response?.type && response.type !== 'success') {
      setGoogleLoading(null);
    }
  }, [response]);

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
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        Alert.alert('Success', 'Logged in successfully!');
      } else {
        Alert.alert('Error', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (googleToken: string) => {
    try {
      const res = await fetch('http://nattech.fib.upc.edu:40490/api/auth/google/token/', {
        method: 'POST',
        headers: { Accept: '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ google_token: googleToken }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await AsyncStorage.setItem('authToken', data.token);
        Alert.alert('Success', 'Authentication successful!');
      } else {
        Alert.alert('Error', data.message || 'Google authentication failed');
      }
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Error', 'An error occurred during authentication');
    } finally {
      setGoogleLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading('signin');
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', 'Failed to initiate Google Sign-In');
      setGoogleLoading(null);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading('signup');
    try {
      await promptAsync();
    } catch (error) {
      console.error('Google Sign-Up error:', error);
      Alert.alert('Error', 'Failed to initiate Google Sign-Up');
      setGoogleLoading(null);
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
                <Text style={[styles.title, { color: colors.text }]}>Welcome Back</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Sign in to continue your cultural journey
                </Text>
              </View>

              <View style={styles.formContainer}>
                <View style={[dynamicStyles.inputContainer, { borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={20} color={colors.placeholder} />
                  <TextInput
                    style={[dynamicStyles.input, { color: colors.text }]}
                    placeholder="Email"
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

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => Alert.alert('Reset password', 'Implement forgot password flow')}
                >
                  <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    dynamicStyles.loginButton,
                    { backgroundColor: colors.accent },
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleManualLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
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
                    (googleLoading === 'signup' || !request) && styles.buttonDisabled,
                  ]}
                  onPress={handleGoogleSignUp}
                  disabled={googleLoading !== null || !request}
                  activeOpacity={0.7}
                >
                  {googleLoading === 'signup' ? (
                    <ActivityIndicator color={colors.accent} size="small" />
                  ) : (
                    <>
                      <Image
                        source={require('../../assets/googleLogo.png')}
                        style={styles.googleIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.googleButtonText, { color: colors.text }]}>
                        Create Account
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    dynamicStyles.googleButton,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    (googleLoading === 'signin' || !request) && styles.buttonDisabled,
                  ]}
                  onPress={handleGoogleSignIn}
                  disabled={googleLoading !== null || !request}
                  activeOpacity={0.7}
                >
                  {googleLoading === 'signin' ? (
                    <ActivityIndicator color={colors.accent} size="small" />
                  ) : (
                    <>
                      <Image
                        source={require('../../assets/googleLogo.png')}
                        style={styles.googleIcon}
                        resizeMode="contain"
                      />
                      <Text style={[styles.googleButtonText, { color: colors.text }]}>Sign In</Text>
                    </>
                  )}
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
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 28 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, marginHorizontal: 16, fontWeight: '500' },
  googleButtonsContainer: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { fontSize: 15, fontWeight: '600' },
  footer: { alignItems: 'center', marginTop: 16 },
  footerText: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 },
});

export default Login;
