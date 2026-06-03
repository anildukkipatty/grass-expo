import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import ChatGPT from "@/assets/images/new-design/onboarding/agents/ChatGPT.svg";
import Claude from "@/assets/images/new-design/onboarding/agents/Claude.svg";
import Deepseek from "@/assets/images/new-design/onboarding/agents/Deepseek.svg";
import Gemini from "@/assets/images/new-design/onboarding/agents/Gemini.svg";
import Grok from "@/assets/images/new-design/onboarding/agents/Grok.svg";
import Minimax from "@/assets/images/new-design/onboarding/agents/Minimax.svg";
import Nvidia from "@/assets/images/new-design/onboarding/agents/Nvidia.svg";
import OpenCode from "@/assets/images/new-design/onboarding/agents/OpenCode.svg";

type IconComp = React.ComponentType<{ width: number; height: number }>;
type Item = { Comp: IconComp; angle: number };

const OUTER_R = 132; // outer ring radius (px)
const INNER_R = 58; // inner ring radius (px)
const START_R = 320; // icons begin this far out (off-card) then fly in
const OUTER_ICON = 50;
const INNER_ICON = 50;

// 4 icons per ring, evenly spaced; inner offset 45° so they interleave.
const OUTER: Item[] = [
  { Comp: ChatGPT, angle: -90 },
  { Comp: Claude, angle: 0 },
  { Comp: Gemini, angle: 90 },
  { Comp: Grok, angle: 180 },
];
const INNER: Item[] = [
  { Comp: Deepseek, angle: -45 },
  { Comp: Minimax, angle: 45 },
  { Comp: Nvidia, angle: 135 },
  { Comp: OpenCode, angle: 225 },
];

function OrbitRing({
  items,
  radius,
  iconSize,
  duration,
  reverse,
  enter,
}: {
  items: Item[];
  radius: number;
  iconSize: number;
  duration: number;
  reverse?: boolean;
  enter: Animated.Value;
}) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  const spin = t.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "-360deg"] : ["0deg", "360deg"],
  });
  // Counter-rotate each icon by the same amount so it stays upright while orbiting.
  const counter = t.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "360deg"] : ["0deg", "-360deg"],
  });

  return (
    <Animated.View style={[styles.ring, { transform: [{ rotate: spin }] }]} pointerEvents="none">
      {items.map(({ Comp, angle }, i) => {
        const rad = (angle * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        const translateX = enter.interpolate({
          inputRange: [0, 1],
          outputRange: [START_R * cos, radius * cos],
        });
        const translateY = enter.interpolate({
          inputRange: [0, 1],
          outputRange: [START_R * sin, radius * sin],
        });
        const opacity = enter.interpolate({
          inputRange: [0, 0.4, 1],
          outputRange: [0, 1, 1],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.orbitIcon,
              {
                width: iconSize,
                height: iconSize,
                marginLeft: -iconSize / 2,
                marginTop: -iconSize / 2,
                opacity,
                transform: [{ translateX }, { translateY }, { rotate: counter }],
              },
            ]}
          >
            <Comp width={iconSize} height={iconSize} />
          </Animated.View>
        );
      })}
    </Animated.View>
  );
}

/** Dotted circular guide showing the orbit path; slowly rotates. */
function OrbitBorder({
  radius,
  enter,
  duration,
  reverse,
}: {
  radius: number;
  enter: Animated.Value;
  duration: number;
  reverse?: boolean;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(t, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [t, duration]);

  const rotate = t.interpolate({
    inputRange: [0, 1],
    outputRange: reverse ? ["0deg", "-360deg"] : ["0deg", "360deg"],
  });

  const W = 3;
  const size = radius * 2 + W * 2;
  const c = size / 2;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.orbitBorder,
        { width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2, opacity: enter, transform: [{ rotate }] },
      ]}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={c}
          cy={c}
          r={radius}
          stroke="#CBD8EA"
          strokeWidth={W}
          strokeLinecap="round"
          strokeDasharray="0.1 10"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

/** Card 3 visual: two rings of agent icons that fly in and orbit, staying upright. */
export function AgentOrbitVisual({ active }: { active: boolean }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: active ? 1 : 0,
      duration: active ? 650 : 300,
      easing: active ? Easing.out(Easing.cubic) : Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [active, enter]);

  return (
    <View style={styles.root}>
      <OrbitBorder radius={OUTER_R} enter={enter} duration={26000} reverse />
      <OrbitBorder radius={INNER_R} enter={enter} duration={18000} />
      <OrbitRing items={OUTER} radius={OUTER_R} iconSize={OUTER_ICON} duration={20000} enter={enter} />
      <OrbitRing items={INNER} radius={INNER_R} iconSize={INNER_ICON} duration={14000} reverse enter={enter} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
  },
  orbitIcon: {
    position: "absolute",
    left: "50%",
    top: "50%",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitBorder: {
    position: "absolute",
    left: "50%",
    top: "50%",
  },
});
