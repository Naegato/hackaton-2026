import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LineColors, lineTextColor } from '@/constants/Colors';

type LineType = 'metro' | 'rer' | 'tram' | 'bus';

interface LineBadgeProps {
  line: string;
  type: LineType;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

function resolveKey(line: string, type: LineType): string {
  if (type === 'metro') return `M${line}`;
  if (type === 'tram')  return `T${line}`;
  return line; // RER / Bus
}

export function LineBadge({ line, type, size = 'md', style }: LineBadgeProps) {
  const key = resolveKey(line, type);
  const bg = LineColors[key] ?? '#888888';
  const fg = lineTextColor(key);
  const dim = sizes[size];

  if (type === 'tram') {
    return <TramBadge line={line} bg={bg} fg={fg} dim={dim} style={style} />;
  }
  if (type === 'metro') {
    return <CircleBadge label={line} bg={bg} fg={fg} dim={dim} style={style} />;
  }
  // RER / Bus → rounded square
  return <SquareBadge label={line} bg={bg} fg={fg} dim={dim} style={style} />;
}

// ─── Sub-shapes ───────────────────────────────────────────────────────────────

function CircleBadge({ label, bg, fg, dim, style }: ShapeProps) {
  return (
    <View style={[styles.circle, { backgroundColor: bg, width: dim.size, height: dim.size, borderRadius: dim.size / 2 }, style]}>
      <Text style={[styles.label, { color: fg, fontSize: dim.fontSize }]}>{label}</Text>
    </View>
  );
}

function SquareBadge({ label, bg, fg, dim, style }: ShapeProps) {
  return (
    <View style={[styles.square, { backgroundColor: bg, width: dim.size, height: dim.size, borderRadius: dim.size * 0.22 }, style]}>
      <Text style={[styles.label, { color: fg, fontSize: dim.fontSize }]}>{label}</Text>
    </View>
  );
}

function TramBadge({ line, bg, fg, dim, style }: ShapeProps & { line: string }) {
  const barH = Math.max(3, dim.size * 0.12);
  return (
    <View style={[styles.tramWrap, style]}>
      <View style={[styles.tramBar, { backgroundColor: bg, height: barH }]} />
      <Text style={[styles.tramLabel, { color: fg === '#FFFFFF' ? '#1A1A2E' : fg, fontSize: dim.fontSize }]}>
        T{line}
      </Text>
      <View style={[styles.tramBar, { backgroundColor: bg, height: barH }]} />
    </View>
  );
}

// ─── Types & constants ────────────────────────────────────────────────────────

type ShapeProps = {
  label?: string;
  bg: string;
  fg: string;
  dim: { size: number; fontSize: number };
  style?: ViewStyle;
};

const sizes = {
  sm: { size: 28, fontSize: 11 },
  md: { size: 36, fontSize: 14 },
  lg: { size: 48, fontSize: 18 },
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  square: { alignItems: 'center', justifyContent: 'center' },
  label:  { fontWeight: '700' },

  tramWrap:  { alignItems: 'center', justifyContent: 'center', gap: 2 },
  tramBar:   { width: 32, borderRadius: 2 },
  tramLabel: { fontWeight: '700', fontSize: 12, color: '#1A1A2E' },
});
