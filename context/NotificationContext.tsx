import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationsContextType {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notificationsEnabled: true,
  setNotificationsEnabled: () => {},
});

export const NotificationsProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notificationsEnabled, setNotificationsState] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('notificationsEnabled');
      if (stored !== null) setNotificationsState(stored === 'true');
    })();
  }, []);

  const setNotificationsEnabled = (val: boolean) => {
    setNotificationsState(val);
    AsyncStorage.setItem('notificationsEnabled', val.toString());
  };

  return (
    <NotificationsContext.Provider value={{ notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);