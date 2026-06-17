import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TextField } from '@/components/ui/text-field';
import { useThemeColor } from '@/hooks/use-theme-color';

export type Question =
  | {
      key: string;
      type: 'number';
      title: string;
      placeholder?: string;
      validate?: (value: string) => string | null;
    }
  | {
      key: string;
      type: 'choice';
      title: string;
      options: { label: string; value: string | number }[];
    }
  | { key: string; type: 'boolean'; title: string; yesLabel: string; noLabel: string };

export type Answers = Record<string, string | number | boolean>;

type Props = {
  questions: Question[];
  initialAnswers?: Answers;
  onSubmit: (answers: Answers) => void | Promise<void>;
  labels: { next: string; back: string; finish: string };
  /** Si fourni, affiche un lien pour ignorer le questionnaire (onboarding uniquement). */
  onSkip?: () => void | Promise<void>;
  skipLabel?: string;
};

/**
 * Formulaire en "stepper" : une question par écran, barre de progression.
 * Piloté par un schéma → réutilisable (onboarding, souscription avec questions en plus, etc.).
 */
export function Questionnaire({
  questions,
  initialAnswers = {},
  onSubmit,
  labels,
  onSkip,
  skipLabel,
}: Props) {
  const tint = useThemeColor({}, 'tint');
  const dimColor = useThemeColor({ light: '#ddd', dark: '#444' }, 'icon');

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const q = questions[index];
  const isLast = index === questions.length - 1;

  async function finish(next: Answers) {
    setSubmitting(true);
    try {
      await onSubmit(next);
    } finally {
      setSubmitting(false);
    }
  }

  function goNextWith(value: string | number | boolean) {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    setError(null);
    if (isLast) {
      void finish(next);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function onNumberNext() {
    const raw = String(answers[q.key] ?? '');
    if (q.type === 'number' && q.validate) {
      const err = q.validate(raw);
      if (err) {
        setError(err);
        return;
      }
    }
    goNextWith(raw);
  }

  return (
    <ThemedView style={styles.container}>
      {/* Progression */}
      <View style={styles.progress}>
        {questions.map((item, i) => (
          <View
            key={item.key}
            style={[styles.dot, { backgroundColor: i <= index ? tint : dimColor }]}
          />
        ))}
        <ThemedText style={styles.counter}>
          {index + 1}/{questions.length}
        </ThemedText>
        {onSkip ? (
          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => onSkip()}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
            <ThemedText type="link">{skipLabel}</ThemedText>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
        <ThemedText type="title" style={styles.question}>
          {q.title}
        </ThemedText>

        {q.type === 'choice' ? (
          <View style={styles.options}>
            {q.options.map((opt) => {
              const selected = answers[q.key] === opt.value;
              return (
                <Pressable
                  key={String(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => goNextWith(opt.value)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderColor: selected ? tint : dimColor },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={selected ? { color: tint, fontWeight: '600' } : undefined}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {q.type === 'boolean' ? (
          <View style={styles.options}>
            {[
              { label: q.yesLabel, value: true },
              { label: q.noLabel, value: false },
            ].map((opt) => {
              const selected = answers[q.key] === opt.value;
              return (
                <Pressable
                  key={String(opt.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => goNextWith(opt.value)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderColor: selected ? tint : dimColor },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={selected ? { color: tint, fontWeight: '600' } : undefined}>
                    {opt.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {q.type === 'number' ? (
          <TextField
            label=""
            value={String(answers[q.key] ?? '')}
            onChangeText={(v) => setAnswers((a) => ({ ...a, [q.key]: v.replace(/[^0-9]/g, '') }))}
            keyboardType="number-pad"
            inputMode="numeric"
            placeholder={q.placeholder}
            onSubmitEditing={onNumberNext}
            returnKeyType={isLast ? 'go' : 'next'}
          />
        ) : null}

        {error ? (
          <ThemedText style={styles.error} accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        {index > 0 ? (
          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => {
              setError(null);
              setIndex((i) => i - 1);
            }}
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}>
            <ThemedText type="link">{labels.back}</ThemedText>
          </Pressable>
        ) : (
          <View />
        )}

        {q.type === 'number' ? (
          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={onNumberNext}
            style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.primaryText} lightColor="#fff" darkColor="#fff">
                {isLast ? labels.finish : labels.next}
              </ThemedText>
            )}
          </Pressable>
        ) : (
          submitting && <ActivityIndicator />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 64 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  counter: { marginLeft: 'auto', opacity: 0.6 },
  skip: { paddingVertical: 4, paddingHorizontal: 8 },
  body: { flex: 1, gap: 24 },
  question: { lineHeight: 34 },
  options: { gap: 12 },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  error: { color: '#d33' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  navBtn: { paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  primary: {
    backgroundColor: '#0a7ea4',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 28,
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryText: { fontWeight: '600', fontSize: 16 },
});
