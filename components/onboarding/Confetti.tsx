import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

const { width: W, height: H } = Dimensions.get("window");
const COLORS = ["#4FA825", "#7ED957", "#3A7D1C", "#5CC330", "#2E6B10", "#8FE85A", "#6DD148", "#A8E87A"];
const COUNT = 70;

type Piece = {
  size: number;
  color: string;
  launchY: number;
  spreadX: number;
  launchDur: number;
  fallDur: number;
  delay: number;
  rotateTo: number;
  ty: Animated.Value;
  tx: Animated.Value;
  rot: Animated.Value;
  op: Animated.Value;
};

/**
 * A celebratory confetti burst that erupts upward/outward from (originX, originY)
 * — e.g. from behind the server — then rains down. Plays once when `visible` flips true.
 */
export function Confetti({
  visible,
  originX = W / 2,
  originY = H / 2,
}: {
  visible: boolean;
  originX?: number;
  originY?: number;
}) {
  const pieces = useRef<Piece[]>(
    Array.from({ length: COUNT }, () => ({
      size: 6 + Math.random() * 7,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      launchY: -(120 + Math.random() * 240),
      spreadX: (Math.random() * 2 - 1) * (40 + Math.random() * 150),
      launchDur: 420 + Math.random() * 320,
      fallDur: 1500 + Math.random() * 1100,
      delay: Math.random() * 220,
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
      const total = p.launchDur + p.fallDur;
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          // up then down
          Animated.sequence([
            Animated.timing(p.ty, { toValue: p.launchY, duration: p.launchDur, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(p.ty, { toValue: H - originY + 40, duration: p.fallDur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.timing(p.tx, { toValue: p.spreadX, duration: total, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.rot, { toValue: 1, duration: total, easing: Easing.linear, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(total * 0.65),
            Animated.timing(p.op, { toValue: 0, duration: total * 0.35, useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    });
  }, [visible, pieces, originY]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => {
        const rotate = p.rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.rotateTo}deg`] });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              left: originX,
              top: originY,
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
