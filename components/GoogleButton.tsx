// components/GoogleButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { AntDesign } from '@expo/vector-icons';

type Props = {
  onPress: () => void;
  disabled?: boolean;
};

export default function GoogleButton({ onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.row}>
        <AntDesign name="google" size={20} />
        <Text style={styles.text}>Continuar amb Google</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#eee',
    width: '80%',
    alignItems: 'center',
  },
  disabled: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { marginLeft: 10, fontWeight: '600' },
});
