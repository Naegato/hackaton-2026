import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { NavigoCard } from '@/components/navigo-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import { listMySubscriptions, type MySubscription } from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';

const SUB_STATUS_COLOR: Record<string, string> = {
  pending: Colors.warning,
  active: Colors.success,
  expired: Colors.textSecondary,
  cancelled: Colors.danger,
};

const norm = (s?: string | null) => (s ?? '').trim().toLowerCase();
const isHistoryStatus = (s: string) => s === 'expired' || s === 'cancelled';

export default function WalletScreen() {
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();

  const [subs, setSubs] = useState<MySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setSubs(await listMySubscriptions());
    } catch {
      setError(t('mysubs.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  function isForSelf(sub: MySubscription): boolean {
    const hf = norm(sub.holderFirstName);
    const hl = norm(sub.holderLastName);
    if (!hf && !hl) return true;
    return hf === norm(user?.firstName) && hl === norm(user?.lastName);
  }

  function holderName(sub: MySubscription): string {
    const name = [sub.holderFirstName, sub.holderLastName].filter(Boolean).join(' ').trim();
    if (name) return name;
    return [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || (user?.email ?? '');
  }

  const visible = subs.filter((s) => (showHistory ? isHistoryStatus(s.status) : !isHistoryStatus(s.status)));
  const mine = visible.filter(isForSelf);
  const relatives = visible.filter((s) => !isForSelf(s));

  function renderCard(sub: MySubscription) {
    return (
      <NavigoCard
        key={sub.id}
        holderName={holderName(sub)}
        planName={sub.plan?.name ?? '—'}
        statusLabel={t(`subStatus.${sub.status}` as TranslationKey)}
        statusColor={SUB_STATUS_COLOR[sub.status] ?? Colors.textSecondary}
        onPress={() => sub.plan?.slug && router.push(`/subscribe/${sub.plan.slug}`)}
      />
    );
  }

  function Section({ title, items }: { title: TranslationKey; items: MySubscription[] }) {
    return (
      <View style={styles.section}>
        <ThemedText type="subtitle">{t(title)}</ThemedText>
        {items.length > 0 ? (
          <View style={styles.cards}>{items.map(renderCard)}</View>
        ) : (
          <ThemedText style={styles.none}>{t('mysubs.noneHere')}</ThemedText>
        )}
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}>
        <View style={styles.header}>
          <ThemedText type="title">{t('nav.wallet')}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: showHistory }}
            onPress={() => setShowHistory((v) => !v)}
            style={[styles.histBtn, showHistory && styles.histBtnOn]}>
            <MaterialIcons name="history" size={18} color={showHistory ? '#fff' : Colors.primary} />
            <ThemedText
              style={[styles.histText, showHistory && styles.histTextOn]}
              lightColor={showHistory ? '#fff' : Colors.primary}
              darkColor={showHistory ? '#fff' : Colors.primary}>
              {t('mysubs.history')}
            </ThemedText>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : error ? (
          <ThemedText style={styles.error}>{error}</ThemedText>
        ) : (
          <>
            <Section title="mysubs.forMe" items={mine} />
            <Section title="mysubs.forRelatives" items={relatives} />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 64, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  histBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  histBtnOn: { backgroundColor: Colors.primary },
  histText: { fontSize: 13, fontWeight: '600' },
  histTextOn: { color: '#fff' },
  section: { gap: 12 },
  cards: { gap: 14 },
  none: { opacity: 0.6 },
  error: { color: '#d33', marginTop: 24 },
});
