import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { SectionHeader } from '@/components/ui';
import { Typography } from '@/constants/Typography';

const TRANSPORT_CARDS = [
  {
    title: 'Sur mon téléphone',
    desc: 'Achetez et validez vos titres avec votre téléphone.',
    icon: 'phone-portrait-outline' as const,
  },
  {
    title: 'Sur mon passe Navigo',
    desc: 'Achetez et rechargez vos titres sur votre passe Navigo depuis votre téléphone.',
    icon: 'card-outline' as const,
  },
  {
    title: 'Navigo Liberté +',
    desc: 'Tous vos trajets sur votre téléphone',
    icon: 'checkmark-circle-outline' as const,
  },
];

const PARTNER_CARDS = [
  {
    title: 'Se déplacer autrement',
    desc: 'Réservez ou achetez des services de mobilité complémentaires',
    icon: 'bicycle-outline' as const,
  },
];

export default function TitresScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={Typography.pageTitle}>Titres</Text>
        <TouchableOpacity style={styles.helpBtn}>
          <Ionicons name="help-circle" size={28} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionHeader title="Transports en commun" style={styles.sectionLabel} />
        {TRANSPORT_CARDS.map(card => (
          <ServiceCard key={card.title} {...card} />
        ))}

        <SectionHeader title="Autres services partenaires" style={styles.sectionLabel} />
        {PARTNER_CARDS.map(card => (
          <ServiceCard key={card.title} {...card} />
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceCard({
  title, desc, icon,
}: {
  title: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => {}}>
      <View style={styles.cardContent}>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDesc}>{desc}</Text>
        </View>
        <View style={styles.cardIllustration}>
          <View style={styles.illustrationCircle}>
            <Ionicons name={icon} size={32} color={Colors.primary} />
          </View>
        </View>
      </View>
      <View style={styles.cardArrow}>
        <Ionicons name="arrow-forward-circle" size={26} color={Colors.primary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.primarySurface },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, backgroundColor: Colors.white },
  helpBtn: { padding: 4 },
  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  sectionLabel: { paddingHorizontal: 0, marginTop: Spacing.xl },

  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  cardText: { flex: 1, paddingRight: Spacing.md },
  cardTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  cardDesc:  { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },

  cardIllustration: { width: 72, alignItems: 'center', justifyContent: 'center' },
  illustrationCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
  },
  cardArrow: { alignSelf: 'flex-end', marginTop: Spacing.sm },
});
