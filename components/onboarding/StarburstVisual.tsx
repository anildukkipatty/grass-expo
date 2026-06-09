import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

const SVG = 760; // large so the rays cover the card after rotation
const C = SVG / 2;
const R = SVG; // overshoot past the corners (clipped by the card)
const WEDGES = 24; // alternating ray / gap

const RAYS = Array.from({ length: WEDGES }, (_, i) => {
  const a0 = ((i * 360) / WEDGES) * (Math.PI / 180);
  const a1 = (((i + 1) * 360) / WEDGES) * (Math.PI / 180);
  const x0 = C + R * Math.cos(a0);
  const y0 = C + R * Math.sin(a0);
  const x1 = C + R * Math.cos(a1);
  const y1 = C + R * Math.sin(a1);
  return {
    d: `M${C} ${C} L${x0} ${y0} L${x1} ${y1} Z`,
    fill: i % 2 === 0 ? "#DEF2D5" : "#FFFFFF",
  };
});

/** Card 4 placeholder visual: a slowly rotating starburst (until the ticket art arrives). */
export function StarburstVisual() {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration: 30000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t]);

  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.spin, { transform: [{ rotate }] }]} pointerEvents="none">
        <Svg width={SVG} height={SVG} viewBox={`0 0 ${SVG} ${SVG}`}>
          {RAYS.map((r, i) => (
            <Path key={i} d={r.d} fill={r.fill} />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  spin: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: SVG,
    height: SVG,
    marginLeft: -SVG / 2,
    marginTop: -SVG / 2,
  },
});
