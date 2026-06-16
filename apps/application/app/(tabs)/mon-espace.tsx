import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { Button, Card, ListItem, SectionHeader } from '@/components/ui';
import { Typography } from '@/constants/Typography';

export default function MonEspaceScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={Typography.pageTitle}>Mon espace</Text>
            <Text style={styles.connectTitle}>Connectez-vous !</Text>
            <Text style={styles.connectDesc}>Profitez des services et fonctionnalités de mon espace Île-de-France Mobilités</Text>
          </View>
          <View style={styles.connectBadge}>
            <Text style={styles.connectBadgeTop}>île<Text style={{ fontWeight: '400' }}>de</Text>France</Text>
            <Text style={styles.connectBadgeSub}>mobilités</Text>
            <Text style={styles.connectBadgeLabel}>CONNECT</Text>
          </View>
        </View>

        <Button label="Me connecter / m'inscrire" variant="primary" size="lg" onPress={() => {}} style={styles.loginBtn} />

        {/* Contrôle */}
        <Card noPadding style={styles.card}>
          <ListItem
            label="Je me fais contrôler"
            leftIcon={<Ionicons name="shield-checkmark-outline" size={24} color={Colors.text} />}
            onPress={() => {}}
          />
        </Card>

        {/* Contrats */}
        <SectionHeader title="Mes contrats sur mon téléphone" style={styles.sectionLabel} />
        <Card noPadding style={styles.card}>
          <ListItem
            label="Navigo Liberté +"
            leftIcon={<View style={styles.navigoIcon}><Ionicons name="card" size={20} color={Colors.white} /></View>}
            onPress={() => {}}
          />
        </Card>

        {/* Services */}
        <SectionHeader title="Mes services" style={styles.sectionLabel} />
        <View style={styles.servicesGrid}>
          {[
            { name: "velib'",        bg: '#0066CC' },
            { name: 'Véligo',        bg: '#1A1A2E' },
            { name: 'Parking Vélos', bg: '#1A1A2E' },
          ].map(s => (
            <TouchableOpacity key={s.name} style={[styles.serviceTile, { backgroundColor: s.bg }]} activeOpacity={0.8}>
              <Text style={styles.serviceName}>{s.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Card noPadding style={styles.card}>
          <ListItem label="Découvrir les services" onPress={() => {}} />
        </Card>

        {/* Titres & justificatifs */}
        <SectionHeader title="Mes titres et justificatifs" style={styles.sectionLabel} />
        <Card noPadding style={styles.card}>
          {[
            { label: "Mes justificatifs d'achats", icon: 'receipt-outline' as const },
            { label: 'Gérer mes titres',           icon: 'card-outline' as const, sep: true },
            { label: 'Gérer mes forfaits',         icon: 'document-text-outline' as const, right: 'arrow-external' as const },
          ].map(({ label, icon, sep, right }) => (
            <ListItem
              key={label}
              label={label}
              leftIcon={<Ionicons name={icon} size={20} color={Colors.primary} />}
              right={right ?? 'arrow'}
              showSeparator={sep}
              onPress={() => {}}
            />
          ))}
        </Card>

        {/* Déplacements */}
        <SectionHeader title="Mes déplacements" style={styles.sectionLabel} />
        <Card noPadding style={styles.card}>
          <ListItem label="Mes favoris"             leftIcon={<Ionicons name="star-outline" size={20} color={Colors.primary} />} showSeparator onPress={() => {}} />
          <ListItem label="Mes dernières validations" leftIcon={<Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />} onPress={() => {}} />
        </Card>

        {/* Paramètres */}
        <SectionHeader title="Paramètres" style={styles.sectionLabel} />
        <Card noPadding style={styles.card}>
          {[
            { label: 'Mes alertes & notifications', icon: 'notifications-outline' as const },
            { label: 'Langue et accessibilité',     icon: 'globe-outline' as const, sep: true },
            { label: 'Intelligence Artificielle',   icon: 'sparkles-outline' as const, sep: true },
            { label: 'Le Lab',                      icon: 'flask-outline' as const, sep: true },
          ].map(({ label, icon, sep }) => (
            <ListItem key={label} label={label} leftIcon={<Ionicons name={icon} size={20} color={Colors.primary} />} showSeparator={sep} onPress={() => {}} />
          ))}
        </Card>

        {/* Aide */}
        <SectionHeader title="Besoin d'aide ?" style={styles.sectionLabel} />
        <Card noPadding style={styles.card}>
          {[
            { label: 'Service client',             icon: 'heart-outline' as const },
            { label: 'Localiser un point de SAV',  icon: 'location-outline' as const, sep: true },
            { label: 'Questions fréquentes',       icon: 'help-circle-outline' as const, right: 'arrow-external' as const, sep: true },
            { label: "Poser une question à l'agent IA", icon: 'chatbubble-ellipses-outline' as const, right: 'arrow-external' as const, sep: true },
          ].map(({ label, icon, right, sep }) => (
            <ListItem key={label} label={label} leftIcon={<Ionicons name={icon} size={20} color={Colors.primary} />} right={right ?? 'arrow'} showSeparator={sep} onPress={() => {}} />
          ))}
        </Card>

        {/* Footer links */}
        {['Donnez-nous votre avis', 'Crédits', 'Mentions légales', 'Confidentialité'].map(link => (
          <TouchableOpacity key={link} style={styles.footerLink} onPress={() => {}}>
            <Text style={styles.footerLinkText}>{link}</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
          </TouchableOpacity>
        ))}

        <Text style={styles.version}>Île-de-France Mobilités / 9.8.0-4310</Text>
        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.lg },
  headerText: { flex: 1 },
  connectTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: Spacing.xs },
  connectDesc:  { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 18 },

  connectBadge: {
    width: 88, height: 88, borderRadius: Radius.full,
    backgroundColor: Colors.primarySurface,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary,
  },
  connectBadgeTop:   { fontSize: 10, fontWeight: '700', color: Colors.primary },
  connectBadgeSub:   { fontSize: 8, color: Colors.primary },
  connectBadgeLabel: { fontSize: 14, fontWeight: '800', color: Colors.primary, letterSpacing: 1 },

  loginBtn: { marginBottom: Spacing.lg },
  card:     { marginBottom: Spacing.md },
  sectionLabel: { paddingHorizontal: 0 },

  navigoIcon: { width: 36, height: 36, borderRadius: Radius.sm, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  servicesGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  serviceTile:  { flex: 1, height: 72, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', padding: Spacing.sm },
  serviceName:  { color: Colors.white, fontSize: 12, fontWeight: '700', textAlign: 'center' },

  footerLink:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  footerLinkText: { fontSize: 14, color: Colors.primary, textDecorationLine: 'underline' },
  version:        { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.md, marginBottom: Spacing.sm },
});
