import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import * as api from '@/lib/api';
import type { SubscriptionDetail, SubscriptionDoc } from '@/lib/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow, Spacing } from '@/constants/Spacing';

// ---------------------------------------------------------------------------
// Constantes d'affichage
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: 'En attente',         bg: '#FEF3C7', color: '#92400E' },
  'awaiting-documents': { label: 'Documents requis',   bg: '#FEF3C7', color: '#92400E' },
  active:               { label: 'Actif',              bg: '#DCFCE7', color: '#166534' },
  expired:              { label: 'Expiré',             bg: Colors.surface, color: Colors.textSecondary },
  cancelled:            { label: 'Résilié',            bg: '#FEE2E2', color: '#DC2626' },
};

const DOC_TYPE_LABEL: Record<string, string> = {
  id:     "Pièce d'identité",
  photo:  'Photo',
  school: 'Justificatif de scolarité',
  income: 'Justificatif de ressources',
  cmi:    'Carte Mobilité Inclusion',
};

const DOC_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  pending:   { label: 'En attente', bg: '#FEF3C7', color: '#92400E' },
  validated: { label: 'Validé',     bg: '#DCFCE7', color: '#166534' },
  refused:   { label: 'Refusé',     bg: '#FEE2E2', color: '#DC2626' },
};

