import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GrassColors } from '@/constants/theme';

interface Props {
  label: string;
  theme: 'light' | 'dark';
}

function Dot({ delay, accent }: { delay: number; accent: string }) {
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        Animated.delay(600 - delay),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity, delay]);

  return (
    <Animated.View style={[styles.dot, { backgroundColor: accent, opacity }]} />
  );
}

export function ActivityBar({ label, theme }: Props) {
  const c = GrassColors[theme];
  return (
    <View style={[styles.bar, { backgroundColor: c.barBg, borderTopColor: c.border }]}>
      <View style={styles.dots}>
        <Dot delay={0} accent={c.accent} />
        <Dot delay={200} accent={c.accent} />
        <Dot delay={400} accent={c.accent} />
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
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
    minHeight: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    flex: 1,
  },
});
