import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const CARD_IMAGE = require('../assets/images/carte-navigo.png');

type Props = {
  holderName: string;
  planName: string;
  statusLabel: string;
  statusColor: string;
  onPress?: () => void;
};

/** Abonnement affiché sous forme de carte Navigo : nom du titulaire, type d'abonnement, statut. */
export function NavigoCard({ holderName, planName, statusLabel, statusColor, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image source={CARD_IMAGE} style={StyleSheet.absoluteFill} contentFit="cover" />

      {/* Voile pour la lisibilité du texte */}
      <View style={styles.scrim} />

      <View style={[styles.badge, { backgroundColor: statusColor }]}>
        <Text style={styles.badgeText}>{statusLabel}</Text>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.holder} numberOfLines={1}>
          {holderName}
        </Text>
        <Text style={styles.plan} numberOfLines={1}>
          {planName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 1.586, // ratio carte bancaire / Navigo
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#0D3B66',
  },
  pressed: { opacity: 0.85 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  badge: {
    position: 'absolute',
    top: 14,
    right: 14,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  bottom: { paddingTop: 18, paddingBottom: 42, paddingLeft: 64, paddingRight: 18 },
  holder: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  plan: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
    opacity: 0.95,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
