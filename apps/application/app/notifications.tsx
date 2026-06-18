import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { useLocale } from '@/context/locale-context';
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type Notification,
  type NotificationType,
} from '@/lib/api';

const ICON_BY_TYPE: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  EXPIRATION_IMMINENT: 'time-outline',
  RENEWAL: 'refresh-outline',
  PROMOTION: 'pricetag-outline',
  TRANSFER_RECEIVED: 'arrow-down-circle-outline',
  TRANSFER_SENT: 'arrow-up-circle-outline',
};

export default function NotificationsScreen() {
  const { t } = useLocale();
  const [notifications, setNotifications] = useState<Notification[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { docs } = await listNotifications();
      setNotifications(docs);
    } catch {
      setError(t('notifications.loadError'));
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function onMarkAsRead(id: string) {
    setNotifications((prev) => prev?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
    try {
      await markNotificationAsRead(id);
    } catch {
      void load();
    }
  }

  async function onMarkAllAsRead() {
    setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })) ?? null);
    try {
      await markAllNotificationsAsRead();
    } catch {
      void load();
    }
  }

  async function onDelete(id: string) {
    setNotifications((prev) => prev?.filter((n) => n.id !== id) ?? null);
    try {
      await deleteNotification(id);
    } catch {
      void load();
    }
  }

  const hasUnread = notifications?.some((n) => !n.read) ?? false;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">{t('notifications.title')}</ThemedText>
        {hasUnread ? (
          <Pressable onPress={onMarkAllAsRead} accessibilityRole="button">
            <ThemedText type="link" style={styles.markAll}>
              {t('notifications.markAllRead')}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {notifications === null ? (
        <ActivityIndicator style={{ marginTop: 32 }} />
      ) : error ? (
        <ThemedText style={styles.error}>{error}</ThemedText>
      ) : notifications.length === 0 ? (
        <ThemedText style={styles.empty}>{t('notifications.empty')}</ThemedText>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => !item.read && onMarkAsRead(item.id)}
              style={[styles.row, !item.read && styles.rowUnread]}
              accessibilityRole="button">
              <View style={styles.iconSlot}>
                <Ionicons name={ICON_BY_TYPE[item.type]} size={22} color={Colors.primary} />
                {!item.read && <View style={styles.dot} />}
              </View>
              <View style={styles.textBlock}>
                <ThemedText type="defaultSemiBold">{item.title}</ThemedText>
                <ThemedText style={styles.message}>{item.message}</ThemedText>
                <ThemedText style={styles.date}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
              <Pressable onPress={() => onDelete(item.id)} accessibilityRole="button" accessibilityLabel={t('notifications.delete')}>
                <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, gap: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  markAll: { fontSize: 14 },
  list: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  rowUnread: {
    backgroundColor: Colors.primarySurface,
  },
  iconSlot: { paddingTop: 2 },
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  textBlock: { flex: 1, gap: 2 },
  message: { fontSize: 13, color: Colors.textSecondary },
  date: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  empty: { color: Colors.textSecondary, marginTop: 32, textAlign: 'center' },
  error: { color: Colors.danger, marginTop: 24, textAlign: 'center' },
});