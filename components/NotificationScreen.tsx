// components/NotificationScreen.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { api } from '../api';
import { useEventStatus } from '../context/EventStatus';
import { useEventReminders, LocalNotification as LocalNotificationType } from '../hooks/useEventReminders';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

interface BackendNotification {
  id: number;
  type: string;
  reference_id: number;
  payload: string;
  created_at: string;
  read: boolean;
  source: 'backend';
}

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

type CombinedNotification = BackendNotification | LocalNotificationType;

interface NotificationsScreenProps {
  visible: boolean;
  onClose: () => void;
  onNotificationCountChange: (count: number) => void;
}

const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  visible,
  onClose,
  onNotificationCountChange,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const { goingEvents, attendanceDates } = useEventStatus();
  const {
    localNotifications,
    markAsRead: markLocalAsRead,
    markAllAsRead: markAllLocalAsRead,
    deleteNotification,
    getUnreadCount,
    refreshReminders,
  } = useEventReminders(goingEvents, attendanceDates);

  const [backendNotifications, setBackendNotifications] = useState<BackendNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardDetailsCache, setRewardDetailsCache] = useState<Record<number, RewardDetails>>({});
  const [readNotifications, setReadNotifications] = useState<Set<number>>(new Set());
  const previousNotificationCountRef = useRef<number>(0);

  const fetchBackendNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/notifications/');
      const withSource = data.map((n: any) => ({ ...n, source: 'backend' as const }));
      setBackendNotifications(withSource);
      
      // Netejar notificacions llegides que ja no existeixen al backend
      const backendIds = new Set(data.map((n: any) => n.id));
      const updatedReadIds = new Set(
        Array.from(readNotifications).filter(id => backendIds.has(id))
      );
      
      // Si hi ha hagut canvis, actualitzar el cache
      if (updatedReadIds.size !== readNotifications.size) {
        await saveReadNotifications(updatedReadIds);
      }
      
      // Carregar detalls de rewards
      const rewardNotifications = withSource.filter((n: BackendNotification) => n.type === 'reward');
      for (const notif of rewardNotifications) {
        if (!rewardDetailsCache[notif.reference_id]) {
          fetchRewardDetails(notif.reference_id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error carregant notificacions');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardDetails = async (rewardId: number) => {
    try {
      const data = await api(`/rewards/${rewardId}/`);
      setRewardDetailsCache(prev => ({ ...prev, [rewardId]: data }));
    } catch (err) {
      console.error(`Error fetching reward ${rewardId}:`, err);
    }
  };

  // Carregar notificacions llegides de AsyncStorage
  useEffect(() => {
    loadReadNotifications();
  }, []);

  const loadReadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem('readBackendNotifications');
      if (stored) {
        const readIds = JSON.parse(stored);
        setReadNotifications(new Set(readIds));
      }
    } catch (error) {
      console.error('Error loading read notifications:', error);
    }
  };

  const saveReadNotifications = async (readIds: Set<number>) => {
    try {
      await AsyncStorage.setItem('readBackendNotifications', JSON.stringify(Array.from(readIds)));
      setReadNotifications(readIds);
    } catch (error) {
      console.error('Error saving read notifications:', error);
    }
  };

  const getNotificationText = (notification: CombinedNotification): string => {
    try {
      if (notification.source === 'local') {
        const localNotif = notification as LocalNotificationType;
        return String(localNotif.message || '');
      }
      
      const backendNotif = notification as BackendNotification;
      
      // Si és una notificació de reward, generar text personalitzat
      if (backendNotif.type === 'reward') {
        const rewardDetails = rewardDetailsCache[backendNotif.reference_id];
        if (rewardDetails) {
          return `🎉 Has aconseguit la insígnia: ${rewardDetails.name}`;
        }
        return '🎉 Has aconseguit una nova insígnia!';
      }
      
      const payloadStr = backendNotif.payload;
      
      // Si payload és un string, intentar parsejar-lo com a JSON
      if (typeof payloadStr === 'string') {
        try {
          const parsed = JSON.parse(payloadStr);
          if (typeof parsed === 'object' && parsed !== null) {
            // Extreure el camp 'message', 'text' o 'body'
            if (typeof parsed.message === 'string') return parsed.message;
            if (typeof parsed.text === 'string') return parsed.text;
            if (typeof parsed.body === 'string') return parsed.body;
            
            // Si no té cap camp de text reconegut, retornar string buit
            console.warn('Notification payload without text message, filtering out:', parsed);
            return '';
          }
          return String(parsed);
        } catch {
          // Si no es pot parsejar, retornar el string tal qual
          return String(payloadStr);
        }
      }
      
      return String(payloadStr || '');
    } catch (error) {
      console.error('Error getting notification text:', error, notification);
      return '';
    }
  };

  const sendPushForNotification = async (notification: CombinedNotification) => {
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

      let title = '';
      let body = '';

      if (notification.source === 'backend') {
        const backendNotif = notification as BackendNotification;
        
        if (backendNotif.type === 'reward') {
          const rewardDetails = rewardDetailsCache[backendNotif.reference_id];
          title = '🏆 Nova insígnia!';
          body = rewardDetails 
            ? `Has aconseguit: ${rewardDetails.name}`
            : 'Has aconseguit una nova insígnia!';
        } else {
          title = '📅 Nou esdeveniment';
          body = getNotificationText(notification);
        }
      } else {
        // Local notifications ja envien el seu propi push
        return;
      }

      // Enviar notificació push
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            notificationId: notification.id,
            source: notification.source,
          },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchBackendNotifications();
      refreshReminders();
    }
  }, [visible]);

  // Combinar notificacions locals i del backend (DECLARAR ABANS DEL useEffect)
  const allNotifications: CombinedNotification[] = [
    ...localNotifications,
    ...backendNotifications
      .filter(n => {
        // Mostrar notificacions d'esdeveniments i rewards
        return n.type === 'event' || n.type === 'event_reminder' || n.type === 'reward';
      })
      .map(n => ({
        ...n,
        // Aplicar l'estat de llegit des del cache local
        read: n.read || readNotifications.has(n.id),
      })),
  ]
    .filter(notification => {
      // Filtrar notificacions sense text vàlid
      const text = getNotificationText(notification);
      return text && text.trim().length > 0;
    })
    .sort((a, b) => {
      // Ordenar per data (més recents primer)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Detectar noves notificacions i enviar push
  useEffect(() => {
    const checkForNewNotifications = async () => {
      const currentUnread = allNotifications.filter(n => !n.read).length;
      
      // Si hi ha noves notificacions no llegides
      if (currentUnread > previousNotificationCountRef.current && previousNotificationCountRef.current > 0) {
        const newNotifications = allNotifications
          .filter(n => !n.read)
          .slice(0, currentUnread - previousNotificationCountRef.current);
        
        // Enviar push per cada nova notificació
        for (const notification of newNotifications) {
          await sendPushForNotification(notification);
        }
      }
      
      previousNotificationCountRef.current = currentUnread;
    };

    checkForNewNotifications();
  }, [allNotifications, rewardDetailsCache]);

  // Actualitzar comptador de notificacions no llegides
  useEffect(() => {
    const localUnread = getUnreadCount();
    const backendUnread = backendNotifications.filter(n => {
      const isEventOrReward = n.type === 'event' || n.type === 'event_reminder' || n.type === 'reward';
      const isUnread = !n.read && !readNotifications.has(n.id);
      const hasText = getNotificationText(n).trim().length > 0;
      return isEventOrReward && isUnread && hasText;
    }).length;
    onNotificationCountChange(localUnread + backendUnread);
  }, [localNotifications, backendNotifications, readNotifications]);

  const handleMarkAsRead = async (notification: CombinedNotification) => {
    if (notification.read) return;

    if (notification.source === 'backend') {
      try {
        await api(`/notifications/${notification.id}/mark-read/`, {
          method: 'POST',
        });
        
        // Actualitzar el cache local
        const newReadIds = new Set(readNotifications);
        newReadIds.add(notification.id);
        await saveReadNotifications(newReadIds);
        
        // Actualitzar també l'estat de backendNotifications
        setBackendNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, read: true } : n))
        );
      } catch (err) {
        console.error('Error marking backend notification as read:', err);
      }
    } else {
      await markLocalAsRead(notification.id);
    }
  };

  const handleMarkAllAsRead = async () => {
    // Marcar totes del backend
    try {
      await api('/notifications/mark-read/', {
        method: 'POST',
      });
      
      // Actualitzar el cache local amb totes les IDs
      const allBackendIds = backendNotifications.map(n => n.id);
      const newReadIds = new Set([...readNotifications, ...allBackendIds]);
      await saveReadNotifications(newReadIds);
      
      setBackendNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all backend notifications as read:', err);
    }

    // Marcar totes les locals
    await markAllLocalAsRead();
  };

  const handleNotificationPress = async (notification: CombinedNotification) => {
    await handleMarkAsRead(notification);

    // Si és una notificació d'esdeveniment, navegar al detall
    if (notification.source === 'local') {
      onClose();
      router.push(`/events/${notification.eventId}`);
    } else if (notification.type === 'event' || notification.type === 'event_reminder') {
      onClose();
      router.push(`/events/${notification.reference_id}`);
    } else if (notification.type === 'reward') {
      // Per rewards, pots navegar a la pàgina de perfil o rewards
      onClose();
      router.push('/profile');
    }
  };

  const getNotificationIcon = (notification: CombinedNotification) => {
    if (notification.source === 'local') return 'calendar';
    
    switch (notification.type) {
      case 'comment':
        return 'chatbubble';
      case 'review':
        return 'star';
      case 'follow':
        return 'person-add';
      case 'event':
      case 'event_reminder':
        return 'calendar';
      case 'reward':
        return 'trophy';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (notification: CombinedNotification) => {
    if (notification.read) return Colors.border;
    
    if (notification.source === 'local') {
      const localNotif = notification as LocalNotificationType;
      // Colors segons urgència
      if (localNotif.daysUntil === 0) return '#FF6B6B'; // Vermell (avui)
      if (localNotif.daysUntil === 1) return '#FFA726'; // Taronja (demà)
      return '#66BB6A'; // Verd (més de 2 dies)
    }
    
    return Colors.accent;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ara mateix';
    if (diffMins < 60) return `Fa ${diffMins} min`;
    if (diffHours < 24) return `Fa ${diffHours} h`;
    if (diffDays < 7) return `Fa ${diffDays} dies`;

    return date.toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' });
  };

  const renderNotification = ({ item }: { item: CombinedNotification }) => {
    const notificationText = getNotificationText(item);
    
    // No renderitzar si no hi ha text vàlid
    if (!notificationText || notificationText.trim().length === 0) {
      return null;
    }
    
    const isReward = item.source === 'backend' && item.type === 'reward';
    const rewardDetails = isReward ? rewardDetailsCache[(item as BackendNotification).reference_id] : null;
    
    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.read ? Colors.card : Colors.background,
            borderLeftColor: getNotificationColor(item),
          },
        ]}
        onPress={() => handleNotificationPress(item)}
        onLongPress={() => {
          if (item.source === 'local') {
            deleteNotification(item.id);
          }
        }}
      >
        <View style={styles.notificationContent}>
          {isReward && rewardDetails?.icon ? (
            <Image
              source={{ uri: rewardDetails.icon }}
              style={styles.rewardIcon}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: getNotificationColor(item) },
              ]}
            >
              <Ionicons name={getNotificationIcon(item)} size={20} color="white" />
            </View>
          )}

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.notificationText,
                { color: Colors.text, fontWeight: item.read ? '400' : '600' },
              ]}
            >
              {notificationText}
            </Text>
            {isReward && rewardDetails && (
              <Text style={[styles.rewardSubtext, { color: Colors.textSecondary }]}>
                {rewardDetails.level_label} • {rewardDetails.category}
              </Text>
            )}
            <Text style={[styles.timeText, { color: Colors.textSecondary }]}>
              {formatDate(item.created_at)}
            </Text>
          </View>

          {!item.read && <View style={[styles.unreadDot, { backgroundColor: Colors.accent }]} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <View style={[styles.header, { borderBottomColor: Colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: Colors.text }]}>Notificacions</Text>

          {allNotifications.some(n => !n.read) && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
              <Text style={[styles.markAllText, { color: Colors.accent }]}>Marcar tot</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
            <Text style={[styles.errorText, { color: Colors.text }]}>{String(error)}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Colors.accent }]}
              onPress={fetchBackendNotifications}
            >
              <Text style={styles.retryButtonText}>Tornar a intentar</Text>
            </TouchableOpacity>
          </View>
        ) : allNotifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              No hi ha notificacions
            </Text>
          </View>
        ) : (
          <FlatList
            data={allNotifications}
            keyExtractor={(item) =>
              item.source === 'backend' ? `backend_${item.id}` : `local_${item.id}`
            }
            renderItem={renderNotification}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: { padding: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  markAllButton: { padding: 4 },
  markAllText: { fontSize: 14, fontWeight: '600' },
  listContainer: { paddingVertical: 8 },
  notificationItem: {
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderLeftWidth: 4,
    overflow: 'hidden',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  textContainer: { flex: 1 },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  rewardSubtext: {
    fontSize: 12,
    marginBottom: 2,
  },
  timeText: { fontSize: 12 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationsScreen;