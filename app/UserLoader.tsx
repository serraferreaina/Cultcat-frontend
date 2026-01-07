import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api';

declare global {
  var currentUser: {
    id: number;
    username: string;
    profile_picture: string | null;
    profile_description: string;
    email?: string;
  } | null;
}

export default function UserLoader({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await api('/profile/');

        // 👇 CLAU PER ALS XATS
        await AsyncStorage.setItem('userId', data.id.toString());

        global.currentUser = {
          id: data.id ?? 0,
          username: data.username ?? '',
          profile_description: data.bio ?? '',
          email: data.email ?? '',
          profile_picture:
            data.profilePic ??
            'https://cultcat-media.s3.amazonaws.com/profile_pics/1a3c6c870f6e4105b0ef74c8659d9dc1_icon-7797704_640.png',
        };
      } catch (e) {
        console.log('Error loading user profile:', e);
      }
    };

    loadUser();
  }, []);

  return <>{children}</>;
}
