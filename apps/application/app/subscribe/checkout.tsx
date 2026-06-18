import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';

const STEPS: { key: string; labelKey: string }[] = [
  { key: 'offer', labelKey: 'subscribe.checkout.stepOffer' },
  { key: 'info', labelKey: 'subscribe.checkout.stepInfo' },
  { key: 'documents', labelKey: 'subscribe.checkout.stepDocuments' },
  { key: 'payment', labelKey: 'subscribe.checkout.stepPayment' },
  { key: 'confirmation', labelKey: 'subscribe.checkout.stepConfirmation' },
];
const CURRENT_STEP_INDEX = 2; // "Justificatifs" — pas de vrai tunnel paiement dans cette itération

export default function SubscribeCheckoutScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string; planName?: string }>();
  const [documentUri, setDocumentUri] = useState<string | null>(null);

  async function pickDocument() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', "Autorisez l'accès aux photos pour continuer.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) setDocumentUri(result.assets[0].uri);
  }

  function goConfirm() {
    router.push({ pathname: '/subscribe/confirmation', params: { planId: params.planId, planName: params.planName } });
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

        <View style={styles.uploadBlock}>
          <Text style={styles.sectionLabel}>{t('subscribe.checkout.uploadTitle')}</Text>
          <Card style={styles.uploadZone}>
            <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
            <Text style={styles.uploadSub}>{t('subscribe.checkout.uploadSub')}</Text>
            {documentUri ? <Text style={styles.uploadDone}>✓ {documentUri.split('/').pop()}</Text> : null}
            <Button label={t('subscribe.checkout.chooseFile')} onPress={pickDocument} variant="outline" size="sm" />
          </Card>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('subscribe.checkout.continue')} onPress={goConfirm} variant="primary" size="lg" />
        <Button label={t('subscribe.checkout.later')} onPress={goConfirm} variant="ghost" size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: Spacing.lg, gap: Spacing.lg },
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
  uploadBlock: { gap: Spacing.sm },
  sectionLabel: { ...Typography.caption, fontWeight: '700' },
  uploadZone: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing['2xl'] },
  uploadSub: { ...Typography.caption },
  uploadDone: { ...Typography.bodyBold, color: Colors.success },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
