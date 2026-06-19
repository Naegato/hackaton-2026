import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import * as api from '@/lib/api';
import type { TicketCategory } from '@/lib/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow, Spacing } from '@/constants/Spacing';

type Template = {
  category: TicketCategory;
  label: string;
  subject: string;
  hint: string;
};

const TEMPLATES: Template[] = [
  {
    category: 'subscription',
    label: 'Abonnement',
    subject: 'Problème avec mon abonnement',
    hint: 'Décrivez votre problème (numéro de carte, type de plan, date…)',
  },
  {
    category: 'document',
    label: 'Document refusé',
    subject: 'Question sur mes documents',
    hint: 'Précisez le type de document et la raison du refus si connue.',
  },
  {
    category: 'lost-card',
    label: 'Carte perdue',
    subject: 'Carte perdue ou volée',
    hint: 'Indiquez le numéro de carte et la date de perte si possible.',
  },
  {
    category: 'transfer',
    label: 'Transfert',
    subject: "Transfert d'abonnement",
    hint: "Décrivez votre besoin de transfert (vers quel compte, quel abonnement…)",
  },
  {
    category: 'billing',
    label: 'Facturation',
    subject: 'Question de facturation',
    hint: 'Précisez la date et le montant concerné.',
  },
  {
    category: 'other',
    label: 'Autre',
    subject: 'Autre demande',
    hint: 'Décrivez votre demande avec le plus de détails possible.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Comment transférer mon abonnement ?',
    a: "Rendez-vous dans l'onglet Wallet, sélectionnez votre abonnement, puis touchez « Transférer ». Entrez l'email du compte destinataire. Le transfert doit être accepté par l'autre compte.",
  },
  {
    q: 'Mes documents ont été refusés, que faire ?',
    a: "Consultez la raison du refus dans la section Wallet > Documents. Soumettez à nouveau le document en vous assurant qu'il est lisible, non expiré et correspond bien au type demandé.",
  },
  {
    q: 'Comment renouveler mon abonnement ?',
    a: "Votre abonnement se renouvelle automatiquement avant la date d'expiration. Si vous souhaitez changer d'offre, contactez le support via ce formulaire.",
  },
  {
    q: "J'ai perdu ma carte, que dois-je faire ?",
    a: "Signalez la perte via ce formulaire (catégorie « Carte perdue »). Notre équipe traitera votre demande sous 48h ouvrées.",
  },
];

