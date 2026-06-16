import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type AlertLevel = 'disruption' | 'warning' | 'info';

interface AlertBadgeProps {
  level: AlertLevel;
  size?: number;
  style?: ViewStyle;
}

const config: Record<AlertLevel, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  disruption: { icon: 'close',         bg: Colors.danger },
  warning:    { icon: 'warning',        bg: Colors.warning },
  info:       { icon: 'information',    bg: Colors.info },
};

export function AlertBadge({ level, size = 16, style }: AlertBadgeProps) {
  const { icon, bg } = config[level];
  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, style]}>
      <Ionicons name={icon} size={size * 0.65} color={Colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
});
