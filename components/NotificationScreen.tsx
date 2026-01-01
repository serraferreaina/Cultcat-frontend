// components/NotificationScreen.tsx
// Versió amb suport complet per tots els tipus de notificacions

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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

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
  const { t } = useTranslation();
  const { theme } = useTheme();
  const Colors = theme === 'dark' ? DarkColors : LightColors;
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousNotificationIdsRef = useRef<Set<number>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modal per mostrar detalls de la insígnia
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<BadgeModalData | null>(null);

  // Obtenir notificacions del backend
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/notifications/');
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Error carregant notificacions');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Polling per notificacions noves (cada 30 segons quan la modal està oberta)
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

  // Enviar push notification
  const sendPushForNotification = async (notification: Notification) => {
    try {
      const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
      if (notifEnabled !== 'true') return;

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') return;

      let title = '';
      let body = '';

      if (notification.type === 'reward_unlocked') {
        const emoji = getRewardEmoji(notification.payload.reward_name || '');
        title = `${emoji} Nova insígnia desblocada!`;
        body = `Felicitats! Has aconseguit: ${notification.payload.reward_name || 'una nova insígnia'}`;
      } else if (notification.type === 'connection_request_received') {
        title = '👥 Nova sol·licitud de connexió';
        body = `${notification.payload.from_username || 'Algú'} vol connectar amb tu`;
      } else if (notification.type === 'event_soon') {
        title = '📅 Esdeveniment demà';
        body =
          notification.payload.message || `L'esdeveniment '${notification.payload.title}' és demà`;
      } else if (notification.type === 'event_review_pending') {
        title = '✍️ Escriu una ressenya';
        body = notification.payload.message || `Què et va semblar '${notification.payload.title}'?`;
      } else {
        title = '🔔 Nova notificació';
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
      console.error('Error sending push notification:', error);
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
      return `${emoji} Has aconseguit: ${notification.payload.reward_name || 'nova insígnia'}`;
    }

    if (notification.type === 'connection_request_received') {
      return `${notification.payload.from_username || 'Algú'} vol connectar amb tu`;
    }

    if (notification.type === 'event_soon') {
      return (
        notification.payload.message || `L'esdeveniment '${notification.payload.title}' és demà!`
      );
    }

    if (notification.type === 'event_review_pending') {
      return notification.payload.message || `Què et va semblar '${notification.payload.title}'?`;
    }

    return 'Nova notificació';
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

  // Gestionar press
  const handleNotificationPress = async (notification: Notification) => {
    await handleMarkAsRead(notification);

    if (notification.type === 'reward_unlocked') {
      // Mostrar modal amb detalls de la insígnia
      await loadBadgeDetails(notification.reference_id);
    } else if (notification.type === 'connection_request_received') {
      // Navegar al perfil de l'usuari que ha enviat la sol·licitud
      onClose();
      const userId = notification.payload.from_user_id;
      if (userId) {
        router.push(`/user/${userId}`);
      }
    } else if (notification.type === 'event_soon' || notification.type === 'event_review_pending') {
      // Navegar a l'esdeveniment
      onClose();
      router.push(`/events/${notification.reference_id}`);
    } else if (notification.type === 'event' || notification.type === 'event_reminder') {
      onClose();
      router.push(`/events/${notification.reference_id}`);
    }
  };

  // Formatar data
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
                {item.payload.level} • {item.payload.category_name}
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

          <View style={{ flexDirection: 'row', gap: 8 }}>
            {notifications.some((n) => !n.read) && (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
                <Text style={[styles.markAllText, { color: Colors.accent }]}>Marcar tot</Text>
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
              <Text style={styles.retryButtonText}>Tornar a intentar</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              No hi ha notificacions
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
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: Colors.text,
                    textAlign: 'center',
                  }}
                >
                  {selectedBadge.name}
                </Text>

                <Text
                  style={{ fontSize: 14, textAlign: 'center', color: Colors.muted, marginTop: 8 }}
                >
                  🏅 {selectedBadge.level_label} · Nivell {selectedBadge.level}
                </Text>

                <Text
                  style={{ fontSize: 14, textAlign: 'center', color: Colors.muted, marginTop: 8 }}
                >
                  ⭐ Categoria: {selectedBadge.category}
                </Text>

                <Text
                  style={{ fontSize: 14, textAlign: 'center', color: Colors.muted, marginTop: 8 }}
                >
                  📅 Obtinguda el: {new Date(selectedBadge.obtained_at).toLocaleDateString('ca-ES')}
                </Text>

                <TouchableOpacity
                  onPress={() => setBadgeModalVisible(false)}
                  style={[styles.modalButton, { backgroundColor: Colors.accent }]}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                    Tancar
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
