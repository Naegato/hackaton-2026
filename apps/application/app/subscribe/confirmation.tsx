import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';
import { ApiError, createSubscription } from '@/lib/api';

export default function SubscribeConfirmationScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string; planName?: string }>();

  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!params.planId) {
        setError(t('subscribe.confirmation.error'));
        setCreating(false);
        return;
      }
      try {
        await createSubscription({ plan: params.planId });
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : t('subscribe.confirmation.error'));
      } finally {
        if (active) setCreating(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (creating) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.creating}>{t('subscribe.confirmation.creating')}</Text>
      </View>
    );
  }

  const today = new Date();
  const endDate = new Date(today);
  endDate.setFullYear(endDate.getFullYear() + 1);

  return (
    <View style={styles.container}>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          <View style={styles.checkWrap}>
            <Ionicons name="checkmark-circle" size={72} color={Colors.success} />
          </View>
          <Text style={styles.title}>{t('subscribe.confirmation.title')}</Text>
          <Text style={styles.subtitle}>{t('subscribe.confirmation.subtitle')}</Text>

          <Card style={styles.card}>
            <Row label={t('subscribe.confirmation.offer')} value={params.planName ?? ''} />
            <Row label={t('subscribe.confirmation.startDate')} value={today.toLocaleDateString()} />
            <Row label={t('subscribe.confirmation.validUntil')} value={endDate.toLocaleDateString()} last />
          </Card>
        </>
      )}

      <Button
        label={t('subscribe.confirmation.backHome')}
        onPress={() => router.replace('/(tabs)')}
        variant={error ? 'primary' : 'secondary'}
        size="lg"
        style={styles.backBtn}
      />
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: Spacing.lg, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  creating: { ...Typography.body },
  error: { color: Colors.danger, textAlign: 'center', marginTop: Spacing['3xl'] },
  checkWrap: { marginTop: Spacing['3xl'], marginBottom: Spacing.lg },
  title: { ...Typography.pageTitle, textAlign: 'center' },
  subtitle: { ...Typography.caption, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl },
  card: { width: '100%' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  rowLabel: { ...Typography.body, color: Colors.textSecondary },
  rowValue: { ...Typography.bodyBold },
  backBtn: { width: '100%', marginTop: Spacing.xl },
});
