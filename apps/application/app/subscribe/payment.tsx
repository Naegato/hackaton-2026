import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';
import { ApiError, payForSubscription } from '@/lib/api';

const STEPS: { key: string; labelKey: string }[] = [
  { key: 'offer', labelKey: 'subscribe.checkout.stepOffer' },
  { key: 'info', labelKey: 'subscribe.checkout.stepInfo' },
  { key: 'documents', labelKey: 'subscribe.checkout.stepDocuments' },
  { key: 'payment', labelKey: 'subscribe.checkout.stepPayment' },
  { key: 'confirmation', labelKey: 'subscribe.checkout.stepConfirmation' },
];
const CURRENT_STEP_INDEX = 3; // "Paiement"

// Carte de test Stripe — jamais de vrai paiement dans ce parcours de démo.
const STRIPE_TEST_CARD = {
  name: 'Camille Demo',
  number: '4242 4242 4242 4242',
  expiry: '12/29',
  cvv: '123',
};

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .slice(0, 19);
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function SubscribePaymentScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string; planName?: string; subscriptionId?: string }>();

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  function autoFillTestCard() {
    setCardName(STRIPE_TEST_CARD.name);
    setCardNumber(STRIPE_TEST_CARD.number);
    setExpiry(STRIPE_TEST_CARD.expiry);
    setCvv(STRIPE_TEST_CARD.cvv);
    setError(null);
  }

  async function handlePay() {
    setError(null);
    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 16 || expiry.length < 5 || cvv.length < 3) {
      setError(t('subscribe.payment.missingFields'));
      return;
    }
    setProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 1400));
    try {
      if (params.subscriptionId) {
        await payForSubscription(params.subscriptionId);
      }
      router.push({
        pathname: '/subscribe/confirmation',
        params: { planId: params.planId, planName: params.planName, subscriptionId: params.subscriptionId },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('subscribe.payment.payError'));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.recap}>
          <Text style={styles.recapEyebrow}>{t('subscribe.result.title')}</Text>
          <Text style={styles.recapName}>{params.planName}</Text>
        </Card>

        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={styles.stepRow}>
              <View
                style={[
                  styles.stepDot,
                  i < CURRENT_STEP_INDEX && styles.stepDotDone,
                  i === CURRENT_STEP_INDEX && styles.stepDotCurrent,
                ]}>
                {i < CURRENT_STEP_INDEX ? (
                  <Ionicons name="checkmark" size={14} color={Colors.white} />
                ) : (
                  <Text style={styles.stepDotText}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i === CURRENT_STEP_INDEX && styles.stepLabelCurrent]}>
                {t(s.labelKey as never)}
              </Text>
            </View>
          ))}
          <ProgressBar progress={(CURRENT_STEP_INDEX + 1) / STEPS.length} style={styles.progress} />
        </View>

        <View style={styles.formBlock}>
          <Text style={styles.sectionLabel}>{t('subscribe.payment.cardTitle')}</Text>
          <Card style={styles.formCard}>
            <View style={styles.cardBrandRow}>
              <Ionicons name="card" size={22} color={Colors.primary} />
              <Text style={styles.cardBrandText}>{t('subscribe.payment.securePayment')}</Text>
            </View>
            <TextField
              label={t('subscribe.payment.cardName')}
              value={cardName}
              onChangeText={setCardName}
              placeholder="Camille Dupont"
              autoCapitalize="words"
            />
            <TextField
              label={t('subscribe.payment.cardNumber')}
              value={cardNumber}
              onChangeText={(v) => setCardNumber(formatCardNumber(v))}
              placeholder="4242 4242 4242 4242"
              keyboardType="number-pad"
              maxLength={19}
            />
            <View style={styles.row}>
              <TextField
                label={t('subscribe.payment.expiry')}
                value={expiry}
                onChangeText={(v) => setExpiry(formatExpiry(v))}
                placeholder="MM/AA"
                keyboardType="number-pad"
                maxLength={5}
                style={styles.flex1}
              />
              <TextField
                label={t('subscribe.payment.cvv')}
                value={cvv}
                onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 3))}
                placeholder="123"
                keyboardType="number-pad"
                maxLength={3}
                secureTextEntry
                style={styles.flex1}
              />
            </View>
          </Card>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.legalNote}>{t('subscribe.payment.legalNote')}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('subscribe.payment.pay')} onPress={handlePay} variant="primary" size="lg" loading={processing} />
      </View>

      <DemoAutoFillFab onPress={autoFillTestCard} label={t('subscribe.payment.demoFill')} />
    </View>
  );
}

function DemoAutoFillFab({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <View style={styles.fabWrap} pointerEvents="box-none">
      <Button label={label} onPress={onPress} variant="secondary" size="sm" style={styles.fab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing['4xl'] },
  recap: { backgroundColor: Colors.primarySurface, gap: Spacing.xs },
  recapEyebrow: { ...Typography.caption },
  recapName: { ...Typography.sectionTitle },
  steps: { gap: Spacing.sm },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepDotCurrent: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  stepDotText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  stepLabel: { ...Typography.body, color: Colors.textSecondary },
  stepLabelCurrent: { ...Typography.bodyBold, color: Colors.text },
  progress: { marginTop: Spacing.sm },
  formBlock: { gap: Spacing.sm },
  sectionLabel: { ...Typography.caption, fontWeight: '700' },
  formCard: { gap: Spacing.md },
  cardBrandRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cardBrandText: { ...Typography.bodyBold, color: Colors.primary },
  row: { flexDirection: 'row', gap: Spacing.md },
  flex1: { flex: 1 },
  error: { ...Typography.body, color: Colors.danger },
  legalNote: { ...Typography.caption, textAlign: 'center' },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  fabWrap: {
    position: 'absolute',
    bottom: 96,
    right: 16,
  },
  fab: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    width: undefined,
    paddingHorizontal: Spacing.md,
  },
});
