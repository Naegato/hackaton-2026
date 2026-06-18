import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import * as api from '@/lib/api';
import type { LegalPage, LexicalNode } from '@/lib/api';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useLocale } from '@/context/locale-context';

// ---------------------------------------------------------------------------
// Rendu Lexical → React Native
// ---------------------------------------------------------------------------

function renderInline(nodes: LexicalNode[]): React.ReactNode[] {
  return nodes.map((node, i) => {
    if (node.type === 'linebreak') return <Text key={i}>{'\n'}</Text>;

    if (node.type === 'text') {
      const bold = ((node.format ?? 0) & 1) !== 0;
      const italic = ((node.format ?? 0) & 2) !== 0;
      const underline = ((node.format ?? 0) & 8) !== 0;
      return (
        <Text
          key={i}
          style={{
            fontWeight: bold ? '700' : undefined,
            fontStyle: italic ? 'italic' : undefined,
            textDecorationLine: underline ? 'underline' : undefined,
          }}
        >
          {node.text ?? ''}
        </Text>
      );
    }

    if (node.children?.length) {
      return <Text key={i}>{renderInline(node.children)}</Text>;
    }

    return null;
  });
}

function LexicalBlock({
  node,
  listType,
  listIndex,
}: {
  node: LexicalNode;
  listType?: 'bullet' | 'number';
  listIndex?: number;
}) {
  switch (node.type) {
    case 'heading': {
      const tagStyles: Record<string, object> = {
        h1: { fontSize: 22, fontWeight: '700', marginTop: Spacing['2xl'], marginBottom: Spacing.sm },
        h2: { fontSize: 18, fontWeight: '700', marginTop: Spacing.xl, marginBottom: Spacing.sm },
        h3: { fontSize: 16, fontWeight: '600', marginTop: Spacing.lg, marginBottom: Spacing.xs },
        h4: { fontSize: 15, fontWeight: '600', marginTop: Spacing.md, marginBottom: Spacing.xs },
      };
      const s = tagStyles[node.tag ?? 'h2'] ?? tagStyles.h2;
      return (
        <ThemedText style={[styles.heading, s]} accessibilityRole="header">
          {renderInline(node.children ?? [])}
        </ThemedText>
      );
    }

    case 'paragraph': {
      const hasContent = (node.children ?? []).some(
        (c) => c.type !== 'linebreak' && (c.text ?? '').trim() !== ''
      );
      if (!hasContent) return <View style={styles.spacer} />;
      return (
        <ThemedText style={styles.paragraph}>
          {renderInline(node.children ?? [])}
        </ThemedText>
      );
    }

    case 'list': {
      return (
        <View style={styles.listContainer} accessibilityRole="list">
          {(node.children ?? []).map((item, i) => (
            <LexicalBlock
              key={i}
              node={item}
              listType={node.listType ?? 'bullet'}
              listIndex={i + 1}
            />
          ))}
        </View>
      );
    }

    case 'listitem': {
      const bullet = listType === 'number' ? `${listIndex}.` : '•';
      return (
        <View style={styles.listItem} accessibilityRole="listitem">
          <Text style={styles.listBullet} importantForAccessibility="no">
            {bullet}
          </Text>
          <ThemedText style={styles.listText}>
            {renderInline(node.children ?? [])}
          </ThemedText>
        </View>
      );
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Écran
// ---------------------------------------------------------------------------

const PAGE_LABELS: Record<string, string> = {
  terms: "Conditions Générales d'Utilisation",
  'sales-terms': 'Conditions Générales de Vente',
  privacy: 'Politique de confidentialité',
  'legal-notice': 'Mentions légales',
  faq: 'FAQ',
  help: 'Aide',
};

export default function LegalScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { locale } = useLocale();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    api
      .fetchLegalPage(slug, locale)
      .then(setPage)
      .catch(() => setError('Impossible de charger la page. Veuillez réessayer.'))
      .finally(() => setLoading(false));
  }, [slug, locale]);

  const title = page?.title ?? PAGE_LABELS[slug ?? ''] ?? 'Page légale';
  const blocks = page?.content?.root?.children ?? [];

  return (
    <ThemedView style={styles.container}>
      {/* En-tête fixe */}
      <View
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
        accessibilityRole="none"
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Text style={styles.backArrow} importantForAccessibility="no">
            ←
          </Text>
          <ThemedText style={styles.backLabel}>Retour</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.pageTitle} accessibilityRole="header" numberOfLines={2}>
          {title}
        </ThemedText>
      </View>

      {/* Contenu */}
      {loading ? (
        <View
          style={styles.centered}
          accessibilityLiveRegion="polite"
          accessibilityLabel="Chargement en cours"
        >
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText
            style={styles.errorText}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            {error}
          </ThemedText>
          <TouchableOpacity
            onPress={() => {
              setLoading(true);
              setError(null);
              api
                .fetchLegalPage(slug ?? '', locale)
                .then(setPage)
                .catch(() => setError('Impossible de charger la page. Veuillez réessayer.'))
                .finally(() => setLoading(false));
            }}
            style={styles.retryBtn}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Réessayer de charger la page"
          >
            <ThemedText style={styles.retryLabel}>Réessayer</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, Spacing['3xl']) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {blocks.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              Contenu à venir.
            </ThemedText>
          ) : (
            blocks.map((node, i) => <LexicalBlock key={i} node={node} />)
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },

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
  backArrow: {
    fontSize: 18,
    color: Colors.primary,
    lineHeight: 22,
  },
  backLabel: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 26,
  },

  // États
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
    gap: Spacing.lg,
  },
  errorText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing['2xl'],
    minHeight: 44,
    justifyContent: 'center',
  },
  retryLabel: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing['3xl'],
  },

  // Contenu Lexical
  content: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: Spacing.xl,
  },
  heading: {
    color: Colors.text,
  },
  paragraph: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  spacer: { height: Spacing.sm },
  listContainer: { marginBottom: Spacing.md },
  listItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  listBullet: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    minWidth: 16,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
});
