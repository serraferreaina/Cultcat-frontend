// hooks/useRewardNotifications.ts
// Hook per fer polling de noves insígnies i enviar notificacions push
// Versió que comprova directament les badges de l'usuari

import { useEffect, useRef } from 'react';
import { getUserBadges } from '../api';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

interface RewardDetails {
  reward_id: number;
  name: string;
  category: string;
  level: number;
  level_label: string;
  condition_type: string;
  condition_value: number;
  icon: string;
  obtained_at: string;
}

export const useRewardNotifications = () => {
  const lastCheckedRewardsRef = useRef<Set<number>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const checkForNewRewards = async () => {
    try {
      // Comprovar si les notificacions estan habilitades
      const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notifEnabled !== 'true') {
        return;
      }

      // Comprovar permisos
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Obtenir insígnies de l'usuari directament
      const badges: RewardDetails[] = await getUserBadges();

      const currentRewardIds = new Set<number>(badges.map((badge) => badge.reward_id));

      // Si és la primera vegada, només guardem les IDs
      if (lastCheckedRewardsRef.current.size === 0) {
        lastCheckedRewardsRef.current = currentRewardIds;
        return;
      }

      // Trobar insígnies noves
      const newRewardIds = Array.from(currentRewardIds).filter(
        (id) => !lastCheckedRewardsRef.current.has(id),
      );

      if (newRewardIds.length > 0) {
        // Trobar els detalls de les noves insígnies
        const newBadges = badges.filter((badge) => newRewardIds.includes(badge.reward_id));

        // Enviar notificació per cada insígnia nova
        for (const badge of newBadges) {
          await sendRewardNotification(badge);
        }
      } else {
      }

      // Actualitzar la referència
      lastCheckedRewardsRef.current = currentRewardIds;
    } catch (error) {
      console.error('❌ Error checking for new rewards:', error);
    }
  };

  const sendRewardNotification = async (reward: RewardDetails) => {
    try {
      // Afegir notificació local per mostrar-la a la llista
      if ((global as any).addLocalRewardNotification) {
        await (global as any).addLocalRewardNotification(
          reward.reward_id,
          reward.name,
          reward.icon,
        );
      }

      // Enviar notificació push
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🏆 Nova insígnia desblocada!',
          body: `Felicitats! Has aconseguit: ${reward.name}`,
          data: {
            type: 'reward',
            rewardId: reward.reward_id,
            rewardName: reward.name,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending reward notification:', error);
    }
  };

  const startPolling = () => {
    // Comprovar immediatament
    checkForNewRewards();

    // Establir polling cada 30 segons per millorar la detecció
    pollingIntervalRef.current = setInterval(() => {
      // Només fer polling si l'app està en primer pla
      if (appStateRef.current === 'active') {
        checkForNewRewards();
      }
    }, 30000); // 30 segons
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  useEffect(() => {
    // Gestionar canvis d'estat de l'app
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appStateRef.current = nextAppState;

      if (nextAppState === 'active') {
        // Quan l'app torna al primer pla, comprovar immediatament
        checkForNewRewards();
      }
    });

    // Iniciar polling
    startPolling();

    // Cleanup
    return () => {
      stopPolling();
      subscription.remove();
    };
  }, []);

  return {
    checkForNewRewards,
    forceCheck: () => {
      checkForNewRewards();
    },
  };
};
