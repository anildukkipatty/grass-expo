import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");
const COLORS = ["#4FA825", "#7ED957", "#3A7D1C", "#5CC330", "#2E6B10", "#8FE85A", "#6DD148", "#A8E87A"];
const COUNT = 80;

type Piece = {
  size: number;
  color: string;
  startX: number; // horizontal spawn across the screen
  startY: number; // spawn above the top edge (negative)
  swayX: number; // horizontal flutter while falling
  fallDur: number;
  delay: number;
  rotateTo: number;
  ty: Animated.Value;
  tx: Animated.Value;
  rot: Animated.Value;
  op: Animated.Value;
};

/**
 * A celebratory confetti shower that rains down from above the top of the
 * screen, fluttering and rotating as it falls, then fades near the bottom.
 * Rendered at a high z-index so it sits above all content. Plays once when
 * `visible` flips true.
 */
export function Confetti({ visible }: { visible: boolean; originX?: number; originY?: number }) {
  const pieces = useRef<Piece[]>(
    Array.from({ length: COUNT }, () => ({
      size: 6 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      startX: Math.random() * W,
      startY: -(20 + Math.random() * 160), // above the screen
      swayX: (Math.random() * 2 - 1) * (30 + Math.random() * 70),
      fallDur: 2200 + Math.random() * 1600,
      delay: Math.random() * 500,
      rotateTo: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 4)) * 180,
      ty: new Animated.Value(0),
      tx: new Animated.Value(0),
      rot: new Animated.Value(0),
      op: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;
    pieces.forEach((p) => {
      p.ty.setValue(0);
      p.tx.setValue(0);
      p.rot.setValue(0);
      p.op.setValue(1);
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          // Fall from above the top edge down past the bottom.
          Animated.timing(p.ty, {
            toValue: H - p.startY + 60,
            duration: p.fallDur,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          // Gentle horizontal flutter.
          Animated.timing(p.tx, {
            toValue: p.swayX,
            duration: p.fallDur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(p.rot, { toValue: 1, duration: p.fallDur, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(p.fallDur * 0.7),
            Animated.timing(p.op, { toValue: 0, duration: p.fallDur * 0.3, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  }, [visible, pieces]);

  if (!visible) return null;

  return (
    <View style={styles.layer} pointerEvents="none">
      {pieces.map((p, i) => {
        const rotate = p.rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rotateTo}deg`] });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: p.startX,
              top: p.startY,
              width: p.size,
              height: p.size * 0.6,
              borderRadius: 1.5,
              backgroundColor: p.color,
              opacity: p.op,
              transform: [{ translateX: p.tx }, { translateY: p.ty }, { rotate }],
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
  },
});
