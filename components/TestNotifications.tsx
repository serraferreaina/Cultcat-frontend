// components/NotificationDebugScreen.tsx
// Pantalla de debug per veure l'estat de les notificacions

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationDebugScreen() {
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastNotification, setLastNotification] = useState<string>('Cap');

  useEffect(() => {
    loadDebugInfo();

    // Listener per notificacions rebudes
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      setLastNotification(JSON.stringify(notification.request.content, null, 2));
      Alert.alert('📬 Notificació rebuda!', notification.request.content.body || 'Sense text');
    });

    // Listener per quan l'usuari toca la notificació
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        Alert.alert('👆 Has tocat la notificació');
      },
    );

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  const loadDebugInfo = async () => {
    setRefreshing(true);
    try {
      const info: any = {};

      // 1. Permisos
      const { status } = await Notifications.getPermissionsAsync();
      info.permissionStatus = status;

      // 2. Configuració guardada
      const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
      info.notificationsEnabled = notifEnabled;

      // 3. Notificacions programades
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      info.scheduledCount = scheduled.length;
      info.scheduledNotifications = scheduled;

      // 4. Notificacions presents
      const presented = await Notifications.getPresentedNotificationsAsync();
      info.presentedCount = presented.length;
      info.presentedNotifications = presented;

      // 5. AsyncStorage - Event Reminders
      const reminders = await AsyncStorage.getItem('eventReminders');
      info.storedReminders = reminders ? JSON.parse(reminders).length : 0;

      // 6. AsyncStorage - Created IDs
      const createdIds = await AsyncStorage.getItem('createdReminderIds');
      info.createdReminderIds = createdIds ? JSON.parse(createdIds).length : 0;

      // 7. Handler configuration
      const handler = await Notifications.getNotificationChannelsAsync();
      info.channels = handler;

      setDebugInfo(info);
    } catch (error) {
      console.error('Error loading debug info:', error);
      Alert.alert('Error', String(error));
    } finally {
      setRefreshing(false);
    }
  };

  const testImmediateNotification = async () => {
    try {

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Immediat',
          body: "Aquesta notificació s'ha enviat ara mateix!",
          sound: true,
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { test: true, timestamp: Date.now() },
        },
        trigger: null,
      });

      Alert.alert(
        '✅ Enviada!',
        `ID: ${id}\n\n⚠️ Amb Expo Go només es veu amb l'app oberta.\n\nRevisa els logs de la consola.`,
      );

      setTimeout(() => loadDebugInfo(), 1000);
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('❌ Error', String(error));
    }
  };

  const testScheduledNotification = async () => {
    try {

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Test Programat',
          body: 'Han passat 5 segons des que vas prémer el botó!',
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
          repeats: false,
        },
      });

      Alert.alert(
        '✅ Programada!',
        `Rebràs una notificació en 5 segons.\n\nID: ${id}\n\n⚠️ IMPORTANT: Mantén l'app oberta!`,
      );

      setTimeout(() => loadDebugInfo(), 1000);
    } catch (error) {
      console.error('❌ Error:', error);
      Alert.alert('❌ Error', String(error));
    }
  };

  const requestPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();

        if (status === 'granted') {
          Alert.alert('✅ Permisos concedits!');
          await AsyncStorage.setItem('notificationsEnabled', 'true');
        } else {
          Alert.alert('❌ Permisos denegats', 'Ves a Configuració per activar-los');
        }
      } else {
        Alert.alert('ℹ️ Permisos ja concedits');
      }

      loadDebugInfo();
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', String(error));
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      Alert.alert('🗑️ Totes les notificacions cancel·lades');
      loadDebugInfo();
    } catch (error) {
      Alert.alert('Error', String(error));
    }
  };

  const toggleNotificationsEnabled = async () => {
    const current = debugInfo.notificationsEnabled === 'true';
    const newValue = !current;
    await AsyncStorage.setItem('notificationsEnabled', String(newValue));
    Alert.alert(newValue ? '✅ Activat' : '🔕 Desactivat', `notificationsEnabled = ${newValue}`);
    loadDebugInfo();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔔 Debug Notificacions</Text>
        <TouchableOpacity onPress={loadDebugInfo}>
          <Ionicons name="refresh" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadDebugInfo} />}
      >
        {/* Estat General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Estat General</Text>
          <InfoRow label="Permisos" value={debugInfo.permissionStatus} />
          <InfoRow
            label="Enabled (AsyncStorage)"
            value={debugInfo.notificationsEnabled || 'null'}
          />
          <InfoRow label="Notif. programades" value={debugInfo.scheduledCount} />
          <InfoRow label="Notif. presents" value={debugInfo.presentedCount} />
          <InfoRow label="Reminders guardats" value={debugInfo.storedReminders} />
          <InfoRow label="IDs creats" value={debugInfo.createdReminderIds} />
        </View>

        {/* Última notificació */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📬 Última notificació rebuda</Text>
          <Text style={styles.jsonText}>{lastNotification}</Text>
        </View>

        {/* Botons d'acció */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎮 Accions</Text>

          <ActionButton
            icon="notifications"
            label="Notificació Immediata"
            onPress={testImmediateNotification}
          />

          <ActionButton icon="time" label="Notificació en 5s" onPress={testScheduledNotification} />

          <ActionButton
            icon="shield-checkmark"
            label="Demanar Permisos"
            onPress={requestPermissions}
          />

          <ActionButton
            icon={debugInfo.notificationsEnabled === 'true' ? 'notifications-off' : 'notifications'}
            label={
              debugInfo.notificationsEnabled === 'true'
                ? 'Desactivar (AsyncStorage)'
                : 'Activar (AsyncStorage)'
            }
            onPress={toggleNotificationsEnabled}
          />

          <ActionButton
            icon="trash"
            label="Cancel·lar totes"
            onPress={cancelAllNotifications}
            color="#FF3B30"
          />
        </View>

        {/* Notificacions programades */}
        {debugInfo.scheduledNotifications?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⏰ Notificacions Programades</Text>
            {debugInfo.scheduledNotifications.map((notif: any, index: number) => (
              <View key={index} style={styles.notifItem}>
                <Text style={styles.notifTitle}>{notif.content.title}</Text>
                <Text style={styles.notifBody}>{notif.content.body}</Text>
                <Text style={styles.notifId}>ID: {notif.identifier}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info important */}
        <View style={[styles.section, styles.warningSection]}>
          <Text style={styles.warningTitle}>⚠️ Important amb Expo Go:</Text>
          <Text style={styles.warningText}>
            • Les notificacions NOMÉS es veuen amb l'app oberta{'\n'}• NO apareixen al centre de
            notificacions{'\n'}• NO funcionen amb l'app tancada{'\n'}• Per notificacions reals
            necessites un BUILD{'\n'}
            {'\n'}
            📱 Per testejar: Prem "Notificació Immediata" i hauràs de veure un alert
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: any }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{String(value)}</Text>
  </View>
);

const ActionButton = ({
  icon,
  label,
  onPress,
  color = '#007AFF',
}: {
  icon: any;
  label: string;
  onPress: () => void;
  color?: string;
}) => (
  <TouchableOpacity style={[styles.actionButton, { borderColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.actionButtonText, { color }]}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  jsonText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#333',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 2,
    marginBottom: 10,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
  notifItem: {
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  notifBody: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  notifId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  warningSection: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 2,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 20,
  },
});
