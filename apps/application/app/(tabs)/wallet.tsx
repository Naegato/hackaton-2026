import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { NavigoCard } from '@/components/navigo-card';
import { RelativeCta } from '@/components/relative-cta';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import {
  cancelTransfer,
  listAllMyDocuments,
  listMyPendingTransfers,
  listMySubscriptions,
  respondTransfer,
  type MySubscription,
  type SubscriptionDoc,
  type TransferRequest,
} from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';
import { subscriptionDisplayStatus } from '@/lib/plan-eligibility';

const SUB_STATUS_COLOR: Record<string, string> = {
  pending: Colors.info,
  'awaiting-documents': Colors.warning,
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
  const [docsBySub, setDocsBySub] = useState<Record<string, SubscriptionDoc[]>>({});
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [helpOpenId, setHelpOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // Abonnements + documents + transferts en attente : statut « en attente des documents » + bandeau transferts
      const [list, docs, tr] = await Promise.all([
        listMySubscriptions(),
        listAllMyDocuments(),
        listMyPendingTransfers(),
      ]);
      const grouped: Record<string, SubscriptionDoc[]> = {};
      for (const d of docs) {
        if (!d.subscription) continue;
        (grouped[d.subscription] ??= []).push(d);
      }
      setSubs(list);
      setDocsBySub(grouped);
      setTransfers(tr);
    } catch {
      setError(t('mysubs.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Transferts reçus (à accepter) vs émis (en attente d'acceptation)
  const incoming = transfers.filter((tr) => tr.toUserId === user?.id);
  const outgoingBySub = new Map(transfers.filter((tr) => tr.fromUserId === user?.id).map((tr) => [tr.subscriptionId, tr]));

  async function runTransferAction(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    try {
      await action();
      await load();
    } catch (e) {
      Alert.alert(t('transfer.actionErrTitle'), e instanceof Error ? e.message : t('transfer.errGeneric'));
    } finally {
      setBusyId(null);
    }
  }

  // Accepter un transfert : l'abonnement devient le mien (le nom du titulaire est conservé).
  // Si ce nom diffère de mon compte, on propose de corriger d'éventuelles informations erronées.
  async function acceptTransfer(tr: TransferRequest) {
    setBusyId(tr.id);
    try {
      await respondTransfer(tr.id, 'accepted');
      await load();
      const myName = norm(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`);
      if (tr.subscriptionId && norm(tr.holderName) && norm(tr.holderName) !== myName) {
        router.push({ pathname: '/subscription-holder', params: { sub: tr.subscriptionId } });
      }
    } catch (e) {
      Alert.alert(t('transfer.actionErrTitle'), e instanceof Error ? e.message : t('transfer.errGeneric'));
    } finally {
      setBusyId(null);
    }
  }

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
    const displayStatus = subscriptionDisplayStatus(
      sub.status,
      sub.plan?.eligibility ?? null,
      docsBySub[sub.id] ?? [],
    );
    return (
      <NavigoCard
        key={sub.id}
        holderName={holderName(sub)}
        planName={sub.plan?.name ?? '—'}
        statusLabel={t(`subStatus.${displayStatus}` as TranslationKey)}
        statusColor={SUB_STATUS_COLOR[displayStatus] ?? Colors.textSecondary}
        onPress={() => sub.plan?.slug && router.push(`/subscribe/${sub.plan.slug}`)}
      />
    );
  }

  // Carte d'un abonnement de proche + action de transfert (ou état « en attente d'acceptation »)
  function renderRelativeCard(sub: MySubscription) {
    const outgoing = outgoingBySub.get(sub.id);
    return (
      <View key={sub.id} style={styles.relativeItem}>
        {renderCard(sub)}
        {outgoing ? (
          <View style={styles.transferRow}>
            <ThemedText style={styles.pendingText}>
              {t('transfer.pendingTo')} {outgoing.toEmail}
            </ThemedText>
            <Button
              label={t('transfer.cancel')}
              variant="outline"
              size="sm"
              loading={busyId === outgoing.id}
              onPress={() => runTransferAction(outgoing.id, () => cancelTransfer(outgoing.id))}
            />
          </View>
        ) : !showHistory ? (
          <>
            <View style={styles.transferActions}>
              <Button
                label={t('transfer.action')}
                variant="outline"
                size="sm"
                style={styles.transferBtn}
                onPress={() =>
                  router.push({
                    pathname: '/transfer',
                    params: { sub: sub.id, plan: sub.plan?.name ?? '', holder: holderName(sub) },
                  })
                }
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('transfer.help')}
                hitSlop={8}
                onPress={() => setHelpOpenId((id) => (id === sub.id ? null : sub.id))}>
                <MaterialIcons name="info-outline" size={20} color={Colors.primary} />
              </Pressable>
            </View>
            {helpOpenId === sub.id ? (
              <ThemedText style={styles.transferHelp}>{t('transfer.help')}</ThemedText>
            ) : null}
          </>
        ) : null}
      </View>
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
            {/* Transferts reçus à accepter / refuser */}
            {incoming.length > 0 ? (
              <View style={styles.incomingBox}>
                <ThemedText type="subtitle">{t('transfer.incomingTitle')}</ThemedText>
                {incoming.map((tr) => (
                  <View key={tr.id} style={styles.incomingItem}>
                    <ThemedText style={styles.incomingText}>
                      <ThemedText type="defaultSemiBold">{tr.fromName}</ThemedText> {t('transfer.incomingMsg')}{' '}
                      <ThemedText type="defaultSemiBold">{tr.planName}</ThemedText>
                      {tr.holderName ? ` (${tr.holderName})` : ''}
                    </ThemedText>
                    <View style={styles.incomingActions}>
                      <Button
                        label={t('transfer.accept')}
                        size="sm"
                        loading={busyId === tr.id}
                        onPress={() => acceptTransfer(tr)}
                      />
                      <Button
                        label={t('transfer.decline')}
                        variant="outline"
                        size="sm"
                        disabled={busyId === tr.id}
                        onPress={() => runTransferAction(tr.id, () => respondTransfer(tr.id, 'declined'))}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : null}

            <Section title="mysubs.forMe" items={mine} />

            {/* Abonnements pour mes proches : avec action de transfert */}
            <View style={styles.section}>
              <ThemedText type="subtitle">{t('mysubs.forRelatives')}</ThemedText>
              {relatives.length > 0 ? (
                <View style={styles.cards}>{relatives.map(renderRelativeCard)}</View>
              ) : (
                <ThemedText style={styles.none}>{t('mysubs.noneHere')}</ThemedText>
              )}
            </View>
          </>
        )}

        {/* Souscrire pour un proche : formulaire dédié → sélection d'offre → abonnement au nom du proche */}
        <RelativeCta style={styles.relativeCta} />
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
  relativeCta: { marginTop: 8 },
  incomingBox: {
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    backgroundColor: Colors.primarySurface,
  },
  incomingItem: { gap: 8 },
  incomingText: { fontSize: 14, lineHeight: 20 },
  incomingActions: { flexDirection: 'row', gap: 8 },
  relativeItem: { gap: 8 },
  transferBtn: { alignSelf: 'flex-start' },
  transferActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  transferHelp: {
    fontSize: 13,
    opacity: 0.75,
    backgroundColor: Colors.primarySurface,
    borderRadius: 8,
    padding: 10,
  },
  transferRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  pendingText: { flex: 1, fontSize: 13, opacity: 0.7 },
});
