import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius } from '@/constants/Spacing';
import { SegmentedControl, LineBadge, AlertBadge, SearchBar } from '@/components/ui';
import { Typography } from '@/constants/Typography';

type AlertLevel = 'disruption' | 'warning' | 'info';
type AlertMap = Record<string, AlertLevel>;

const RER_LINES   = ['A','B','C','D','E','H','J','K','L','N','P','R','U','V'];
const METRO_LINES = ['1','2','3','3B','4','5','6','7','7B','8','9','10','11','12','13','14'];
const TRAM_LINES  = ['1','2','3a','3b','4','5','6','7','8','9','10','11','12','13','14'];

const RER_ALERTS: AlertMap   = { D: 'warning', H: 'warning', J: 'warning', N: 'warning' };
const METRO_ALERTS: AlertMap = { '5': 'disruption', '12': 'disruption', '13': 'disruption', '14': 'disruption', '9': 'info' };
const TRAM_ALERTS: AlertMap  = { '1': 'disruption', '2': 'disruption', '4': 'disruption' };

export default function InfosScreen() {
  const [tab, setTab] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={Typography.pageTitle}>Infos trafic</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SegmentedControl
          options={['Aujourd\'hui', 'À venir']}
          selectedIndex={tab}
          onChange={setTab}
          style={styles.segmented}
        />

        <TransportSection title="Train - RER" icon="train-outline" lines={RER_LINES} type="rer" alerts={RER_ALERTS} />
        <TransportSection title="Métro" icon="subway-outline" lines={METRO_LINES} type="metro" alerts={METRO_ALERTS} />
        <TransportSection title="Tramway" icon="git-commit-outline" lines={TRAM_LINES} type="tram" alerts={TRAM_ALERTS} />

        {/* Bus search */}
        <View style={styles.sectionHeader}>
          <Ionicons name="bus-outline" size={22} color={Colors.text} style={styles.sectionIcon} />
          <Text style={styles.sectionTitle}>Bus</Text>
        </View>
        <View style={styles.busSearchCard}>
          <SearchBar placeholder="Rechercher une ligne de bus" onPress={() => {}} />
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function TransportSection({
  title, icon, lines, type, alerts,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  lines: string[];
  type: 'rer' | 'metro' | 'tram';
  alerts: AlertMap;
}) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={22} color={Colors.text} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.gridCard}>
        <View style={styles.grid}>
          {lines.map(line => (
            <TouchableOpacity key={line} style={styles.gridItem} activeOpacity={0.7} onPress={() => {}}>
              <View style={styles.badgeWrap}>
                <LineBadge line={line} type={type} size="md" />
                {alerts[line] && (
                  <View style={styles.alertOverlay}>
                    <AlertBadge level={alerts[line]!} size={18} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.primarySurface },
  header:  { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, backgroundColor: Colors.white },
  content: { paddingBottom: Spacing.xl },

  segmented: { marginVertical: Spacing.md },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  sectionIcon:  { marginRight: Spacing.sm },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },

  gridCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: { position: 'relative' },
  badgeWrap: { position: 'relative' },
  alertOverlay: { position: 'absolute', bottom: -4, right: -4 },

  busSearchCard: { marginHorizontal: Spacing.lg },
});
