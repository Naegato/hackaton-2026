import React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Radius, Shadow } from '@/constants/Spacing';
import { SearchBar, Card, SectionHeader, Button, ListItem } from '@/components/ui';

export default function ItinerairesScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Search */}
        <SearchBar
          placeholder="Rechercher un itinéraire"
          onPress={() => {}}
          style={styles.searchBar}
        />

        {/* Logo */}
        <View style={styles.logoRow}>
          <Text style={styles.logoIle}>île<Text style={styles.logoDe}>de</Text>France</Text>
          <Text style={styles.logoMobilites}>mobilités</Text>
          <View style={styles.logoIcon}>
            <Ionicons name="accessibility" size={18} color={Colors.primary} />
          </View>
        </View>

        {/* Où allons-nous */}
        <SectionHeader title="Où allons-nous ?" onPrimary style={styles.noHorizontalPadding} />
        <Card noPadding style={styles.card}>
          <ListItem
            label="Maison"
            leftIcon={<LocationIcon name="home" />}
            right={<Button label="Définir" variant="outline" size="sm" onPress={() => {}} />}
            showSeparator
          />
          <ListItem
            label="Travail"
            leftIcon={<LocationIcon name="briefcase" />}
            right={<Button label="Définir" variant="outline" size="sm" onPress={() => {}} />}
          />
        </Card>

        {/* Mes titres de transport */}
        <SectionHeader title="Mes titres de transport" onPrimary style={styles.noHorizontalPadding} />
        <TouchableOpacity activeOpacity={0.85}>
          <Card style={styles.titresCard}>
            <View style={styles.titresRow}>
              <View style={styles.titresText}>
                <Text style={styles.titresTitle}>Sur mon téléphone</Text>
                <Text style={styles.titresDesc}>Achetez et validez vos titres avec votre téléphone.</Text>
              </View>
              <View style={styles.titresIllustration}>
                <Ionicons name="phone-portrait" size={40} color={Colors.primary} />
              </View>
            </View>
            <View style={styles.arrowBtn}>
              <Ionicons name="arrow-forward-circle" size={28} color={Colors.primary} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Actualités */}
        <SectionHeader title="Actualités" onPrimary style={styles.noHorizontalPadding} />
        <Card noPadding style={styles.newsCard}>
          <View style={styles.newsImagePlaceholder} />
          <View style={styles.newsMeta}>
            <Text style={styles.newsTitle}>À voir, à faire en juin en Île-de-France ?</Text>
            <Text style={styles.newsCategory}>Actualités</Text>
            <Text style={styles.newsDesc} numberOfLines={2}>De l'art, de la nature, de la musique et une escapade au-dessus des nuages. Découvrez nos r…</Text>
          </View>
        </Card>
        {/* Pagination dots */}
        <View style={styles.dots}>
          {[0,1,2,3,4].map(i => (
            <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
          ))}
        </View>

        {/* Plans */}
        <SectionHeader title="Plans" onPrimary style={styles.noHorizontalPadding} />
        <Card noPadding style={styles.card}>
          {[
            { label: 'Plan général' },
            { label: 'Plans régionaux' },
            { label: 'Plans locaux', last: true },
          ].map(({ label, last }) => (
            <ListItem
              key={label}
              label={label}
              leftIcon={<View style={styles.mapIconCircle}><Ionicons name="map" size={18} color={Colors.white} /></View>}
              showSeparator={!last}
              onPress={() => {}}
            />
          ))}
        </Card>

        {/* Personnaliser */}
        <TouchableOpacity style={styles.customizeBtn} activeOpacity={0.7}>
          <Text style={styles.customizeBtnLabel}>Personnaliser ma page d'accueil</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function LocationIcon({ name }: { name: 'home' | 'briefcase' }) {
  return (
    <View style={styles.locationCircle}>
      <Ionicons name={name} size={18} color={Colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.primaryLight },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },

  searchBar: { marginBottom: Spacing.md },

  logoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginBottom: Spacing.xs, gap: 2 },
  logoIle: { fontSize: 13, fontWeight: '700', color: Colors.white },
  logoDe:  { fontWeight: '400' },
  logoMobilites: { fontSize: 11, color: Colors.white, marginLeft: 2 },
  logoIcon: { backgroundColor: Colors.white, borderRadius: Radius.full, padding: 4, marginLeft: 4 },

  noHorizontalPadding: { paddingHorizontal: 0 },
  card: { marginBottom: Spacing.md },

  // Titres
  titresCard: { marginBottom: Spacing.md },
  titresRow: { flexDirection: 'row', alignItems: 'center' },
  titresText: { flex: 1 },
  titresTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  titresDesc:  { fontSize: 13, color: Colors.textSecondary },
  titresIllustration: { width: 64, alignItems: 'center', opacity: 0.7 },
  arrowBtn: { alignSelf: 'flex-end', marginTop: Spacing.sm },

  // News
  newsCard: { marginBottom: Spacing.sm },
  newsImagePlaceholder: { height: 160, backgroundColor: Colors.primarySurface, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg },
  newsMeta:    { padding: Spacing.md },
  newsTitle:   { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  newsCategory:{ fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },
  newsDesc:    { fontSize: 13, color: Colors.textSecondary },

  // Dots
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
  dot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: Colors.white },

  // Map icon
  mapIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  // Customize
  customizeBtn: {
    borderWidth: 1.5, borderColor: Colors.white, borderStyle: 'dashed',
    borderRadius: Radius.lg, paddingVertical: Spacing.md,
    alignItems: 'center', marginTop: Spacing.sm,
  },
  customizeBtnLabel: { color: Colors.white, fontWeight: '600', fontSize: 14 },

  locationCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
