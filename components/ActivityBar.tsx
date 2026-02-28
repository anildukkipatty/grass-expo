import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GrassColors } from '@/constants/theme';

interface Props {
  label: string;
  theme: 'light' | 'dark';
}

function Dot({ delay, accent }: { delay: number; accent: string }) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 18, bounciness: 8 }),
          Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.spring(scale, { toValue: 0.6, useNativeDriver: true, speed: 12, bounciness: 0 }),
          Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        ]),
        Animated.delay(Math.max(0, 700 - delay)),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale, opacity, delay]);

  return (
    <Animated.View style={[styles.dot, { backgroundColor: accent, transform: [{ scale }], opacity }]} />
  );
}

function ShimmerBar({ accent }: { accent: string }) {
  const translateX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, { toValue: 1, duration: 2000, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  const shimmerTranslateX = translateX.interpolate({
    inputRange: [-1, 1],
    outputRange: [-200, 400],
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { backgroundColor: accent, transform: [{ translateX: shimmerTranslateX }] },
      ]}
    />
  );
}

export function ActivityBar({ label, theme }: Props) {
  const c = GrassColors[theme];
  return (
    <View style={[styles.bar, { backgroundColor: c.barBg, borderTopColor: c.border }]}>
      <ShimmerBar accent={c.accent} />
      <View style={styles.dots}>
        <Dot delay={0} accent={c.accent} />
        <Dot delay={160} accent={c.accent} />
        <Dot delay={320} accent={c.accent} />
      </View>
      <Text style={[styles.label, { color: c.badgeText }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
    gap: 10,
    minHeight: 36,
    overflow: 'hidden',
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  label: {
    fontSize: 13,
    flex: 1,
    letterSpacing: 0.1,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 120,
    opacity: 0.06,
  },
});
