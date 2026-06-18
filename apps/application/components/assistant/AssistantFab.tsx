import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/Colors';
import { AssistantSheet } from './AssistantSheet';

export function AssistantFab() {
  const [open, setOpen] = useState(false);

  // Pulse animation on the FAB
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!open) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      pulse.setValue(1);
    }
    return () => pulseLoop.current?.stop();
  }, [open]);

  return (
    <>
      {!open && (
        <View style={styles.fabWrap} pointerEvents="box-none">
          <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse }], opacity: pulse.interpolate({ inputRange: [1, 1.12], outputRange: [0.35, 0] }) }]} />
          <Pressable
            style={({ pressed }) => [styles.fab, pressed && { opacity: 0.85 }]}
            onPress={() => setOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'assistant LÉIA"
          >
            <Text style={styles.fabIcon}>✦</Text>
            <Text style={styles.fabLabel}>LÉIA</Text>
          </Pressable>
        </View>
      )}

      <AssistantSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  fabWrap: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
    gap: 1,
  },
  fabIcon: { color: '#fff', fontSize: 16 },
  fabLabel: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
