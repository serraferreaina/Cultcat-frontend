// components/GoogleButton.tsx
import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';

export default function GoogleButton() {
  return (
    <TouchableOpacity style={styles.button}>
      <Image source={require('../assets/googleLogo.png')} style={styles.icon} />
      <Text style={styles.text}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  text: {
    fontSize: 20,
    color: '#000',
    fontWeight: '500',
  },
});
