import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import axios from 'axios';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

const BACKEND_LOGIN_URL = 'http://nattech.fib.upc.edu:40490/auth/google/';

const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

export default function LoginScreen() {
  const router = useRouter();

  // **NO USES useProxy → S'HA ELIMINAT**
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri: AuthSession.makeRedirectUri(), // correcte per a Expo Go
      scopes: ['openid', 'profile', 'email'],
      responseType: 'id_token',
    },
    {
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    },
  );

  useEffect(() => {
    const handleResponse = async () => {
      if (response?.type === 'success') {
        const idToken = response.params.id_token;

        try {
          const backendResp = await axios.post(
            BACKEND_LOGIN_URL,
            { id_token: idToken },
            { headers: { 'Content-Type': 'application/json' } },
          );

          global.authToken = backendResp.data.token;
          router.replace('/(tabs)');
        } catch (e) {
          console.error('Backend auth error:', e);
        }
      }
    };

    handleResponse();
  }, [response]);

  return (
    <View style={styles.container}>
      <Text style={styles.brandTop}>CultCat.</Text>
      <Text style={styles.title}>Inicia sessió</Text>

      <TouchableOpacity style={styles.btn} disabled={!request} onPress={() => promptAsync()}>
        <Text style={styles.btnText}>Google Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  brandTop: { fontSize: 50, fontWeight: '900', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30 },
  btn: { backgroundColor: '#4285F4', padding: 15, borderRadius: 8 },
  btnText: { color: 'white', fontWeight: 'bold' },
});
