import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function Login() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to CultCat</Text>
      <Image
        source={require('../../assets/cultcat-logo.png')} // placeholder logo
        style={styles.logo}
      />
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Login with Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40 },
  logo: { width: 120, height: 120, marginBottom: 40 },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
    marginBottom: 15,
  },
  secondary: { backgroundColor: '#34A853' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
