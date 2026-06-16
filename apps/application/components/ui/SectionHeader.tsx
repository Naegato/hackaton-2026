import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

interface SectionHeaderProps {
  title: string;
  onPrimary?: boolean;
  style?: TextStyle;
}

export function SectionHeader({ title, onPrimary = false, style }: SectionHeaderProps) {
  return (
    <Text style={[styles.base, onPrimary ? styles.onPrimary : styles.onWhite, style]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  onWhite: {
    color: Colors.text,
  },
  onPrimary: {
    color: Colors.white,
  },
});
