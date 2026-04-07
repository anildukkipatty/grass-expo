import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

/** A single shimmer bar. Accepts theme colors via props so it can be hoisted as a stable component. */
function ShimmerBar({
  width,
  height,
  bg,
  shimmer,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  bg: string;
  shimmer: string;
  style?: object;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 900 }), -1, false);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-300, 300]) }],
  }));

  return (
    <View style={[{ width, height, borderRadius: 6, overflow: 'hidden', backgroundColor: bg }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, animStyle]}>
        <LinearGradient
          colors={['transparent', shimmer, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

/** Shown in the chat message list while the agent is working and no reply has arrived yet. */
export function AgentTypingskeleton({ theme }: { theme: 'light' | 'dark' }) {
  const dark = theme === 'dark';
  const bg = dark ? '#2a2a2a' : '#e0e0e0';
  const shimmer = dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)';

  return (
    <View style={styles.bubble}>
      <ShimmerBar width={260} height={14} bg={bg} shimmer={shimmer} />
      <ShimmerBar width={200} height={14} bg={bg} shimmer={shimmer} style={{ marginTop: 8 }} />
      <ShimmerBar width={150} height={14} bg={bg} shimmer={shimmer} style={{ marginTop: 8 }} />
    </View>
  );
}

export default ShimmerBar;

const styles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    maxWidth: '85%',
    minWidth: 160,
  },
});
