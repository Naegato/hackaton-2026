import { useState } from 'react';
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
import { useRouter } from 'expo-router';

import * as api from '@/lib/api';
import { LanguagePicker } from '@/components/language-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { Radius, Shadow, Spacing } from '@/constants/Spacing';
import { useAuth } from '@/context/auth-context';
import { useLocale } from '@/context/locale-context';

// #DC2626 = rouge RGAA-conforme sur fond blanc (4.61:1) et texte blanc sur ce fond (4.61:1)
const DANGER_ACCESSIBLE = '#DC2626';

// ---------------------------------------------------------------------------
// Sous-composants
// ---------------------------------------------------------------------------

function Avatar({ firstName, lastName, email }: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}) {
  const initials = [firstName?.[0], lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || email?.[0]?.toUpperCase() || '?';
  return (
    // Décoratif : le nom est affiché à côté, le lecteur d'écran n'a pas besoin de l'avatar
    <View style={styles.avatar} importantForAccessibility="no-hide-descendants" aria-hidden>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

function NavRow({
  label,
  accessibilityLabel,
  accessibilityHint,
  onPress,
  right,
}: {
  label: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.navRow}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
    >
      <ThemedText style={styles.navRowLabel}>{label}</ThemedText>
      {right ?? (
        // Chevron décoratif — masqué aux lecteurs d'écran
        <Text style={styles.navRowChevron} importantForAccessibility="no">›</Text>
      )}
    </TouchableOpacity>
  );
}

function Separator() {
  return (
    <View
      style={styles.separator}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
    />
  );
}

// ---------------------------------------------------------------------------
// Écran principal
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const isStaff = user?.roles?.some((r) => ['developer', 'admin', 'comutitres_manager'].includes(r));

  async function handleDeleteAccount() {
    setDeleting(true);
    setErrorMsg(null);
    try {
      await api.deleteAccount();
      setShowConfirm(false);
      await signOut();
    } catch {
      setDeleting(false);
      setErrorMsg(t('profile.deleteAccountError'));
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing['2xl'], paddingBottom: Math.max(insets.bottom, Spacing['3xl']) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Zone utilisateur ─────────────────────────────────────── */}
        <View style={styles.userSection}>
          <Avatar firstName={user?.firstName} lastName={user?.lastName} email={user?.email} />
          <View style={styles.userInfo}>
            {fullName ? (
              <ThemedText style={styles.userName} accessibilityRole="header">
                {fullName}
              </ThemedText>
            ) : null}
            <ThemedText style={styles.userEmail}>{user?.email}</ThemedText>
            {user?.roles?.length ? (
              <ThemedText style={styles.userRole}>
                {t('profile.role')} : {user.roles.join(', ')}
              </ThemedText>
            ) : null}
          </View>
        </View>

        {/* ── Navigation ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <NavRow
            label={t('profile.preferences')}
            accessibilityLabel="Modifier mes préférences de profil"
            accessibilityHint="Ouvre l'écran de préférences"
            onPress={() => router.push('/preferences')}
          />
          <Separator />
          {/* Langue */}
          <View style={styles.navRow} accessibilityRole="none">
            <ThemedText style={styles.navRowLabel}>{t('common.language')}</ThemedText>
            <LanguagePicker />
          </View>
          <Separator />
          <NavRow
            label="Aide & Support"
            accessibilityLabel="Accéder à l'aide et au support"
            accessibilityHint="FAQ et formulaire de contact"
            onPress={() => router.push('/support')}
          />
          {isStaff && (
            <>
              <Separator />
              <NavRow
                label="Test vérification photo"
                accessibilityLabel="Ouvrir l'écran de test de vérification photo"
                onPress={() => router.push('/test-photo')}
              />
            </>
          )}
        </View>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={signOut}
          style={styles.signOutBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('profile.signOut')}
        >
          <ThemedText style={styles.signOutLabel}>{t('profile.signOut')}</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowConfirm(true)}
          style={styles.deleteBtn}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t('profile.deleteAccount')}
          accessibilityHint="Cette action est irréversible"
        >
          <ThemedText style={styles.deleteBtnLabel}>{t('profile.deleteAccount')}</ThemedText>
        </TouchableOpacity>

        {/* Informations légales */}
        <ThemedText style={styles.legalSectionLabel}>Informations légales</ThemedText>
        <View style={styles.card}>
          <NavRow
            label="Conditions Générales d'Utilisation"
            accessibilityHint="Ouvre les CGU"
            onPress={() => router.push('/legal/terms')}
          />
          <Separator />
          <NavRow
            label="Politique de confidentialité"
            accessibilityHint="Ouvre la politique de confidentialité"
            onPress={() => router.push('/legal/privacy')}
          />
          <Separator />
          <NavRow
            label="Mentions légales"
            accessibilityHint="Ouvre les mentions légales"
            onPress={() => router.push('/legal/legal-notice')}
          />
        </View>
      </ScrollView>

      {/* ── Modal de confirmation ──────────────────────────────────── */}
      <Modal
        visible={showConfirm}
        transparent
        animationType="fade"
        statusBarTranslucent
        accessibilityViewIsModal
        onRequestClose={() => { if (!deleting) setShowConfirm(false); }}
      >
        <View style={styles.overlay}>
          <View
            style={styles.dialog}
            accessibilityRole="none"
          >
            <ThemedText style={styles.dialogTitle} accessibilityRole="header">
              {t('profile.deleteAccountTitle')}
            </ThemedText>

            <ThemedText style={styles.dialogMsg}>
              {t('profile.deleteAccountMsg')}
            </ThemedText>

            {/* Erreur — annoncée aux lecteurs d'écran */}
            {errorMsg ? (
              <ThemedText
                style={styles.dialogError}
                accessibilityLiveRegion="polite"
                accessibilityRole="alert"
              >
                {errorMsg}
              </ThemedText>
            ) : null}

            {/* Bouton confirmer */}
            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={deleting}
              style={[styles.dialogConfirm, deleting && styles.dialogBtnDisabled]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('profile.deleteAccountConfirm')}
              accessibilityState={{ disabled: deleting, busy: deleting }}
            >
              {deleting ? (
                <ActivityIndicator color={Colors.white} accessibilityLabel="Suppression en cours" />
              ) : (
                <ThemedText style={styles.dialogConfirmLabel}>
                  {t('profile.deleteAccountConfirm')}
                </ThemedText>
              )}
            </TouchableOpacity>

            {/* Bouton annuler */}
            <TouchableOpacity
              onPress={() => { setShowConfirm(false); setErrorMsg(null); }}
              disabled={deleting}
              style={[styles.dialogCancel, deleting && styles.dialogBtnDisabled]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t('profile.deleteAccountCancel')}
              accessibilityState={{ disabled: deleting }}
            >
              <ThemedText style={styles.dialogCancelLabel}>
                {t('profile.deleteAccountCancel')}
              </ThemedText>
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
  content: {
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },

  // Zone utilisateur
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 24,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  userRole: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Carte navigation
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    ...Shadow.sm,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    minHeight: 52,
    backgroundColor: Colors.white,
  },
  navRowLabel: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
  },
  navRowChevron: {
    fontSize: 20,
    color: Colors.textTertiary,
    lineHeight: 24,
    marginLeft: Spacing.sm,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  // Bouton Se déconnecter
  signOutBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: Spacing.lg,
  },
  signOutLabel: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },

  // Bouton Supprimer le compte (outline danger, RGAA-conforme)
  deleteBtn: {
    borderWidth: 1.5,
    borderColor: DANGER_ACCESSIBLE,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginBottom: Spacing.lg,
  },
  deleteBtnLabel: {
    color: DANGER_ACCESSIBLE,
    fontSize: 15,
    fontWeight: '600',
  },

  // Modal overlay
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
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  dialogMsg: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogError: {
    fontSize: 13,
    color: DANGER_ACCESSIBLE,
    textAlign: 'center',
  },
  dialogConfirm: {
    marginTop: Spacing.xs,
    backgroundColor: DANGER_ACCESSIBLE,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  dialogBtnDisabled: { opacity: 0.5 },
  dialogConfirmLabel: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  dialogCancel: {
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dialogCancelLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  legalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
});
