// components/NextButton.tsx
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NextButtonProps {
  accentColor: string;
  onPress: () => void;
}

export function NextButton({ accentColor, onPress }: NextButtonProps) {
  return (
    <Pressable onPress={onPress}>
      <Ionicons name="arrow-forward-circle" size={80} color={accentColor} />
    </Pressable>
  );
}
