// context/RewardNotificationContext.tsx
// Context per gestionar notificacions locals de rewards

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalRewardNotification {
  id: string;
  type: 'reward';
  rewardId: number;
  rewardName: string;
  created_at: string;
  read: boolean;
  source: 'local_reward';
}

interface RewardNotificationContextType {
  localRewardNotifications: LocalRewardNotification[];
  readLocalRewards: Set<string>;
  addLocalRewardNotification: (rewardId: number, rewardName: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getUnreadCount: () => number;
  refreshNotifications: () => Promise<void>;
}

const RewardNotificationContext = createContext<RewardNotificationContextType | undefined>(
  undefined,
);

export const useRewardNotificationContext = () => {
  const context = useContext(RewardNotificationContext);
  if (!context) {
    throw new Error('useRewardNotificationContext must be used within RewardNotificationProvider');
  }
  return context;
};

interface RewardNotificationProviderProps {
  children: ReactNode;
}

export const RewardNotificationProvider: React.FC<RewardNotificationProviderProps> = ({
  children,
}) => {
  const [localRewardNotifications, setLocalRewardNotifications] = useState<
    LocalRewardNotification[]
  >([]);
  const [readLocalRewards, setReadLocalRewards] = useState<Set<string>>(new Set());

  // Carregar notificacions al iniciar
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('localRewardNotifications');
      if (stored) {
        const notifications = JSON.parse(stored);
        setLocalRewardNotifications(notifications);
      }

      const storedRead = await AsyncStorage.getItem('readLocalRewardNotifications');
      if (storedRead) {
        const readIds = JSON.parse(storedRead);
        setReadLocalRewards(new Set(readIds));
      }
    } catch (error) {}
  };

  const saveNotifications = async (notifications: LocalRewardNotification[]) => {
    try {
      await AsyncStorage.setItem('localRewardNotifications', JSON.stringify(notifications));
      setLocalRewardNotifications(notifications);
    } catch (error) {}
  };

  const saveReadNotifications = async (readIds: Set<string>) => {
    try {
      await AsyncStorage.setItem(
        'readLocalRewardNotifications',
        JSON.stringify(Array.from(readIds)),
      );
      setReadLocalRewards(readIds);
    } catch (error) {}
  };

  const addLocalRewardNotification = async (rewardId: number, rewardName: string) => {
    try {
      const newNotification: LocalRewardNotification = {
        id: `reward_${rewardId}_${Date.now()}`,
        type: 'reward',
        rewardId,
        rewardName,
        created_at: new Date().toISOString(),
        read: false,
        source: 'local_reward',
      };

      const updatedNotifications = [newNotification, ...localRewardNotifications];
      await saveNotifications(updatedNotifications);
    } catch (error) {}
  };

  const markAsRead = async (id: string) => {
    const newReadIds = new Set(readLocalRewards);
    newReadIds.add(id);
    await saveReadNotifications(newReadIds);
  };

  const markAllAsRead = async () => {
    const allIds = localRewardNotifications.map((n) => n.id);
    const newReadIds = new Set([...readLocalRewards, ...allIds]);
    await saveReadNotifications(newReadIds);
  };

  const getUnreadCount = () => {
    return localRewardNotifications.filter((n) => !readLocalRewards.has(n.id)).length;
  };

  const refreshNotifications = async () => {
    await loadNotifications();
  };

  const value: RewardNotificationContextType = {
    localRewardNotifications,
    readLocalRewards,
    addLocalRewardNotification,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    refreshNotifications,
  };

  return (
    <RewardNotificationContext.Provider value={value}>
      {children}
    </RewardNotificationContext.Provider>
  );
};
