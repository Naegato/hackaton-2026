import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/text-field';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useLocale } from '@/context/locale-context';
import type { DetailedProfile, EmployerReimbursement, Situation } from '@/lib/api';
import {
  BOURSIER_SITUATIONS,
  buildResultParams,
  CMI_SITUATIONS,
  EMPLOYER_OPTIONS,
  ENCEINTE_SITUATIONS,
  FREQUENCY_OPTIONS,
  PROFILES,
  profileLabelKey,
  RETRAITE_SITUATIONS,
  showsBoursier,
  showsCmi,
  showsEmployer,
  showsEnceinte,
  showsFrequency,
  showsRetraite,
} from '@/lib/subscribeProfiles';

type Step = 'forWho' | 'profile' | 'age' | 'frequency' | 'employer' | 'situation' | 'done';
type Message = { id: string; text: string };

export default function SubscribeAiScreen() {
  const { t } = useLocale();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([{ id: 'm0', text: t('subscribe.ai.askForWho') }]);
  const [typing, setTyping] = useState(false);
  const [step, setStep] = useState<Step>('forWho');
  const [ageInput, setAgeInput] = useState('');

  const [profile, setProfile] = useState<DetailedProfile | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [frequency, setFrequency] = useState<'quotidien' | 'souvent' | 'rarement' | null>(null);
  const [employer, setEmployer] = useState<EmployerReimbursement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, typing]);

  function pushAssistant(text: string, after: () => void) {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((m) => [...m, { id: String(m.length), text }]);
      after();
    }, 600);
  }

  function advanceAfterProfile(p: DetailedProfile, a: number | null) {
    if (a == null) {
      setStep('age');
      pushAssistant(t('subscribe.ai.askAge'), () => {});
      return;
    }
    advanceAfterAge(p, a);
  }

  function nextConditionalStep(p: DetailedProfile, a: number): Step {
    if (showsFrequency(p)) return 'frequency';
    if (showsEmployer(p, a)) return 'employer';
    if (showsBoursier(p) || showsCmi(p) || showsRetraite(p) || showsEnceinte(p)) return 'situation';
    return 'done';
  }

  function advanceAfterAge(p: DetailedProfile, a: number) {
    const next = nextConditionalStep(p, a);
    if (next === 'frequency') {
      setStep('frequency');
      pushAssistant(t('subscribe.profile.frequencyTitle'), () => {});
    } else if (next === 'employer') {
      setStep('employer');
      pushAssistant(t('subscribe.profile.employerTitle'), () => {});
    } else if (next === 'situation') {
      setStep('situation');
      pushAssistant(situationTitle(p), () => {});
    } else {
      finish(p, a, null, null, null);
    }
  }

  function advanceAfterFrequency(p: DetailedProfile, a: number, freq: typeof frequency) {
    if (showsEmployer(p, a)) {
      setStep('employer');
      pushAssistant(t('subscribe.profile.employerTitle'), () => {});
    } else {
      finish(p, a, freq, null, null);
    }
  }

  function situationTitle(p: DetailedProfile) {
    if (showsBoursier(p)) return t('subscribe.profile.boursierTitle');
    if (showsCmi(p)) return t('subscribe.profile.cmiTitle');
    if (showsRetraite(p)) return t('subscribe.profile.retraiteTitle');
    return t('subscribe.profile.enceinteTitle');
  }

  function situationOptions(p: DetailedProfile): Situation[] {
    if (showsBoursier(p)) return BOURSIER_SITUATIONS;
    if (showsCmi(p)) return CMI_SITUATIONS;
    if (showsRetraite(p)) return RETRAITE_SITUATIONS;
    return ENCEINTE_SITUATIONS;
  }

  function finish(
    p: DetailedProfile,
    a: number,
    freq: typeof frequency,
    emp: EmployerReimbursement | null,
    sit: Situation | null,
  ) {
    setStep('done');
    const usage = freq ? FREQUENCY_OPTIONS.find((f) => f.value === freq)?.usageDaysPerWeek : undefined;
    const params = buildResultParams({ age: a, profile: p, usageDaysPerWeek: usage, employerReimbursement: emp, situation: sit });
    pushAssistant('✓', () => {
      router.push({ pathname: '/subscribe/result', params });
    });
  }

  function onForWho(label: string) {
    setMessages((m) => [...m, { id: `u${m.length}`, text: label }]);
    setStep('profile');
    pushAssistant(t('subscribe.ai.askProfile'), () => {});
  }

  function onProfile(p: DetailedProfile) {
    setProfile(p);
    setMessages((m) => [...m, { id: `u${m.length}`, text: t(profileLabelKey(p)) }]);
    advanceAfterProfile(p, age);
  }

  function onAgeSubmit() {
    const a = Number(ageInput.replace(/[^0-9]/g, ''));
    if (!a || !profile) return;
    setAge(a);
    setMessages((m) => [...m, { id: `u${m.length}`, text: String(a) }]);
    setAgeInput('');
    advanceAfterAge(profile, a);
  }

  function onFrequency(value: NonNullable<typeof frequency>) {
    setFrequency(value);
    setMessages((m) => [...m, { id: `u${m.length}`, text: t(`freq.${value}` as never) }]);
    if (profile && age != null) advanceAfterFrequency(profile, age, value);
  }

  function onEmployer(value: EmployerReimbursement) {
    setEmployer(value);
    setMessages((m) => [...m, { id: `u${m.length}`, text: t(`employer.${value}` as never) }]);
    if (profile && age != null) finish(profile, age, frequency, value, null);
  }

  function onSituation(value: Situation) {
    setMessages((m) => [...m, { id: `u${m.length}`, text: t(`situation.${value}` as never) }]);
    if (profile && age != null) finish(profile, age, frequency, employer, value);
  }

  function renderChips() {
    if (step === 'forWho') {
      return (
        <View style={styles.chipsWrap}>
          <Chip
            label={t('subscribe.profile.forMe')}
            selected={false}
            onPress={() => onForWho(t('subscribe.profile.forMe'))}
          />
          <Chip
            label={t('subscribe.profile.forFamily')}
            selected={false}
            onPress={() => onForWho(t('subscribe.profile.forFamily'))}
          />
        </View>
      );
    }
    if (step === 'profile') {
      return (
        <View style={styles.chipsWrap}>
          {PROFILES.map((p) => (
            <Chip key={p} label={t(profileLabelKey(p))} selected={false} onPress={() => onProfile(p)} />
          ))}
        </View>
      );
    }
    if (step === 'frequency') {
      return (
        <View style={styles.chipsWrap}>
          {FREQUENCY_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={t(`freq.${opt.value}` as never)}
              selected={false}
              onPress={() => onFrequency(opt.value)}
            />
          ))}
        </View>
      );
    }
    if (step === 'employer') {
      return (
        <View style={styles.chipsWrap}>
          {EMPLOYER_OPTIONS.map((opt) => (
            <Chip key={opt} label={t(`employer.${opt}` as never)} selected={false} onPress={() => onEmployer(opt)} />
          ))}
        </View>
      );
    }
    if (step === 'situation' && profile) {
      return (
        <View style={styles.chipsWrap}>
          {situationOptions(profile).map((opt) => (
            <Chip
              key={opt}
              label={t(`situation.${opt}` as never)}
              selected={false}
              onPress={() => onSituation(opt)}
            />
          ))}
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.messages}>
        {messages.map((m) => (
          <View key={m.id} style={styles.bubble}>
            <Text style={styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
        {typing ? (
          <View style={[styles.bubble, styles.typingBubble]}>
            <ActivityIndicator size="small" color={Colors.primary} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        {renderChips()}
        {step === 'age' ? (
          <View style={styles.inputRow}>
            <View style={styles.inputField}>
              <TextField
                label={t('subscribe.ai.placeholder')}
                value={ageInput}
                onChangeText={setAgeInput}
                keyboardType="number-pad"
                inputMode="numeric"
                onSubmitEditing={onAgeSubmit}
                returnKeyType="go"
              />
            </View>
            <TouchableOpacity accessibilityRole="button" style={styles.sendBtn} onPress={onAgeSubmit}>
              <Ionicons name="arrow-up" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.micBtn}
          onPress={() => Alert.alert(t('subscribe.ai.title'), t('subscribe.ai.micDisabled'))}>
          <Ionicons name="mic-outline" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  messages: { padding: Spacing.lg, gap: Spacing.sm },
  bubble: {
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  typingBubble: { paddingHorizontal: Spacing.lg },
  bubbleText: { ...Typography.body },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  inputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  inputField: { flex: 1 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtn: {
    alignSelf: 'center',
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
