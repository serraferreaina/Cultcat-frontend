import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: React.ReactNode;
}

export default function DevAuthWrapper({ children }: Props) {
  const DEV_TOKEN = process.env.EXPO_PUBLIC_DEV_TOKEN;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadDevToken = async () => {
      if (__DEV__ && DEV_TOKEN) {
        await AsyncStorage.setItem('authToken', DEV_TOKEN);
        console.log('DEV TOKEN LOADED:', DEV_TOKEN);
      }
      setReady(true);
    };

    loadDevToken();
  }, []);

  if (!ready) return null; // ⛔ bloqueja render

  return <>{children}</>;
}
