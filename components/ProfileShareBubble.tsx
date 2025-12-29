// components/ProfileShareBubble.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';

interface ProfileShareBubbleProps {
  data: {
    userId: number;
    username: string;
    profilePicture: string;
    description?: string | null;
    userMessage?: string | null;
  };
  sender: 'me' | 'other';
}

export default function ProfileShareBubble({ data, sender }: ProfileShareBubbleProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;

  const isMine = sender === 'me';

  const [profileData, setProfileData] = useState({
    username: data.username || 'Carregant...',
    profilePicture: data.profilePicture,
    description: data.description,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserProfile() {
      try {
        const response = await fetch(`http://nattech.fib.upc.edu:40490/users/${data.userId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }

        const userData = await response.json();

        setProfileData({
          username: userData.username,
          profilePicture: userData.profilePic || data.profilePicture,
          description: userData.bio || null,
        });
      } catch (error) {
        console.error('❌ Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [data.userId]);

  return (
    <View style={styles.wrapper}>
      {/* Card del perfil */}
      <TouchableOpacity
        style={[styles.profileCard, isMine && styles.myProfileCard]}
        onPress={() => router.push(`/user/${data.userId}`)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: profileData.profilePicture }} style={styles.avatar} />

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#d87c3a" />
          </View>
        ) : (
          <View style={styles.textContainer}>
            <Text style={styles.username} numberOfLines={1}>
              {profileData.username}
            </Text>

            <Text style={styles.description} numberOfLines={2}>
              {profileData.description || 'Sense descripció'}
            </Text>
          </View>
        )}

        <Ionicons name="chevron-forward" size={18} color="#999" />
      </TouchableOpacity>

      {/* Missatge opcional com ChatBubble normal */}
      {data.userMessage ? (
        <View style={[styles.messageContainer, isMine && styles.myMessageContainer]}>
          <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
            <Text style={[styles.messageText, { color: isMine ? '#fff' : '#000' }]}>
              {data.userMessage}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    minHeight: 70,
    marginHorizontal: 16,
    maxWidth: '70%',
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  myProfileCard: {
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ddd',
  },
  loadingContainer: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  messageContainer: {
    marginTop: 4,
    paddingHorizontal: 16,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    maxWidth: '70%',
  },
  myBubble: {
    backgroundColor: '#007AFF',
  },
  otherBubble: {
    backgroundColor: '#E8E8E8',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 19,
  },
});
