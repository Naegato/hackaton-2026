import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DocumentExampleButton } from '@/components/document-example-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';
import {
  createSubscription,
  findMySubscription,
  getRecommendation,
  listSubscriptionDocuments,
  uploadSubscriptionDocument,
  type DocStatus,
  type DocType,
  type RecommendationResult,
  type SubscriptionDoc,
} from '@/lib/api';
import type { TranslationKey } from '@/lib/i18n';
import { requiredDocumentTypes } from '@/lib/plan-eligibility';

type Plan = RecommendationResult['plans'][number];
type LocalAsset = { uri: string; name: string; mimeType: string };

const STATUS_COLOR: Record<DocStatus, string> = {
  pending: Colors.warning,
  validated: Colors.success,
  refused: Colors.danger,
};

async function pickImage(): Promise<LocalAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission', "Autorisez l'accès aux photos pour ajouter un document.");
    return null;
  }
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  const ext = (a.mimeType ?? 'image/jpeg').split('/')[1] ?? 'jpg';
  return { uri: a.uri, name: a.fileName ?? `document.${ext}`, mimeType: a.mimeType ?? 'image/jpeg' };
}

export default function SubscribeScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useLocale();
  const { user } = useAuth();
  const router = useRouter();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [serverDocs, setServerDocs] = useState<Record<string, SubscriptionDoc>>({});
  const [localAssets, setLocalAssets] = useState<Record<string, LocalAsset>>({});
  const [submitting, setSubmitting] = useState(false);
  // Pour qui ? « moi » (nom du compte) ou « un proche » (nom saisi → apparaît dans « pour mes proches »)
  const [forWhom, setForWhom] = useState<'me' | 'relative'>('me');
  const [relFirst, setRelFirst] = useState('');
  const [relLast, setRelLast] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await getRecommendation({});
      const found = res.plans.find((p) => p.slug === slug) ?? null;
      setPlan(found);
      if (found) {
        const existing = await findMySubscription(found.id);
        if (existing) {
          setSubscriptionId(existing.id);
          const docs = await listSubscriptionDocuments(existing.id);
          setServerDocs(Object.fromEntries(docs.map((d) => [d.type, d])));
        }
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function addDocument(type: DocType) {
    const asset = await pickImage();
    if (asset) setLocalAssets((prev) => ({ ...prev, [type]: asset }));
  }

  async function submit() {
    if (!plan) return;
    setSubmitting(true);
    try {
      // Crée l'abonnement au premier passage
      let subId = subscriptionId;
      if (!subId) {
        const holderFirstName = forWhom === 'relative' ? relFirst.trim() : user?.firstName ?? undefined;
        const holderLastName = forWhom === 'relative' ? relLast.trim() : user?.lastName ?? undefined;
        const { doc } = await createSubscription({
          plan: plan.id,
          holderFirstName,
          holderLastName,
        });
        subId = doc.id;
        setSubscriptionId(subId);
      }
      // Téléverse les documents nouvellement choisis
      for (const [type, asset] of Object.entries(localAssets)) {
        await uploadSubscriptionDocument(asset, { type: type as DocType, subscription: subId });
      }
      // Recharge les statuts et vide le local
      const docs = await listSubscriptionDocuments(subId);
      setServerDocs(Object.fromEntries(docs.map((d) => [d.type, d])));
      setLocalAssets({});
      Alert.alert(t('subscribe.successTitle'), t('subscribe.successBody'));
    } catch (e) {
      Alert.alert(t('subscribe.errorTitle'), e instanceof Error ? e.message : t('offers.loadError'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: t('subscribe.title') }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }
  if (!plan) {
    return (
      <ThemedView style={styles.center}>
        <Stack.Screen options={{ title: t('subscribe.title') }} />
        <ThemedText>{t('offers.loadError')}</ThemedText>
      </ThemedView>
    );
  }

  const types = requiredDocumentTypes(plan);
  // Chaque type doit être fourni (déjà côté serveur ou choisi localement)
  const allProvided = types.every((ty) => serverDocs[ty] || localAssets[ty]);
  const hasNewUploads = Object.keys(localAssets).length > 0;
  // Pour un proche : nom + prénom requis (≥ 2 caractères)
  const relativeOk = forWhom === 'me' || (relFirst.trim().length >= 2 && relLast.trim().length >= 2);
  const canSubmit = subscriptionId ? hasNewUploads : allProvided && relativeOk;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: t('subscribe.title') }} />

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{plan.name}</ThemedText>

        {/* Pour qui ? (choix disponible tant que l'abonnement n'est pas créé) */}
        {!subscriptionId ? (
          <View style={styles.forWhomBox}>
            <ThemedText type="defaultSemiBold">{t('subscribe.forWhom')}</ThemedText>
            <View style={styles.segment}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: forWhom === 'me' }}
                onPress={() => setForWhom('me')}
                style={[styles.segBtn, forWhom === 'me' && styles.segBtnOn]}>
                <ThemedText
                  lightColor={forWhom === 'me' ? '#fff' : Colors.primary}
                  darkColor={forWhom === 'me' ? '#fff' : Colors.primary}
                  style={styles.segText}>
                  {t('subscribe.forMe')}
                </ThemedText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: forWhom === 'relative' }}
                onPress={() => setForWhom('relative')}
                style={[styles.segBtn, forWhom === 'relative' && styles.segBtnOn]}>
                <ThemedText
                  lightColor={forWhom === 'relative' ? '#fff' : Colors.primary}
                  darkColor={forWhom === 'relative' ? '#fff' : Colors.primary}
                  style={styles.segText}>
                  {t('subscribe.forRelative')}
                </ThemedText>
              </Pressable>
            </View>
            {forWhom === 'relative' ? (
              <>
                <TextField
                  label={t('common.firstName')}
                  value={relFirst}
                  onChangeText={setRelFirst}
                  autoCapitalize="words"
                  placeholder={t('relative.q.firstNamePlaceholder')}
                />
                <TextField
                  label={t('common.lastName')}
                  value={relLast}
                  onChangeText={setRelLast}
                  autoCapitalize="words"
                  placeholder={t('relative.q.lastNamePlaceholder')}
                />
                <ThemedText style={styles.note}>{t('subscribe.relativeHint')}</ThemedText>
              </>
            ) : null}
          </View>
        ) : null}

        <ThemedText style={styles.intro}>{t('subscribe.docsIntro')}</ThemedText>

        {types.map((type) => {
          const doc = serverDocs[type];
          const local = localAssets[type];
          const validated = doc?.status === 'validated';
          return (
            <View key={type} style={styles.card}>
              <View style={styles.cardHead}>
                <MaterialIcons name="description" size={20} color={Colors.primary} />
                <ThemedText type="defaultSemiBold" style={styles.docTitle}>
                  {t(`doc.${type}` as TranslationKey)}
                </ThemedText>
              </View>

              {/* Ce qui est accepté */}
              <ThemedText style={styles.accept}>{t(`doc.${type}.accept` as TranslationKey)}</ThemedText>
              <ThemedText style={styles.formats}>{t('subscribe.acceptedFormats')}</ThemedText>

              {/* Exemple attendu (picto-bouton → modal) */}
              <DocumentExampleButton type={type} />

              {/* Statut serveur OU document ajouté localement */}
              {doc ? (
                <View style={styles.statusRow}>
                  <View style={[styles.dot, { backgroundColor: STATUS_COLOR[doc.status] }]} />
                  <ThemedText style={[styles.statusText, { color: STATUS_COLOR[doc.status] }]}>
                    {t(`docStatus.${doc.status}` as TranslationKey)}
                  </ThemedText>
                </View>
              ) : local ? (
                <View style={styles.statusRow}>
                  <MaterialIcons name="check-circle" size={16} color={Colors.success} />
                  <ThemedText style={[styles.statusText, { color: Colors.success }]}>
                    {t('subscribe.added')}
                  </ThemedText>
                </View>
              ) : null}

              {/* Message de refus */}
              {doc?.status === 'refused' && doc.refusalReason ? (
                <ThemedText style={styles.refusal}>{doc.refusalReason}</ThemedText>
              ) : null}

              {/* Action : ajouter / remplacer (sauf si validé) */}
              {!validated ? (
                <Button
                  label={doc || local ? t('subscribe.replace') : t('subscribe.add')}
                  variant="outline"
                  size="sm"
                  onPress={() => addDocument(type)}
                  style={styles.addBtn}
                />
              ) : null}
            </View>
          );
        })}

        {!canSubmit && !subscriptionId ? (
          <ThemedText style={styles.note}>{t('subscribe.missing')}</ThemedText>
        ) : null}
        <ThemedText style={styles.note}>{t('subscribe.note')}</ThemedText>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={submitting ? t('subscribe.uploading') : subscriptionId ? t('subscribe.updateDocs') : t('subscribe.confirm')}
          onPress={submit}
          loading={submitting}
          disabled={!canSubmit || submitting}
          style={styles.cta}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 14 },
  intro: { opacity: 0.7 },
  forWhomBox: { gap: 10 },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 999,
    overflow: 'hidden',
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  segBtnOn: { backgroundColor: Colors.primary },
  segText: { fontSize: 14, fontWeight: '600' },
  card: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  docTitle: { flex: 1, fontSize: 16 },
  accept: { fontSize: 13, opacity: 0.8 },
  formats: { fontSize: 12, opacity: 0.55 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  refusal: { fontSize: 13, color: Colors.danger, backgroundColor: Colors.dangerLight, borderRadius: 8, padding: 10 },
  addBtn: { alignSelf: 'flex-start', marginTop: 4 },
  note: { fontSize: 13, opacity: 0.6 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  cta: { width: '100%' },
});
