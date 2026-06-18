import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { LanguagePicker } from '@/components/language-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/Colors';
import { maskFrDate } from '@/lib/date';
import { useThemeColor } from '@/hooks/use-theme-color';

export type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type Question =
  | {
      key: string;
      type: 'number';
      title: string;
      subtitle?: string;
      icon: IconName;
      placeholder?: string;
      validate?: (value: string) => string | null;
    }
  | {
      key: string;
      type: 'text';
      title: string;
      subtitle?: string;
      icon: IconName;
      placeholder?: string;
      validate?: (value: string) => string | null;
    }
  | {
      key: string;
      type: 'date';
      title: string;
      subtitle?: string;
      icon: IconName;
      placeholder?: string;
      validate?: (value: string) => string | null;
    }
  | {
      key: string;
      type: 'choice';
      title: string;
      subtitle?: string;
      icon: IconName;
      options: { label: string; value: string | number; icon?: IconName; description?: string }[];
    }
  | {
      key: string;
      type: 'boolean';
      title: string;
      subtitle?: string;
      icon: IconName;
      yesLabel: string;
      noLabel: string;
    };

export type Answers = Record<string, string | number | boolean>;

type Props = {
  questions: Question[];
  initialAnswers?: Answers;
  onSubmit: (answers: Answers) => void | Promise<void>;
  labels: { next: string; back: string; finish: string; review: string };
  onSkip?: () => void | Promise<void>;
  skipLabel?: string;
};

const REVIEW_ICON: IconName = 'fact-check';

/**
 * Formulaire en "stepper" piloté par un schéma.
 * - Progression par pictos cliquables (saut direct à l'étape) + réponse enregistrée sous chaque picto.
 * - Pictos sur questions/réponses (inclusif), sélecteur de langue intégré.
 * - Étape finale de validation récapitulant les saisies avant envoi.
 */
