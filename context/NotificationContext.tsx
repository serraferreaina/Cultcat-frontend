import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface NotificationsContextType {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (val: boolean) => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notificationsEnabled: false, // ✅ Default false
  setNotificationsEnabled: () => {},
});

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notificationsEnabled, setNotificationsState] = useState(false); // ✅ Començar sempre desactivat

  useEffect(() => {
    (async () => {
      // Només activar si està guardat com 'true' I els permisos estan concedits
      const stored = await AsyncStorage.getItem('notificationsEnabled');

      if (stored === 'true') {
        // Verificar que els permisos del sistema encara estan actius
        const { status } = await Notifications.getPermissionsAsync();

        if (status === 'granted') {
          setNotificationsState(true);
        } else {
          // Si s'han revocat els permisos, desactivar
          setNotificationsState(false);
          await AsyncStorage.setItem('notificationsEnabled', 'false');
          await AsyncStorage.setItem('allowNotifications', 'false');
        }
      } else {
        // Si no està guardat o és false, mantenir desactivat
        setNotificationsState(false);
      }
    })();
  }, []);

  const setNotificationsEnabled = (val: boolean) => {
    setNotificationsState(val);
    // Guardar en ambdues claus per compatibilitat
    AsyncStorage.setItem('notificationsEnabled', val.toString());
    AsyncStorage.setItem('allowNotifications', val.toString());
  };

  return (
    <NotificationsContext.Provider value={{ notificationsEnabled, setNotificationsEnabled }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationsContext);
