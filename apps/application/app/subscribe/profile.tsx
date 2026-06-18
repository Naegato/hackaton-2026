import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { ProgressBar } from '@/components/ui/ProgressBar';
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

export default function SubscribeProfileScreen() {
  const { t } = useLocale();
  const router = useRouter();

  const [forWho, setForWho] = useState<'moi' | 'famille'>('moi');
  const [profile, setProfile] = useState<DetailedProfile | null>(null);
  const [age, setAge] = useState(35);
  const [frequency, setFrequency] = useState<'quotidien' | 'souvent' | 'rarement' | null>(null);
  const [employer, setEmployer] = useState<EmployerReimbursement | null>(null);
  const [situation, setSituation] = useState<Situation | null>(null);

  const needsFrequency = showsFrequency(profile);
  const needsEmployer = showsEmployer(profile, age);
  const needsBoursier = showsBoursier(profile);
  const needsCmi = showsCmi(profile);
  const needsRetraite = showsRetraite(profile);
  const needsEnceinte = showsEnceinte(profile);
  const needsSituation = needsBoursier || needsCmi || needsRetraite || needsEnceinte;

  const { progress, canSubmit } = useMemo(() => {
    let total = 2; // profil + âge
    let done = (profile ? 1 : 0) + 1; // âge toujours rempli (valeur par défaut)
    if (needsFrequency) {
      total += 1;
      done += frequency ? 1 : 0;
    }
    if (needsEmployer) {
      total += 1;
      done += employer ? 1 : 0;
    }
    if (needsSituation) {
      total += 1;
      done += situation ? 1 : 0;
    }
    return {
      progress: done / total,
      canSubmit:
        !!profile &&
        (!needsFrequency || !!frequency) &&
        (!needsEmployer || !!employer) &&
        (!needsSituation || !!situation),
    };
  }, [profile, needsFrequency, frequency, needsEmployer, employer, needsSituation, situation]);

  function situationOptions(): Situation[] {
    if (needsBoursier) return BOURSIER_SITUATIONS;
    if (needsCmi) return CMI_SITUATIONS;
    if (needsRetraite) return RETRAITE_SITUATIONS;
    if (needsEnceinte) return ENCEINTE_SITUATIONS;
    return [];
  }

  function situationTitleKey() {
    if (needsBoursier) return t('subscribe.profile.boursierTitle');
    if (needsCmi) return t('subscribe.profile.cmiTitle');
    if (needsRetraite) return t('subscribe.profile.retraiteTitle');
    return t('subscribe.profile.enceinteTitle');
  }

  function situationLabelKey() {
    if (needsBoursier) return t('subscribe.profile.boursierLabel');
    if (needsCmi) return t('subscribe.profile.cmiLabel');
    if (needsRetraite) return t('subscribe.profile.retraiteLabel');
    return t('subscribe.profile.enceinteLabel');
  }

  function onSubmit() {
    if (!profile || !canSubmit) return;
    const usage = frequency ? FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.usageDaysPerWeek : undefined;
    const params = buildResultParams({
      age,
      profile,
      usageDaysPerWeek: usage,
      employerReimbursement: employer,
      situation,
    });
    router.push({ pathname: '/subscribe/result', params });
  }

  return (
    <View style={styles.container}>
      <ProgressBar progress={progress} style={styles.progress} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>{t('subscribe.profile.forWhoLabel')}</Text>
        <Text style={styles.title}>{t('subscribe.profile.forWhoTitle')}</Text>
        <View style={styles.row}>
          <Chip label={t('subscribe.profile.forMe')} selected={forWho === 'moi'} onPress={() => setForWho('moi')} />
          <Chip
            label={t('subscribe.profile.forFamily')}
            selected={forWho === 'famille'}
            onPress={() => setForWho('famille')}
          />
        </View>

        <Text style={styles.label}>{t('subscribe.profile.profileLabel')}</Text>
        <Text style={styles.title}>{t('subscribe.profile.profileTitle')}</Text>
        <View style={styles.wrap}>
          {PROFILES.map((p) => (
            <Chip key={p} label={t(profileLabelKey(p))} selected={profile === p} onPress={() => setProfile(p)} />
          ))}
        </View>

        <Text style={styles.label}>{t('subscribe.profile.ageLabel')}</Text>
        <Text style={styles.title}>{t('subscribe.profile.ageTitle')}</Text>
        <View style={styles.stepperRow}>
          <Button
            label="−"
            variant="outline"
            size="sm"
            onPress={() => setAge((a) => Math.max(0, a - 1))}
            style={styles.stepperBtn}
            textStyle={styles.stepperBtnText}
          />
          <View style={styles.stepperCenter}>
            <TextField
              label={t('subscribe.profile.ageUnit')}
              value={String(age)}
              onChangeText={(v) => setAge(Number(v.replace(/[^0-9]/g, '')) || 0)}
              keyboardType="number-pad"
              inputMode="numeric"
              style={styles.stepperValue}
            />
          </View>
          <Button
            label="+"
            variant="outline"
            size="sm"
            onPress={() => setAge((a) => Math.min(120, a + 1))}
            style={styles.stepperBtn}
            textStyle={styles.stepperBtnText}
          />
        </View>

        {needsFrequency ? (
          <>
            <Text style={styles.label}>{t('subscribe.profile.frequencyLabel')}</Text>
            <Text style={styles.title}>{t('subscribe.profile.frequencyTitle')}</Text>
            <View style={styles.optionsCol}>
              {FREQUENCY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: frequency === opt.value }}
                  onPress={() => setFrequency(opt.value)}
                  style={[styles.optionCard, frequency === opt.value && styles.optionCardSelected]}>
                  <Text style={styles.optionTitle}>{t(`freq.${opt.value}` as never)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {needsEmployer ? (
          <>
            <Text style={styles.label}>{t('subscribe.profile.employerLabel')}</Text>
            <Text style={styles.title}>{t('subscribe.profile.employerTitle')}</Text>
            <Text style={styles.sub}>{t('subscribe.profile.employerSub')}</Text>
            <View style={styles.wrap}>
              {EMPLOYER_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={t(`employer.${opt}` as never)}
                  selected={employer === opt}
                  onPress={() => setEmployer(opt)}
                />
              ))}
            </View>
          </>
        ) : null}

        {needsSituation ? (
          <>
            <Text style={styles.label}>{situationLabelKey()}</Text>
            <Text style={styles.title}>{situationTitleKey()}</Text>
            <View style={styles.wrap}>
              {situationOptions().map((opt) => (
                <Chip
                  key={opt}
                  label={t(`situation.${opt}` as never)}
                  selected={situation === opt}
                  onPress={() => setSituation(opt)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t('subscribe.profile.seeOffer')}
          onPress={onSubmit}
          variant="primary"
          size="lg"
          disabled={!canSubmit}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  progress: { marginHorizontal: Spacing.lg, marginTop: Spacing.sm },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing['2xl'] },
  label: { ...Typography.caption, fontWeight: '700', marginTop: Spacing.xl, letterSpacing: 0.5 },
  title: { ...Typography.sectionTitle, marginBottom: Spacing.sm },
  sub: { ...Typography.caption, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionsCol: { gap: Spacing.sm },
  optionCard: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.lg,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySurface,
  },
  optionTitle: { ...Typography.bodyBold },
  stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnText: { fontSize: 22, color: Colors.primary, fontWeight: '700' },
  stepperCenter: { alignItems: 'center', minWidth: 80 },
  stepperValue: { fontSize: 36, fontWeight: '800', color: Colors.text, textAlign: 'center', minWidth: 60 },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
});
