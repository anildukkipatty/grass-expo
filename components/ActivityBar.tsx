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
          Animated.spring(scale, { toValue: 1.2, useNativeDriver: true, speed: 18, bounciness: 8 }),
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

export function ActivityBar({ label, theme }: Props) {
  const c = GrassColors[theme];
  return (
    <View style={[styles.bar, { backgroundColor: c.barBg, borderTopColor: c.border }]}>
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
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    flex: 1,
    letterSpacing: 0.1,
  },
});