export function Questionnaire({
  questions,
  initialAnswers = {},
  onSubmit,
  labels,
  onSkip,
  skipLabel,
}: Props) {
  const tint = Colors.primary;
  const dimColor = useThemeColor({ light: '#c4c4c4', dark: '#555' }, 'icon');
  const textColor = useThemeColor({}, 'text');

  const reviewIndex = questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isReview = index === reviewIndex;
  const q = isReview ? null : questions[index];

  function answerLabel(question: Question): string | null {
    const a = answers[question.key];
    if (a === undefined || a === '') return null;
    if (question.type === 'choice') return question.options.find((o) => o.value === a)?.label ?? String(a);
    if (question.type === 'boolean') return a ? question.yesLabel : question.noLabel;
    return String(a);
  }

  /** Une étape est atteignable si déjà répondue (ou l'étape courante) ; le récap final si tout est rempli. */
  function canGoTo(i: number): boolean {
    if (i === index) return true;
    if (i === reviewIndex) return questions.every((qq) => answers[qq.key] !== undefined && answers[qq.key] !== '');
    return answers[questions[i].key] !== undefined && answers[questions[i].key] !== '';
  }

  function goTo(i: number) {
    if (!canGoTo(i)) return;
    setError(null);
    setIndex(i);
  }

  async function finish() {
    setSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setSubmitting(false);
    }
  }

  function goNextWith(value: string | number | boolean) {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.key]: value }));
    setError(null);
    setIndex((i) => i + 1); // dernière question → étape de validation
  }

  function onInputNext() {
    if (!q) return;
    const raw = String(answers[q.key] ?? '');
    if ((q.type === 'number' || q.type === 'text' || q.type === 'date') && q.validate) {
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
      {/* Barre du haut : langue + passer */}
      <View style={styles.topBar}>
        <LanguagePicker />
        {onSkip ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
            disabled={submitting}
            onPress={() => onSkip()}
            style={({ pressed }) => [styles.skip, pressed && styles.pressed]}>
            <ThemedText type="link">{skipLabel}</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* Progression : pictos cliquables + réponse sous chaque picto */}
      <View style={styles.progress}>
        {questions.map((item, i) => {
          const current = i === index;
          const reached = i < index || canGoTo(i);
          const color = reached || current ? tint : dimColor;
          const label = answerLabel(item);
          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              disabled={!canGoTo(i)}
              onPress={() => goTo(i)}
              style={styles.progressItem}>
              <View
                style={[
                  styles.progressIcon,
                  { borderColor: color },
                  current && { backgroundColor: tint },
                ]}>
                <MaterialIcons name={item.icon} size={24} color={current ? '#fff' : color} />
              </View>
              {label ? (
                <ThemedText style={styles.progressLabel} numberOfLines={2}>
                  {label}
                </ThemedText>
              ) : (
                <View style={styles.progressLabelSpacer} />
              )}
            </Pressable>
          );
        })}
        {/* Étape de validation */}
        <Pressable
          accessibilityRole="button"
          disabled={!canGoTo(reviewIndex)}
          onPress={() => goTo(reviewIndex)}
          style={styles.progressItem}>
          <View
            style={[
              styles.progressIcon,
              { borderColor: isReview || canGoTo(reviewIndex) ? tint : dimColor },
              isReview && { backgroundColor: tint },
            ]}>
            <MaterialIcons
              name={REVIEW_ICON}
              size={24}
              color={isReview ? '#fff' : canGoTo(reviewIndex) ? tint : dimColor}
            />
          </View>
          <View style={styles.progressLabelSpacer} />
        </Pressable>
      </View>

      {/* Corps : question courante OU récapitulatif */}
      {isReview ? (
        <ScrollView style={styles.body} contentContainerStyle={{ gap: 18 }}>
          <MaterialIcons name={REVIEW_ICON} size={56} color={tint} style={styles.bigIcon} />
          <ThemedText type="title" style={styles.question}>
            {labels.review}
          </ThemedText>
          <View style={{ gap: 10 }}>
            {questions.map((item, i) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                onPress={() => goTo(i)}
                style={({ pressed }) => [
                  styles.reviewRow,
                  { borderColor: dimColor },
                  pressed && styles.pressed,
                ]}>
                <MaterialIcons name={item.icon} size={22} color={tint} />
                <ThemedText style={styles.reviewValue}>{answerLabel(item) ?? '—'}</ThemedText>
                <MaterialIcons name="edit" size={18} color={dimColor} />
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <MaterialIcons name={q!.icon} size={56} color={tint} style={styles.bigIcon} />
          <ThemedText type="title" style={styles.question}>
            {q!.title}
          </ThemedText>
          {q!.subtitle ? <ThemedText style={styles.questionSub}>{q!.subtitle}</ThemedText> : null}

          {q!.type === 'choice' ? (
            <View style={styles.options}>
              {q!.options.map((opt) => {
                const selected = answers[q!.key] === opt.value;
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
                    {opt.icon ? (
                      <MaterialIcons name={opt.icon} size={24} color={selected ? tint : textColor} />
                    ) : null}
                    <View style={styles.optionTextWrap}>
                      <ThemedText style={selected ? { color: tint, fontWeight: '600' } : undefined}>
                        {opt.label}
                      </ThemedText>
                      {opt.description ? (
                        <ThemedText style={styles.optionDesc}>{opt.description}</ThemedText>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {q!.type === 'boolean' ? (
            <View style={styles.options}>
              {[
                { label: q!.yesLabel, value: true, icon: 'check-circle' as IconName },
                { label: q!.noLabel, value: false, icon: 'cancel' as IconName },
              ].map((opt) => {
                const selected = answers[q!.key] === opt.value;
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
                    <MaterialIcons name={opt.icon} size={24} color={selected ? tint : textColor} />
                    <ThemedText style={selected ? { color: tint, fontWeight: '600' } : undefined}>
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {q!.type === 'number' ? (
            <TextField
              label=""
              value={String(answers[q!.key] ?? '')}
              onChangeText={(v) => setAnswers((a) => ({ ...a, [q!.key]: v.replace(/[^0-9]/g, '') }))}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder={q!.placeholder}
              onSubmitEditing={onInputNext}
              returnKeyType="next"
            />
          ) : null}

          {q!.type === 'text' ? (
            <TextField
              label=""
              value={String(answers[q!.key] ?? '')}
              onChangeText={(v) => setAnswers((a) => ({ ...a, [q!.key]: v }))}
              autoCapitalize="words"
              placeholder={q!.placeholder}
              onSubmitEditing={onInputNext}
              returnKeyType="next"
            />
          ) : null}

          {q!.type === 'date' ? (
            <TextField
              label=""
              value={String(answers[q!.key] ?? '')}
              onChangeText={(v) => setAnswers((a) => ({ ...a, [q!.key]: maskFrDate(v) }))}
              keyboardType="number-pad"
              inputMode="numeric"
              maxLength={10}
              placeholder={q!.placeholder}
              onSubmitEditing={onInputNext}
              returnKeyType="next"
            />
          ) : null}

          {error ? (
            <ThemedText style={styles.error} accessibilityLiveRegion="polite">
              {error}
            </ThemedText>
          ) : null}
        </ScrollView>
      )}

      {/* Navigation */}
      <View style={styles.nav}>
        {index > 0 ? (
          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={() => goTo(index - 1)}
            style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}>
            <ThemedText type="link">{labels.back}</ThemedText>
          </Pressable>
        ) : (
          <View />
        )}

        {isReview ? (
          <Button label={labels.finish} onPress={finish} loading={submitting} />
        ) : q!.type === 'number' || q!.type === 'text' || q!.type === 'date' ? (
          <Button label={labels.next} onPress={onInputNext} />
        ) : (
          <View />
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 56 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skip: { paddingVertical: 8, paddingHorizontal: 8 },
  progress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 18,
    marginBottom: 20,
  },
  progressItem: { alignItems: 'center', width: 56 },
  progressIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressLabel: { fontSize: 11, textAlign: 'center', color: Colors.textSecondary, marginTop: 4, lineHeight: 14 },
  progressLabelSpacer: { height: 4 },
  pressed: { opacity: 0.6 },
  body: { flex: 1 },
  bodyScroll: { paddingBottom: 16 },
  bigIcon: { alignSelf: 'center', marginTop: 8 },
  question: { lineHeight: 34, textAlign: 'center', marginBottom: 4 },
  questionSub: { textAlign: 'center', opacity: 0.6, fontSize: 14, marginTop: -2 },
  options: { gap: 12, marginTop: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    minHeight: 56,
  },
  optionTextWrap: { flex: 1, gap: 2 },
  optionDesc: { fontSize: 12, opacity: 0.55 },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  reviewValue: { flex: 1 },
  error: { color: '#d33', marginTop: 14 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  navBtn: { paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
});
