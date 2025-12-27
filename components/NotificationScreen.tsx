import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { LightColors, DarkColors } from '../theme/colors';
import { api } from '../api';

interface Notification {
  id: number;
  type: string;
  reference_id: number;
  payload: string;
  created_at: string;
  read: boolean;
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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/notifications/');
      setNotifications(data);

      // Comptar notificacions no llegides
      const unreadCount = data.filter((n: Notification) => !n.read).length;
      onNotificationCountChange(unreadCount);
    } catch (err: any) {
      setError(err.message || t('Error loading notifications'));
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const markAsRead = async (notificationId: number) => {
    try {
      await api(`/notifications/${notificationId}/mark-read/`, {
        method: 'POST',
      });

      // Actualitzar l'estat local
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
      );

      // Actualitzar el comptador
      const unreadCount = notifications.filter((n) => !n.read && n.id !== notificationId).length;
      onNotificationCountChange(unreadCount);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api('/notifications/mark-read/', {
        method: 'POST',
      });

      // Actualitzar totes les notificacions com a llegides
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onNotificationCountChange(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return 'chatbubble';
      case 'review':
        return 'star';
      case 'follow':
        return 'person-add';
      case 'event':
        return 'calendar';
      default:
        return 'notifications';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return String(t('Just now') || 'Just now');
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} h ago`;
    if (diffDays < 7) return `${diffDays} d ago`;

    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.read ? Colors.card : Colors.background,
          borderLeftColor: item.read ? Colors.border : Colors.accent,
        },
      ]}
      onPress={() => !item.read && markAsRead(item.id)}
    >
      <View style={styles.notificationContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: item.read ? Colors.border : Colors.accent },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={20}
            color={item.read ? Colors.text : 'white'}
          />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.notificationText,
              { color: Colors.text, fontWeight: item.read ? '400' : '600' },
            ]}
          >
            {String(item.payload || '')}
          </Text>
          <Text style={[styles.timeText, { color: Colors.textSecondary }]}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        {!item.read && <View style={[styles.unreadDot, { backgroundColor: Colors.accent }]} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: Colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: Colors.text }]}>
            {String(t('Notifications') || 'Notifications')}
          </Text>

          {notifications.some((n) => !n.read) && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
              <Text style={[styles.markAllText, { color: Colors.accent }]}>
                {String(t('Mark all as read') || 'Mark all as read')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textSecondary} />
            <Text style={[styles.errorText, { color: Colors.text }]}>{String(error || '')}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Colors.accent }]}
              onPress={fetchNotifications}
            >
              <Text style={styles.retryButtonText}>{String(t('Retry') || 'Retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={Colors.textSecondary} />
            <Text style={[styles.emptyText, { color: Colors.textSecondary }]}>
              {String(t('No notifications yet') || 'No notifications yet')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </Modal>
  );

};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    paddingVertical: 8,
  },
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
  textContainer: {
    flex: 1,
  },
  notificationText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
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
