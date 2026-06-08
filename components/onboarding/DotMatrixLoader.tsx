import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

type Pattern = "full" | "rings";
type ColorPreset = "solid-theme";

const N = 5;
const CENTER = 2;

const PRESET_COLORS: Record<ColorPreset, string> = {
  "solid-theme": "#3D841E", // grass theme green
};

/**
 * RN port of the Dot Matrix "dotm-square-11" loader ("Echo Ring").
 *
 * A 5×5 grid of circular dots. Each active dot pulses through a base → peak →
 * mid envelope with a soft secondary "echo" pulse, staggered outward by ring
 * (Manhattan distance from the centre) so concentric diamonds ripple out.
 *
 * `pattern="rings"` lights only the cells whose Euclidean radius rounds to 1 or
 * 2 (everything except the centre and the four corners).
 */
export function DotMatrixLoader({
  size = 36,
  dotSize = 5,
  speed = 1,
  pattern = "full",
  color = "#3D841E",
  colorPreset,
  opacityBase = 0.16,
  opacityMid = 0.5,
  opacityPeak = 1,
}: {
  size?: number;
  dotSize?: number;
  speed?: number;
  pattern?: Pattern;
  color?: string;
  colorPreset?: ColorPreset;
  opacityBase?: number;
  opacityMid?: number;
  opacityPeak?: number;
}) {
  const dotColor = colorPreset ? PRESET_COLORS[colorPreset] : color;
  const gap = (size - N * dotSize) / (N - 1);

  const isActive = (r: number, c: number) => {
    if (pattern === "full") return true;
    const radius = Math.hypot(r - CENTER, c - CENTER);
    const rounded = Math.round(radius);
    return rounded === 1 || rounded === 2;
  };

  const values = useRef(
    Array.from({ length: N * N }, () => new Animated.Value(opacityBase)),
  ).current;

  useEffect(() => {
    const s = speed > 0 ? speed : 1;
    const cycle = 1500 / s; // full echo-ring cycle
    const started: { loop: Animated.CompositeAnimation; t: ReturnType<typeof setTimeout> }[] = [];

    for (let i = 0; i < N * N; i++) {
      const r = Math.floor(i / N);
      const c = i % N;
      if (!isActive(r, c)) continue;

      const v = values[i];
      const ring = Math.min(4, Math.abs(r - CENTER) + Math.abs(c - CENTER));
      const parity = ring % 2;
      const delay = (ring * 0.14 + parity * 0.03) * cycle;

      const step = (toValue: number, frac: number) =>
        Animated.timing(v, { toValue, duration: cycle * frac, useNativeDriver: true });

      // Main pulse + soft secondary echo, then rest at base.
      const loop = Animated.loop(
        Animated.sequence([
          step(opacityPeak, 0.16),
          step(opacityMid, 0.12),
          step(opacityBase, 0.16),
          step(opacityBase, 0.1),
          step(opacityMid, 0.1), // echo
          step(opacityBase, 0.12),
          step(opacityBase, 0.24), // hold
        ]),
      );
      const t = setTimeout(() => loop.start(), delay);
      started.push({ loop, t });
    }

    return () => started.forEach(({ loop, t }) => { clearTimeout(t); loop.stop(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, pattern, opacityBase, opacityMid, opacityPeak]);

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: N }).map((_, r) => (
        <View key={r} style={[styles.row, { marginBottom: r < N - 1 ? gap : 0 }]}>
          {Array.from({ length: N }).map((_, c) => {
            const i = r * N + c;
            const active = isActive(r, c);
            return (
              <Animated.View
                key={c}
                style={{
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  marginRight: c < N - 1 ? gap : 0,
                  backgroundColor: dotColor,
                  opacity: active ? values[i] : 0,
                }}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
});