export default function SupportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selected, setSelected] = useState<Template | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSend() {
    if (!selected || !message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await api.createTicket({
        category: selected.category,
        subject: selected.subject,
        message: message.trim(),
      });
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setSelected(null);
    setMessage('');
    setSent(false);
    setError(null);
  }

  const canSend = !!selected && message.trim().length > 0 && !sending;

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + Spacing.lg, paddingBottom: Math.max(insets.bottom, Spacing['4xl']) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── En-tête ───────────────────────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backBtn}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              {/* Flèche décorative — masquée aux lecteurs d'écran via accessibilityLabel sur le parent */}
              <ThemedText style={styles.backLabel} importantForAccessibility="no-hide-descendants">
                ← Retour
              </ThemedText>
            </TouchableOpacity>

            <ThemedText style={styles.pageTitle} accessibilityRole="header">
              Aide & Support
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Consultez la FAQ ou contactez notre équipe.
            </ThemedText>
          </View>

          {/* ── FAQ ──────────────────────────────────────────────── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Questions fréquentes</ThemedText>

            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => setOpenFaq(isOpen ? null : i)}
                  style={[styles.faqItem, isOpen && styles.faqItemOpen]}
                  accessibilityRole="button"
                  accessibilityLabel={item.q}
                  accessibilityHint={isOpen ? 'Toucher pour fermer la réponse' : 'Toucher pour afficher la réponse'}
                  accessibilityState={{ expanded: isOpen }}
                >
                  <View style={styles.faqHeader}>
                    <ThemedText style={styles.faqQuestion}>{item.q}</ThemedText>
                    {/* +/− : décoratif, l'état expanded est annoncé via accessibilityState */}
                    <ThemedText style={styles.faqChevron} importantForAccessibility="no">
                      {isOpen ? '−' : '+'}
                    </ThemedText>
                  </View>
                  {isOpen && (
                    <ThemedText style={styles.faqAnswer}>{item.a}</ThemedText>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Formulaire de contact ─────────────────────────────── */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Nous contacter</ThemedText>

            {sent ? (
              // Boîte de succès — annoncée automatiquement (accessibilityLiveRegion)
              <View
                style={styles.successBox}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                <ThemedText style={styles.successTitle}>Message envoyé ✓</ThemedText>
                <ThemedText style={styles.successMsg}>
                  Notre équipe reviendra vers vous dans les meilleurs délais.
                </ThemedText>
                <TouchableOpacity
                  onPress={reset}
                  activeOpacity={0.8}
                  style={styles.newTicketBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Envoyer un nouveau message"
                >
                  <ThemedText style={styles.newTicketLabel}>Nouveau message</ThemedText>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Sélection du sujet — groupe radio */}
                <ThemedText style={styles.fieldLabel}>Sujet *</ThemedText>
                <View
                  style={styles.templates}
                  accessibilityRole="radiogroup"
                  accessibilityLabel="Choisissez le sujet de votre message"
                >
                  {TEMPLATES.map((tpl) => {
                    const isActive = selected?.category === tpl.category;
                    return (
                      <TouchableOpacity
                        key={tpl.category}
                        activeOpacity={0.8}
                        onPress={() => { setSelected(tpl); setError(null); }}
                        style={[styles.templateChip, isActive && styles.templateChipActive]}
                        accessibilityRole="radio"
                        accessibilityLabel={tpl.label}
                        accessibilityState={{ selected: isActive }}
                      >
                        <ThemedText
                          style={[styles.templateLabel, isActive && styles.templateLabelActive]}
                        >
                          {tpl.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Zone de texte — visible seulement après sélection d'un sujet */}
                {selected && (
                  <View style={styles.messageGroup}>
                    <ThemedText style={styles.fieldLabel}>Votre message *</ThemedText>
                    <ThemedText style={styles.fieldHint}>{selected.hint}</ThemedText>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={5}
                      placeholder="Décrivez votre demande…"
                      placeholderTextColor={Colors.textSecondary}
                      value={message}
                      onChangeText={setMessage}
                      textAlignVertical="top"
                      // RGAA : label explicite sur l'input
                      accessibilityLabel="Votre message"
                      accessibilityHint={selected.hint}
                    />
                  </View>
                )}

                {/* Erreur — annoncée aux lecteurs d'écran */}
                {error && (
                  <ThemedText
                    style={styles.errorText}
                    accessibilityLiveRegion="polite"
                    accessibilityRole="alert"
                  >
                    {error}
                  </ThemedText>
                )}

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!canSend}
                  style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={sending ? 'Envoi en cours' : 'Envoyer le message'}
                  accessibilityState={{ disabled: !canSend, busy: sending }}
                >
                  <ThemedText style={[styles.sendBtnLabel, !canSend && styles.sendBtnLabelDisabled]}>
                    {sending ? 'Envoi…' : 'Envoyer'}
                  </ThemedText>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles — 100 % design system (Colors.*, Spacing.*, Radius.*)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: Spacing['2xl'],
    gap: 0,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // En-tête
  header: {
    marginBottom: Spacing['3xl'],
    gap: Spacing.sm,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  backLabel: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },

  // Sections
  section: { marginBottom: Spacing['3xl'] },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },

  // FAQ
  faqItem: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
    ...Shadow.sm,
  },
  faqItemOpen: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  faqChevron: {
    fontSize: 18,
    color: Colors.primary,
    lineHeight: 20,
    fontWeight: '700',
  },
  faqAnswer: {
    marginTop: Spacing.sm,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Formulaire
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  // Hint text : Colors.textSecondary (#6B7280) = 4.83:1 sur fond blanc → conforme RGAA
  fieldHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },

  templates: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  templateChip: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    minHeight: 44,
    justifyContent: 'center',
  },
  templateChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  templateLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  templateLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },

  messageGroup: { marginBottom: Spacing.md },

  textArea: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.white,
    minHeight: 120,
  },

  errorText: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: Spacing.sm,
  },

  // Bouton Envoyer
  sendBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.xs,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendBtnLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  sendBtnLabelDisabled: {
    color: Colors.textSecondary,
  },

  // Succès
  successBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
    padding: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  successMsg: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  newTicketBtn: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
  },
  newTicketLabel: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
