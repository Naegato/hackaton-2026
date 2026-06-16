import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { SearchBar, LineBadge, AlertBadge, Card } from '@/components/ui';
import { Typography } from '@/constants/Typography';

type FilterTab = 'favoris' | 'rer' | 'metro' | 'tram' | 'bus';

const FILTERS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'favoris', label: '',      icon: '☆' },
  { key: 'rer',     label: 'RER',   icon: '' },
  { key: 'metro',   label: 'Métro', icon: 'M' },
  { key: 'tram',    label: 'Tram',  icon: '~' },
  { key: 'bus',     label: 'BUS',   icon: '' },
];

const RER_LINES = ['A','B','C','D','E','H','J','K','L','N','P','R','U','V'];
const METRO_LINES = ['1','2','3','3B','4','5','6','7','7B','8','9','10','11','12','13','14'];

type AlertMap = Record<string, 'disruption' | 'warning' | 'info'>;
const RER_ALERTS: AlertMap   = { D: 'warning', H: 'warning', J: 'warning', L: 'warning', N: 'warning' };
const METRO_ALERTS: AlertMap = { '5': 'disruption' };

export default function HorairesScreen() {
  const [filter, setFilter] = useState<FilterTab>('rer');

  const lines = filter === 'metro' ? METRO_LINES : filter === 'rer' ? RER_LINES : [];
  const alerts = filter === 'rer' ? RER_ALERTS : filter === 'metro' ? METRO_ALERTS : {};
  const type   = filter === 'metro' ? 'metro' : 'rer';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={Typography.pageTitle}>Horaires</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar placeholder="Rechercher une gare, station ou arrêt" onPress={() => {}} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f.key;
          return (
            <TouchableOpacity key={f.key} style={styles.filterTab} onPress={() => setFilter(f.key)} activeOpacity={0.7}>
              <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                {f.key === 'favoris' ? '☆' : f.key === 'rer' ? '⊡' : f.key === 'metro' ? 'M' : f.key === 'tram' ? '≡' : 'BUS'}
              </Text>
              {f.label ? <Text style={[styles.filterSub, active && styles.filterSubActive]}>{f.label}</Text> : null}
              {active && <View style={styles.filterUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {lines.length > 0 ? lines.map(line => (
          <TouchableOpacity key={line} style={styles.lineRow} activeOpacity={0.7} onPress={() => {}}>
            <View style={styles.badgeWrap}>
              <LineBadge line={line} type={type} size="md" />
              {alerts[line] && (
                <View style={styles.alertOverlay}>
                  <AlertBadge level={alerts[line]!} size={18} />
                </View>
              )}
            </View>
            <Text style={styles.lineName}>{type === 'metro' ? `Métro ${line}` : `RER ${line}`}</Text>
            <Ionicons name="accessibility-outline" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        )) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Sélectionnez un filtre</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: Colors.background },
  header:     { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  searchWrap: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },

  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterTab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, position: 'relative',
  },
  filterLabel:       { fontSize: 18, color: Colors.textSecondary },
  filterLabelActive: { color: Colors.primary },
  filterSub:         { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  filterSubActive:   { color: Colors.primary },
  filterUnderline:   {
    position: 'absolute', bottom: 0, left: '15%', right: '15%',
    height: 2.5, backgroundColor: Colors.primary, borderRadius: 2,
  },

  list: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm },

  lineRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  badgeWrap: { position: 'relative', marginRight: Spacing.md },
  alertOverlay: { position: 'absolute', bottom: -4, right: -4 },
  lineName: { flex: 1, fontSize: 15, color: Colors.text },

  empty: { alignItems: 'center', paddingTop: Spacing['4xl'] },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
});
