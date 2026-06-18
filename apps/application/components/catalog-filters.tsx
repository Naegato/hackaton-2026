import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';
import { useLocale } from '@/context/locale-context';
import {
  BUDGET_OPTIONS,
  FREQ_OPTIONS,
  PROFIL_OPTIONS,
  SITUATION_OPTIONS,
  TYPE_OPTIONS,
  hasActiveFilters,
  type CatalogFilters,
} from '@/lib/catalog-filters';
import type { TranslationKey } from '@/lib/i18n';

type Props = {
  filters: CatalogFilters;
  onChange: (next: CatalogFilters) => void;
};

export function CatalogFilters({ filters, onChange }: Props) {
  const { t } = useLocale();
  const [expanded, setExpanded] = useState(false);

  /** Bascule une valeur de groupe (re-tap = désélection). */
  function toggle<K extends keyof CatalogFilters>(group: K, value: CatalogFilters[K]) {
    onChange({ ...filters, [group]: filters[group] === value ? undefined : value });
  }

  function Row<K extends keyof CatalogFilters>({
    title,
    group,
    options,
  }: {
    title: TranslationKey;
    group: K;
    options: { key: NonNullable<CatalogFilters[K]>; label: TranslationKey }[];
  }) {
    return (
      <View style={styles.group}>
        <ThemedText style={styles.groupTitle}>{t(title)}</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {options.map((opt) => {
            const selected = filters[group] === opt.key;
            return (
              <Pressable
                key={String(opt.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => toggle(group, opt.key)}
                style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}>
                <ThemedText
                  style={[styles.chipText, selected && styles.chipTextOn]}
                  lightColor={selected ? '#fff' : undefined}
                  darkColor={selected ? '#fff' : undefined}>
                  {t(opt.label)}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Row title="filter.profil" group="profil" options={PROFIL_OPTIONS} />
      <Row title="filter.freq" group="freq" options={FREQ_OPTIONS} />

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((v) => !v)}
          style={styles.toggle}>
          <ThemedText type="link">{t(expanded ? 'filter.less' : 'filter.more')}</ThemedText>
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={20}
            color={Colors.primary}
          />
        </Pressable>
        {hasActiveFilters(filters) ? (
          <Pressable accessibilityRole="button" onPress={() => onChange({})}>
            <ThemedText type="link">{t('filter.reset')}</ThemedText>
          </Pressable>
        ) : null}
      </View>

      {expanded ? (
        <Animated.View entering={FadeInDown.duration(180)} style={styles.extra}>
          <Row title="filter.type" group="type" options={TYPE_OPTIONS} />
          <Row title="filter.budget" group="budget" options={BUDGET_OPTIONS} />
          <Row title="filter.situation" group="situation" options={SITUATION_OPTIONS} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  group: { gap: 6 },
  groupTitle: { fontSize: 13, fontWeight: '600', opacity: 0.7 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipOff: { borderColor: Colors.border, backgroundColor: 'transparent' },
  chipOn: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  chipText: { fontSize: 13 },
  chipTextOn: { fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  extra: { gap: 10 },
});
