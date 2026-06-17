import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';
import { useLocale } from '@/context/locale-context';
import type { RecommendationResult } from '@/lib/api';

type Plan = RecommendationResult['plans'][number];

type Props = {
  plan: Plan | null;
  imageSource: ImageSourcePropType | null;
  priceLabel: string;
  onClose: () => void;
};

/** Fiche d'information d'un abonnement : illustration, descriptif, éligibilité et documents requis. */
export function PlanInfoModal({ plan, imageSource, priceLabel, onClose }: Props) {
  const { t } = useLocale();
  const elig = plan?.eligibility ?? {};

  // Conditions d'éligibilité, dérivées des critères de l'offre
  const eligibility: string[] = [];
  if (elig.minAge != null && elig.maxAge != null)
    eligibility.push(`${t('elig.age')} : ${elig.minAge}–${elig.maxAge} ${t('elig.years')}`);
  else if (elig.minAge != null) eligibility.push(`${t('elig.age')} : ${elig.minAge}+ ${t('elig.years')}`);
  else if (elig.maxAge != null) eligibility.push(`${t('elig.age')} : ≤ ${elig.maxAge} ${t('elig.years')}`);
  if (elig.studentOnly) eligibility.push(t('elig.student'));
  if (elig.meansTested) eligibility.push(t('elig.social'));
  if (elig.requiresCMI) eligibility.push(t('elig.cmi'));
  if (eligibility.length === 0) eligibility.push(t('elig.none'));

  // Documents requis, dérivés des conditions
  const documents = [t('doc.id'), t('doc.photo')];
  if (elig.studentOnly) documents.push(t('doc.school'));
  if (elig.meansTested) documents.push(t('doc.income'));
  if (elig.requiresCMI) documents.push(t('doc.cmi'));

  return (
    <Modal visible={!!plan} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Un tap dans la feuille ne ferme pas */}
        <Pressable style={styles.sheet} onPress={() => {}}>
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              contentFit="cover"
              contentPosition={{ top: '25%' }}
            />
          ) : null}

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{plan?.name ?? ''}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('info.close')}
                onPress={onClose}
                hitSlop={10}>
                <MaterialIcons name="close" size={24} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {/* Descriptif */}
            <View style={styles.descRow}>
              <MaterialIcons name="sell" size={18} color={Colors.primary} />
              <Text style={styles.label}>{priceLabel}</Text>
            </View>
            {plan?.zones ? (
              <View style={styles.descRow}>
                <MaterialIcons name="map" size={18} color={Colors.primary} />
                <Text style={styles.label}>
                  {t('info.zones')} {plan.zones}
                </Text>
              </View>
            ) : null}

            {/* Éligibilité */}
            <View style={styles.sectionTitle}>
              <MaterialIcons name="verified-user" size={18} color={Colors.text} />
              <Text style={styles.sectionTitleText}>{t('info.eligibility')}</Text>
            </View>
            {eligibility.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <MaterialIcons name="check" size={18} color={Colors.success} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}

            {/* Documents requis */}
            <View style={styles.sectionTitle}>
              <MaterialIcons name="description" size={18} color={Colors.text} />
              <Text style={styles.sectionTitleText}>{t('info.documents')}</Text>
            </View>
            {documents.map((line) => (
              <View key={line} style={styles.bulletRow}>
                <MaterialIcons name="check" size={18} color={Colors.success} />
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}

            <Button label={t('info.close')} variant="secondary" onPress={onClose} style={styles.closeBtn} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent', // pas de voile sombre : la feuille ressort via son box-shadow
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: '85%',
    // Box-shadow neutre (ni dirigée vers le haut, ni elevation)
    boxShadow: 'rgba(20, 15, 0, 0.7) 0px 0px 16px',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.borderLight,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
  body: { padding: Spacing['2xl'], gap: Spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, flex: 1 },
  label: { fontSize: 15, color: Colors.text },
  descRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
  sectionTitleText: { fontSize: 16, fontWeight: '700', color: Colors.text },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingLeft: Spacing.xs },
  bulletText: { fontSize: 15, color: Colors.textSecondary, flex: 1 },
  closeBtn: { marginTop: Spacing.xl, width: '100%' },
});