const PERIOD_LABEL: Record<string, string> = {
  monthly: 'Mensuel',
  annual:  'Annuel',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const isCancellable = (status: string) =>
  status === 'active' || status === 'pending' || status === 'awaiting-documents';

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard} accessibilityRole="group">
      <ThemedText style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.expired;
  return (
    <View
      style={[styles.badge, { backgroundColor: cfg.bg }]}
      accessibilityLabel={`Statut : ${cfg.label}`}
    >
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

function DocRow({ doc }: { doc: SubscriptionDoc }) {
  const cfg = DOC_STATUS_CONFIG[doc.status] ?? DOC_STATUS_CONFIG.pending;
  return (
    <View
      style={styles.docRow}
      accessibilityRole="none"
      accessibilityLabel={`${DOC_TYPE_LABEL[doc.type] ?? doc.type} : ${cfg.label}${doc.refusalReason ? `, motif : ${doc.refusalReason}` : ''}`}
    >
      <ThemedText style={styles.docType}>
        {DOC_TYPE_LABEL[doc.type] ?? doc.type}
      </ThemedText>
      <View style={[styles.docBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.docBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      {doc.refusalReason ? (
        <ThemedText style={styles.docRefusal} numberOfLines={2}>
          {doc.refusalReason}
        </ThemedText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Écran principal
// ---------------------------------------------------------------------------

export default function SubscriptionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [detail, setDetail] = useState<SubscriptionDetail | null>(null);
  const [docs, setDocs] = useState<SubscriptionDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [d, docList] = await Promise.all([
        api.getSubscriptionDetail(id),
        api.listSubscriptionDocuments(id),
      ]);
      setDetail(d);
      setDocs(docList);
    } catch {
      setError('Impossible de charger les détails. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  async function handleCancel() {
    if (!id) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api.cancelSubscription(id);
      setShowCancel(false);
      await load();
    } catch {
      setCancelError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setCancelling(false);
    }
  }

  const holderName = [detail?.holderFirstName, detail?.holderLastName]
    .filter(Boolean)
    .join(' ') || '—';

  return (
    <ThemedView style={styles.container}>
      {/* En-tête */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Retour au portefeuille"
        >
          <Text style={styles.backArrow} importantForAccessibility="no">←</Text>
          <ThemedText style={styles.backLabel}>Retour</ThemedText>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <ThemedText style={styles.pageTitle} accessibilityRole="header" numberOfLines={2}>
            {detail?.plan?.name ?? 'Abonnement'}
          </ThemedText>
          {detail ? <StatusBadge status={detail.status} /> : null}
        </View>
      </View>

      {/* Contenu */}
      {loading ? (
        <View style={styles.centered} accessibilityLiveRegion="polite" accessibilityLabel="Chargement en cours">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText} accessibilityRole="alert" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
          <TouchableOpacity
            onPress={load}
            style={styles.retryBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Réessayer de charger les détails"
          >
            <ThemedText style={styles.retryLabel}>Réessayer</ThemedText>
          </TouchableOpacity>
        </View>
      ) : detail ? (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, Spacing['3xl']) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Titulaire */}
          <SectionCard title="Titulaire">
            <ThemedText style={styles.infoValue}>{holderName}</ThemedText>
            {detail.cardNumber ? (
              <ThemedText style={styles.infoSub}>N° {detail.cardNumber}</ThemedText>
            ) : null}
          </SectionCard>

          {/* Offre */}
          <SectionCard title="Offre">
            <ThemedText style={styles.infoValue}>{detail.plan?.name ?? '—'}</ThemedText>
            <View style={styles.offerMeta}>
              {detail.plan?.period ? (
                <ThemedText style={styles.infoSub}>
                  {PERIOD_LABEL[detail.plan.period] ?? detail.plan.period}
                </ThemedText>
              ) : null}
              {detail.plan?.zones ? (
                <ThemedText style={styles.infoSub}>Zones {detail.plan.zones}</ThemedText>
              ) : null}
              {detail.plan?.price != null ? (
                <ThemedText style={styles.infoSub}>
                  {detail.plan.price.toFixed(2)} € / {detail.plan.period === 'annual' ? 'an' : 'mois'}
                </ThemedText>
              ) : null}
            </View>
          </SectionCard>

          {/* Période */}
          <SectionCard title="Période de validité">
            <View style={styles.dateRow}>
              <View style={styles.dateCell}>
                <ThemedText style={styles.dateLabel}>Début</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(detail.startDate)}</ThemedText>
              </View>
              <View style={[styles.dateCell, styles.dateCellRight]}>
                <ThemedText style={styles.dateLabel}>Fin</ThemedText>
                <ThemedText style={styles.dateValue}>{formatDate(detail.endDate)}</ThemedText>
              </View>
            </View>
          </SectionCard>

          {/* Documents */}
          {docs.length > 0 ? (
            <SectionCard title="Documents">
              {docs.map((doc) => (
                <DocRow key={doc.id} doc={doc} />
              ))}
            </SectionCard>
          ) : null}

          {/* Résiliation */}
          {isCancellable(detail.status) ? (
            <TouchableOpacity
              onPress={() => setShowCancel(true)}
              style={styles.cancelBtn}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Résilier cet abonnement"
              accessibilityHint="Cette action est irréversible"
            >
              <ThemedText style={styles.cancelBtnLabel}>Résilier l'abonnement</ThemedText>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      ) : null}

      {/* Modal de confirmation de résiliation */}
      <Modal
        visible={showCancel}
        transparent
        animationType="fade"
        statusBarTranslucent
        accessibilityViewIsModal
        onRequestClose={() => { if (!cancelling) setShowCancel(false); }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <ThemedText style={styles.dialogTitle} accessibilityRole="header">
              Résilier votre abonnement ?
            </ThemedText>
            <ThemedText style={styles.dialogMsg}>
              Votre abonnement{detail?.plan?.name ? ` « ${detail.plan.name} »` : ''} sera résilié
              immédiatement. Cette action est irréversible.
            </ThemedText>

            {cancelError ? (
              <ThemedText
                style={styles.dialogError}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {cancelError}
              </ThemedText>
            ) : null}

            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelling}
              style={[styles.dialogConfirm, cancelling && styles.dialogBtnDisabled]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Confirmer la résiliation"
              accessibilityState={{ disabled: cancelling, busy: cancelling }}
            >
              {cancelling ? (
                <ActivityIndicator color={Colors.white} accessibilityLabel="Résiliation en cours" />
              ) : (
                <ThemedText style={styles.dialogConfirmLabel}>Confirmer la résiliation</ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { setShowCancel(false); setCancelError(null); }}
              disabled={cancelling}
              style={[styles.dialogCancel, cancelling && styles.dialogBtnDisabled]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Annuler, conserver l'abonnement"
              accessibilityState={{ disabled: cancelling }}
            >
              <ThemedText style={styles.dialogCancelLabel}>Conserver l'abonnement</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },

  // En-tête
  header: {
    paddingHorizontal: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
    minHeight: 44,
  },
  backArrow: { fontSize: 18, color: Colors.primary, lineHeight: 22 },
  backLabel: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 26,
    flex: 1,
  },

  // Badge statut
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  // États loading/error
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.lg,
  },
  errorText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    minHeight: 44,
    justifyContent: 'center',
  },
  retryLabel: { color: Colors.white, fontWeight: '600', fontSize: 14 },

  // Contenu
  content: { padding: Spacing['2xl'], gap: Spacing.md },

  // Section cards
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  infoValue: { fontSize: 16, fontWeight: '600', color: Colors.text },
  infoSub: { fontSize: 13, color: Colors.textSecondary },
  offerMeta: { gap: 2 },

  // Dates
  dateRow: { flexDirection: 'row', gap: Spacing.lg },
  dateCell: { flex: 1, gap: 2 },
  dateCellRight: {
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
    paddingLeft: Spacing.lg,
  },
  dateLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.4 },
  dateValue: { fontSize: 14, fontWeight: '500', color: Colors.text, lineHeight: 20 },

  // Documents
  docRow: { gap: Spacing.xs },
  docType: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  docBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start' },
  docBadgeText: { fontSize: 11, fontWeight: '700' },
  docRefusal: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16, fontStyle: 'italic' },

  // Bouton résiliation
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#DC2626',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.sm,
  },
  cancelBtnLabel: { color: '#DC2626', fontSize: 15, fontWeight: '600' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  dialog: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing['2xl'],
    width: '100%',
    maxWidth: 360,
    gap: Spacing.md,
    ...Shadow.md,
  },
  dialogTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  dialogMsg: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  dialogError: { fontSize: 13, color: '#DC2626', textAlign: 'center' },
  dialogConfirm: {
    marginTop: Spacing.xs,
    backgroundColor: '#DC2626',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  dialogBtnDisabled: { opacity: 0.5 },
  dialogConfirmLabel: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  dialogCancel: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialogCancelLabel: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
});
