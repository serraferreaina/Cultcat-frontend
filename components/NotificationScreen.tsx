// components/NotificationScreen.tsx
// Versió amb push notification quan s'obre la pantalla amb notificacions noves

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
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { api } from '../api';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Notification {
  id: number;
  type: string;
  reference_id: number;
  payload: {
    icon?: string;
    level?: string;
    reward_name?: string;
    category_name?: string;
    from_user_id?: number;
    from_username?: string;
    title?: string;
    message?: string;
    saved_as?: string;
    [key: string]: any;
  };
  created_at: string;
  read: boolean;
}

interface BadgeModalData {
  reward_id: number;
  name: string;
  category: string;
  level: number;
  level_label: string;
  icon: string;
  obtained_at: string;
}

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
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousNotificationIdsRef = useRef<Set<number>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  // Modal per mostrar detalls de la insígnia
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeModalData | null>(null);

  // Eliminar notificació
  const deleteNotification = async (notificationId: number) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  // Verificar si l'usuari existeix
  const checkUserExists = async (userId: number): Promise<boolean> => {
    try {
      const response = await api(`/users/${userId}/`);
      return !!response;
    } catch (err: any) {
      if (err.message?.includes('404') || err.status === 404) {
        return false;
      }
      return true;
    }
  };

  // Verificar si l'esdeveniment existeix
  const checkEventExists = async (eventId: number): Promise<boolean> => {
    try {
      const response = await api(`/events/${eventId}/`);
      return !!response;
    } catch (err: any) {
      if (err.message?.includes('404') || err.status === 404) {
        return false;
      }
      return true;
    }
  };

  // Verificar i eliminar notificacions d'usuaris eliminats
  const checkAndCleanupDeletedUsers = async (notificationsList: Notification[]) => {
    const connectionRequestNotifications = notificationsList.filter(
      (n) => n.type === 'connection_request_received',
    );

    for (const notification of connectionRequestNotifications) {
      const userId = notification.payload.from_user_id;
      if (userId) {
        const userExists = await checkUserExists(userId);
        if (!userExists) {
          await deleteNotification(notification.id);
        }
      }
    }
  };

  // Obtenir notificacions del backend
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/notifications/');
      setNotifications(data);

      // Netejar notificacions d'usuaris eliminats després de carregar
      await checkAndCleanupDeletedUsers(data);
    } catch (err: any) {
      setError(err.message || t('error_loading_notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Polling per notificacions noves
  useEffect(() => {
    if (visible) {
      fetchNotifications();

      pollingIntervalRef.current = setInterval(() => {
        fetchNotifications();
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [visible]);

  // Detectar notificacions noves i enviar push
  useEffect(() => {
    const checkForNewNotifications = async () => {
      const currentNotificationIds = new Set(notifications.map((n) => n.id));

      // Si és la càrrega inicial i hi ha notificacions, enviar push per cadascuna
      if (isInitialLoadRef.current && currentNotificationIds.size > 0) {
        for (const notification of notifications) {
          if (!notification.read) {
            await sendPushForNotification(notification);
          }
        }

        previousNotificationIdsRef.current = currentNotificationIds;
        isInitialLoadRef.current = false;
        return;
      }

      // Detectar notificacions realment noves (en polling)
      const newNotificationIds = Array.from(currentNotificationIds).filter(
        (id) => !previousNotificationIdsRef.current.has(id),
      );

      if (newNotificationIds.length > 0 && previousNotificationIdsRef.current.size > 0) {
        for (const id of newNotificationIds) {
          const notification = notifications.find((n) => n.id === id);
          if (notification) {
            await sendPushForNotification(notification);
          }
        }
      }

      previousNotificationIdsRef.current = currentNotificationIds;
    };

    if (notifications.length > 0) {
      checkForNewNotifications();
    }
  }, [notifications]);

  // Reset quan es tanca la modal
  useEffect(() => {
    if (!visible) {
      isInitialLoadRef.current = true;
      previousNotificationIdsRef.current = new Set();
    }
  }, [visible]);

  // Enviar push notification
  const sendPushForNotification = async (notification: Notification) => {
    try {
      const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notifEnabled !== 'true') {
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      let title = '';
      let body = '';

      if (notification.type === 'reward_unlocked') {
        const emoji = getRewardEmoji(notification.payload.reward_name || '');
        const rewardName = notification.payload.reward_name || t('new_badge');
        const translatedName = t(rewardName);
        title = `${emoji} ${t('badge_unlocked')}`;
        body = `${t('congratulations')} ${translatedName}`;
      } else if (notification.type === 'connection_request_received') {
        title = `👥 ${t('new_connection_request')}`;
        body = `${notification.payload.from_username || t('someone')} ${t('wants_to_connect')}`;
      } else if (notification.type === 'event_soon') {
        title = `📅 ${t('event_tomorrow')}`;
        body =
          notification.payload.message ||
          `${t('the_event')} '${notification.payload.title}' ${t('is_tomorrow')}`;
      } else if (notification.type === 'event_review_pending') {
        title = `✍️ ${t('write_review')}`;
        body =
          notification.payload.message ||
          `${t('what_did_you_think')} '${notification.payload.title}'?`;
      } else {
        title = `🔔 ${t('new_notification')}`;
        body = getNotificationText(notification);
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            notificationId: notification.id,
            type: notification.type,
          },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  };

  // Actualitzar comptador de no llegides
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    onNotificationCountChange(unreadCount);
  }, [notifications]);

  // Marcar com a llegida
  const handleMarkAsRead = async (notification: Notification) => {
    if (notification.read) return;

    try {
      await api(`/notifications/${notification.id}/mark-read/`, {
        method: 'POST',
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Marcar totes com a llegides
  const handleMarkAllAsRead = async () => {
    try {
      await api('/notifications/mark-read/', {
        method: 'POST',
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Obtenir emoji per rewards
  const getRewardEmoji = (rewardName: string): string => {
    if (rewardName.includes('_3')) return '🏆';
    if (rewardName.includes('_2')) return '🥈';
    if (rewardName.includes('_1')) return '🥉';
    return '🎉';
  };

  // Obtenir text de la notificació
  const getNotificationText = (notification: Notification): string => {
    if (notification.type === 'reward_unlocked') {
      const emoji = getRewardEmoji(notification.payload.reward_name || '');
      const rewardName = notification.payload.reward_name || t('new_badge');
      const translatedName = t(rewardName);
      return `${emoji} ${t('you_earned')} ${translatedName}`;
    }

    if (notification.type === 'connection_request_received') {
      return `${notification.payload.from_username || t('someone')} ${t('wants_to_connect')}`;
    }

    // A getNotificationText i sendPushForNotification, canvia:

    if (notification.type === 'event_soon') {
      const eventTitle = notification.payload.title || t('an_event');
      return `${t('the_event')} "${eventTitle}" ${t('is_tomorrow')}`;
    }

    if (notification.type === 'event_review_pending') {
      const eventTitle = notification.payload.title || t('an_event');
      return `${t('what_did_you_think')} "${eventTitle}"?`;
    }

    return t('new_notification');
  };

  // Obtenir icona
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'reward_unlocked':
        return 'trophy';
      case 'connection_request_received':
        return 'person-add';
      case 'event_soon':
        return 'time-outline';
      case 'event_review_pending':
        return 'create-outline';
      case 'comment':
        return 'chatbubble';
      case 'review':
        return 'star';
      case 'follow':
        return 'person-add';
      case 'event':
      case 'event_reminder':
        return 'calendar';
      default:
        return 'notifications';
    }
  };

  // Obtenir color
  const getNotificationColor = (notification: Notification) => {
    if (notification.read) return Colors.border;

    if (notification.type === 'reward_unlocked') {
      return '#FFD700';
    }

    if (notification.type === 'event_soon') {
      return '#FFA726';
    }

    if (notification.type === 'event_review_pending') {
      return '#66BB6A';
    }

    return Colors.accent;
  };

  // Carregar detalls de la insígnia
  const loadBadgeDetails = async (rewardId: number) => {
    try {
      const data = await api(`/rewards/${rewardId}/`);
      setSelectedBadge(data);
      setBadgeModalVisible(true);
    } catch (err) {
      console.error('Error loading badge details:', err);
    }
  };

  // Gestionar press amb validació d'existència
  const handleNotificationPress = async (notification: Notification) => {
    await handleMarkAsRead(notification);

    if (notification.type === 'reward_unlocked') {
      await loadBadgeDetails(notification.reference_id);
    } else if (notification.type === 'connection_request_received') {
      const userId = notification.payload.from_user_id;
      if (!userId) {
        console.warn('No user ID in notification');
        await deleteNotification(notification.id);
        return;
      }

      const userExists = await checkUserExists(userId);

      if (!userExists) {
        await deleteNotification(notification.id);
        return;
      }

      onClose();
      router.push(`/user/${userId}`);
    } else if (notification.type === 'event_soon' || notification.type === 'event_review_pending') {
      const eventId = notification.reference_id;

      const eventExists = await checkEventExists(eventId);

      if (!eventExists) {
        await deleteNotification(notification.id);
        return;
      }

      onClose();
      router.push(`/events/${eventId}`);
    } else if (notification.type === 'event' || notification.type === 'event_reminder') {
      const eventId = notification.reference_id;

      const eventExists = await checkEventExists(eventId);

      if (!eventExists) {
        await deleteNotification(notification.id);
        return;
      }

      onClose();
      router.push(`/events/${eventId}`);
    }
  };

  // Formatar data segons idioma
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('now');
    if (diffMins < 60) return `${t('ago')} ${diffMins} ${t('minutes_short')}`;
    if (diffHours < 24) return `${t('ago')} ${diffHours} ${t('hours_short')}`;
    if (diffDays < 7) return `${t('ago')} ${diffDays} ${t('days')}`;

    // Format segons idioma
    const locale = i18n.language === 'ca' ? 'ca-ES' : i18n.language === 'es' ? 'es-ES' : 'en-US';
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  };

  // Render notificació
  const renderNotification = ({ item }: { item: Notification }) => {
    const notificationText = getNotificationText(item);
    const isReward = item.type === 'reward_unlocked';
    const rewardIcon = isReward ? item.payload.icon : null;

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
      >
        <View style={styles.notificationContent}>
          {isReward && rewardIcon ? (
            <Image source={{ uri: rewardIcon }} style={styles.rewardIcon} resizeMode="contain" />
          ) : (
            <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item) }]}>
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
            {isReward && item.payload.level && (
              <Text style={[styles.rewardSubtext, { color: Colors.textSecondary }]}>
                {item.payload.level} • {t(item.payload.category_name || 'category')}
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

          <Text style={[styles.headerTitle, { color: Colors.text }]}>{t('notifications')}</Text>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {notifications.some((n) => !n.read) && (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                <Text style={[styles.markAllText, { color: Colors.accent }]}>{t('mark_all')}</Text>
              </TouchableOpacity>
            )}
          </View>
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
              onPress={fetchNotifications}
            >
              <Text style={styles.retryButtonText}>{t('retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              {t('no_notifications')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => `notification_${item.id}`}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      {/* Modal de detalls de la insígnia */}
      <Modal
        visible={badgeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.card }]}>
            {selectedBadge && (
              <>
                <Image
                  source={{ uri: selectedBadge.icon }}
                  style={{ width: 100, height: 100, alignSelf: 'center', marginBottom: 16 }}
                />

                <Text
                  style={{
                    fontSize: SCREEN_WIDTH * 0.055,
                    fontWeight: 'bold',
                    color: Colors.text,
                    textAlign: 'center',
                  }}
                >
                  {t(selectedBadge.name)}
                </Text>

                <Text
                  style={{
                    fontSize: SCREEN_WIDTH * 0.037,
                    textAlign: 'center',
                    color: Colors.textSecondary,
                    marginTop: 8,
                  }}
                >
                  🏅 {selectedBadge.level_label} · {t('level')} {selectedBadge.level}
                </Text>

                <Text
                  style={{
                    fontSize: SCREEN_WIDTH * 0.037,
                    textAlign: 'center',
                    color: Colors.textSecondary,
                    marginTop: 8,
                  }}
                >
                  ⭐ {t('category')}: {t(selectedBadge.category)}
                </Text>

                <Text
                  style={{
                    fontSize: SCREEN_WIDTH * 0.037,
                    textAlign: 'center',
                    color: Colors.textSecondary,
                    marginTop: 8,
                  }}
                >
                  📅 {t('obtained_at')}:{' '}
                  {new Date(selectedBadge.obtained_at).toLocaleDateString(
                    i18n.language === 'ca' ? 'ca-ES' : i18n.language === 'es' ? 'es-ES' : 'en-US',
                  )}
                </Text>

                <TouchableOpacity
                  onPress={() => setBadgeModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: Colors.accent }]}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      fontSize: SCREEN_WIDTH * 0.04,
                    }}
                  >
                    {t('close')}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    fontSize: SCREEN_WIDTH * 0.053,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  markAllButton: { padding: 4 },
  markAllText: {
    fontSize: SCREEN_WIDTH * 0.037,
    fontWeight: '600',
  },
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
    fontSize: SCREEN_WIDTH * 0.037,
    lineHeight: SCREEN_WIDTH * 0.053,
    marginBottom: 4,
  },
  rewardSubtext: {
    fontSize: SCREEN_WIDTH * 0.032,
    marginBottom: 2,
  },
  timeText: {
    fontSize: SCREEN_WIDTH * 0.032,
  },
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
    fontSize: SCREEN_WIDTH * 0.042,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: SCREEN_WIDTH * 0.042,
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
    fontSize: SCREEN_WIDTH * 0.037,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
  },
  modalButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 10,
  },
});

export default NotificationsScreen;
