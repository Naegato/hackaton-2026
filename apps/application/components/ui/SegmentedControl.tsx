import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Radius, Spacing } from '@/constants/Spacing';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

export function SegmentedControl({ options, selectedIndex, onChange, style }: SegmentedControlProps) {
  return (
    <View style={[styles.track, style]}>
      {options.map((opt, i) => {
        const active = i === selectedIndex;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.segment, active && styles.activeSegment]}
            onPress={() => onChange(i)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.activeLabel]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Colors.primarySurface,
    borderRadius: Radius.full,
    padding: 3,
    alignSelf: 'center',
  },
  segment: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
  },
  activeSegment: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  activeLabel: {
    color: Colors.white,
    fontWeight: '600',
  },
});
