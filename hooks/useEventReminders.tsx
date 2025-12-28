// hooks/useEventReminders.ts

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface LocalNotification {
  id: string;
  eventId: number;
  eventTitle: string;
  message: string;
  daysUntil: number;
  created_at: string;
  read: boolean;
  attendanceDate: string;
  source: 'local';
}

// Configurar com es mostren les notificacions quan l'app està oberta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useEventReminders = (
  goingEvents: Record<number, boolean>,
  attendanceDates: Record<number, string>,
) => {
  const [localNotifications, setLocalNotifications] = useState<LocalNotification[]>([]);
  const [createdReminderIds, setCreatedReminderIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar notificacions locals guardades
  useEffect(() => {
    loadData();
  }, []);

  // Comprovar esdeveniments propers només després de carregar les dades
  useEffect(() => {
    if (isLoaded) {
      checkUpcomingEvents();
    }
  }, [goingEvents, attendanceDates, isLoaded]);

  // Netejar notificacions d'esdeveniments que ja no tenen assistència
  useEffect(() => {
    if (isLoaded) {
      cleanupRemovedEvents();
    }
  }, [goingEvents, isLoaded]);

  const loadData = async () => {
    await Promise.all([loadLocalNotifications(), loadCreatedReminderIds()]);
    setIsLoaded(true);
  };

  const loadLocalNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('eventReminders');
      if (stored) {
        const notifications = JSON.parse(stored);
        // Filtrar notificacions antigues (més de 7 dies) i validar que són correctes
        const filtered = notifications.filter((n: LocalNotification) => {
          // Validar que tots els camps són del tipus correcte
          if (
            typeof n.message !== 'string' ||
            typeof n.eventTitle !== 'string' ||
            typeof n.id !== 'string' ||
            typeof n.eventId !== 'number' ||
            n.source !== 'local'
          ) {
            console.warn('Invalid notification format, skipping:', n);
            return false;
          }

          const created = new Date(n.created_at);
          const now = new Date();
          const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays < 7;
        });
        setLocalNotifications(filtered);
      }
    } catch (error) {
      console.error('Error loading local notifications:', error);
      // Si hi ha un error de parseig, netejar l'storage
      await AsyncStorage.removeItem('eventReminders');
    }
  };

  const loadCreatedReminderIds = async () => {
    try {
      const stored = await AsyncStorage.getItem('createdReminderIds');
      if (stored) {
        const ids = JSON.parse(stored);
        setCreatedReminderIds(new Set(ids));
      }
    } catch (error) {
      console.error('Error loading created reminder IDs:', error);
    }
  };

  const saveCreatedReminderIds = async (ids: Set<string>) => {
    try {
      const idsArray = Array.from(ids);
      await AsyncStorage.setItem('createdReminderIds', JSON.stringify(idsArray));
      setCreatedReminderIds(ids);
    } catch (error) {
      console.error('Error saving created reminder IDs:', error);
    }
  };

  const saveLocalNotifications = async (notifications: LocalNotification[]) => {
    try {
      await AsyncStorage.setItem('eventReminders', JSON.stringify(notifications));
      setLocalNotifications(notifications);
    } catch (error) {
      console.error('Error saving local notifications:', error);
    }
  };

  const sendPushNotification = async (notification: LocalNotification) => {
    try {
      // Comprovar si les notificacions estan activades
      const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notifEnabled !== 'true') {
        return;
      }

      // Comprovar permisos
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      // Enviar notificació push local
      await Notifications.scheduleNotificationAsync({
        content: {
          title:
            notification.daysUntil === 0
              ? '🎉 Avui és el dia!'
              : notification.daysUntil === 1
                ? '⏰ Demà tens un esdeveniment'
                : "📅 Recordatori d'esdeveniment",
          body: notification.message,
          data: {
            eventId: notification.eventId,
            notificationId: notification.id,
          },
          sound: true,
        },
        trigger: null, // Enviar immediatament
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  const cleanupRemovedEvents = async () => {
    // Trobar notificacions d'esdeveniments que ja no tenen assistència
    const toRemove = localNotifications.filter((notification) => {
      const eventId = notification.eventId;
      const isGoing = goingEvents[eventId];

      // Si l'esdeveniment ja no està marcat com "going" o no existeix, eliminar-lo
      return !isGoing;
    });

    if (toRemove.length > 0) {
      // Filtrar les notificacions que es queden
      const remaining = localNotifications.filter((n) => goingEvents[n.eventId] === true);

      await saveLocalNotifications(remaining);

      // També eliminar els IDs del registre de creats per permetre recrear-los si torna a dir que assistirà
      const removedIds = toRemove.map((n) => n.id);
      const updatedCreatedIds = new Set(
        Array.from(createdReminderIds).filter((id) => !removedIds.includes(id)),
      );

      if (updatedCreatedIds.size !== createdReminderIds.size) {
        await saveCreatedReminderIds(updatedCreatedIds);
      }
    }
  };

  const checkUpcomingEvents = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newNotifications: LocalNotification[] = [];
    const newCreatedIds = new Set(createdReminderIds);

    for (const eventId in goingEvents) {
      if (!goingEvents[eventId]) continue;

      const attendanceDate = attendanceDates[eventId];
      if (!attendanceDate) continue;

      // Parsejar la data i posar-la a les 00:00:00 per comparar només dies
      const [year, month, day] = attendanceDate.split('-').map(Number);
      const eventDate = new Date(year, month - 1, day);
      eventDate.setHours(0, 0, 0, 0);

      // Calcular dies restants (diferència en dies sencers)
      const diffTime = eventDate.getTime() - today.getTime();
      const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Crear recordatoris per 3 dies, 1 dia i el mateix dia
      const reminderDays = [3, 1, 0];

      for (const reminderDay of reminderDays) {
        if (daysUntil === reminderDay) {
          // ID únic per esdeveniment + dies restants
          const notificationId = `reminder_${eventId}_${attendanceDate}_${reminderDay}days`;

          // Comprovar si aquest recordatori ja s'ha creat alguna vegada
          if (createdReminderIds.has(notificationId)) {
            continue;
          }

          // Comprovar si ja existeix a la llista actual
          const exists = localNotifications.some((n) => n.id === notificationId);
          if (exists) {
            continue;
          }

          try {
            // Obtenir detalls de l'esdeveniment
            const response = await fetch(`http://nattech.fib.upc.edu:40490/events/${eventId}`);

            if (!response.ok) {
              console.error(`Error fetching event ${eventId}: ${response.status}`);
              continue;
            }

            const eventDetails = await response.json();

            // Assegurar que el títol és un string
            const eventTitle = String(eventDetails.titol || 'Esdeveniment sense títol');

            const message =
              daysUntil === 0
                ? `🎉 Avui és el dia! "${eventTitle}"`
                : daysUntil === 1
                  ? `⏰ Demà és l'esdeveniment: "${eventTitle}"`
                  : `📅 En ${daysUntil} dies: "${eventTitle}"`;

            const newNotification: LocalNotification = {
              id: notificationId,
              eventId: parseInt(eventId),
              eventTitle: eventTitle,
              message: message,
              daysUntil: daysUntil,
              created_at: new Date().toISOString(),
              read: false,
              attendanceDate: attendanceDate,
              source: 'local',
            };

            newNotifications.push(newNotification);

            // Enviar notificació push
            await sendPushNotification(newNotification);

            // Marcar aquest ID com a creat
            newCreatedIds.add(notificationId);
          } catch (error) {
            console.error(`Error fetching event ${eventId}:`, error);
          }
        }
      }
    }

    // Si hi ha noves notificacions, afegir-les
    if (newNotifications.length > 0) {
      const updated = [...localNotifications, ...newNotifications];
      await saveLocalNotifications(updated);

      // Guardar els IDs creats
      await saveCreatedReminderIds(newCreatedIds);
    }
  };

  const markAsRead = async (notificationId: string) => {
    const updated = localNotifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n,
    );
    await saveLocalNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = localNotifications.map((n) => ({ ...n, read: true }));
    await saveLocalNotifications(updated);
  };

  const deleteNotification = async (notificationId: string) => {
    const updated = localNotifications.filter((n) => n.id !== notificationId);
    await saveLocalNotifications(updated);
    // Nota: No eliminem l'ID de createdReminderIds perquè volem recordar que ja es va crear
  };

  const getUnreadCount = () => {
    return localNotifications.filter((n) => !n.read).length;
  };

  return {
    localNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getUnreadCount,
    refreshReminders: checkUpcomingEvents,
  };
};
