import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';

type RightElement = 'arrow' | 'arrow-external' | 'none' | React.ReactNode;

interface ListItemProps {
  label: string;
  sublabel?: string;
  leftIcon?: React.ReactNode;
  right?: RightElement;
  onPress?: () => void;
  showSeparator?: boolean;
  style?: ViewStyle;
}

export function ListItem({
  label,
  sublabel,
  leftIcon,
  right = 'arrow',
  onPress,
  showSeparator = false,
  style,
}: ListItemProps) {
  const renderRight = () => {
    if (right === 'arrow') {
      return <Ionicons name="chevron-forward" size={18} color={Colors.primary} />;
    }
    if (right === 'arrow-external') {
      return <Ionicons name="open-outline" size={16} color={Colors.primary} />;
    }
    if (right === 'none') return null;
    return <>{right}</>;
  };

  const content = (
    <View style={[styles.row, showSeparator && styles.withSeparator, style]}>
      {leftIcon && <View style={styles.iconSlot}>{leftIcon}</View>}
      <View style={styles.textBlock}>
        <Text style={styles.label}>{label}</Text>
        {sublabel ? <Text style={styles.sublabel}>{sublabel}</Text> : null}
      </View>
      <View style={styles.rightSlot}>{renderRight()}</View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
  },
  withSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  iconSlot: {
    width: 40,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.text,
  },
  sublabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rightSlot: {
    marginLeft: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
