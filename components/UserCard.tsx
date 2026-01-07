// components/UserCard.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface UserCardProps {
  user: {
    username: string;
    profilePic: string;
    bio: string;
  };
  onPress?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onPress }) => {
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const DEFAULT_AVATAR =
    'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: Colors.card, borderBottomColor: Colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: user.profilePic || DEFAULT_AVATAR }}
        style={[styles.avatar, { borderColor: Colors.border }]}
      />
      <View style={styles.info}>
        <Text style={[styles.username, { color: Colors.text }]} numberOfLines={1}>
          {user.username}
        </Text>
        {!!user.bio && (
          <Text style={[styles.bio, { color: Colors.textSecondary }]} numberOfLines={2}>
            {user.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#DDD',
    borderWidth: 2,
  },
  info: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
  },
});
