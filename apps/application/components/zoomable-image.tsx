import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Colors } from '@/constants/Colors';

const MAX = 5;
const STEP = 0.5;

/**
 * Image zoomable :
 * - mobile : pincer pour zoomer, glisser pour déplacer, double-tap pour réinitialiser.
 * - web (souris) : boutons loupe +/− (les gestes pointer de gesture-handler sont instables sur le web → désactivés).
 */
export function ZoomableImage({
  source,
  style,
}: {
  source: ImageSourcePropType;
  style?: ViewStyle;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const sx = useSharedValue(0);
  const sy = useSharedValue(0);

  const resetTranslate = () => {
    tx.value = withTiming(0);
    ty.value = withTiming(0);
    sx.value = 0;
    sy.value = 0;
  };

  function zoomIn() {
    const next = Math.min(MAX, scale.value + STEP);
    scale.value = withTiming(next);
    savedScale.value = next;
  }
  function zoomOut() {
    const next = Math.max(1, scale.value - STEP);
    scale.value = withTiming(next);
    savedScale.value = next;
    if (next === 1) resetTranslate();
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(MAX, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = sx.value + e.translationX;
      ty.value = sy.value + e.translationY;
    })
    .onEnd(() => {
      sx.value = tx.value;
      sy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      savedScale.value = 1;
      resetTranslate();
    });

  const gesture = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const content = (
    <Animated.View style={[styles.fill, animatedStyle]}>
      <Image source={source} style={styles.image} contentFit="contain" />
    </Animated.View>
  );

  return (
    <GestureHandlerRootView style={[styles.root, style]}>
      {Platform.OS === 'web' ? content : <GestureDetector gesture={gesture}>{content}</GestureDetector>}

      {/* Boutons loupe (indispensables sur ordinateur) */}
      <View style={styles.controls}>
        <Pressable accessibilityRole="button" accessibilityLabel="−" onPress={zoomOut} style={styles.zoomBtn}>
          <MaterialIcons name="zoom-out" size={22} color="#fff" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="+" onPress={zoomIn} style={styles.zoomBtn}>
          <MaterialIcons name="zoom-in" size={22} color="#fff" />
        </Pressable>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { overflow: 'hidden', borderRadius: 10 },
  fill: { width: '100%', height: '100%' },
  image: { width: '100%', height: '100%' },
  controls: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    gap: 8,
  },
  zoomBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(13,94,191,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
