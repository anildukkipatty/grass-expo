import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Defs, Image as SvgImage, LinearGradient, Mask, Rect, Stop } from "react-native-svg";

import { StarburstVisual } from "@/components/onboarding/StarburstVisual";

const TICKET = require("@/assets/images/new-design/onboarding/free-ticket.webp");
const VB_W = 1147;
const VB_H = 594;
const SHEEN_W = 300; // width of the sweeping highlight, in viewBox units

const ARect = Animated.createAnimatedComponent(Rect);

/** Card 4 visual: the welcome-gift ticket over a rotating starburst, with a
    shimmer sweep masked to the ticket's shape (no bleed into transparent areas). */
export function TicketVisual({ active }: { active: boolean }) {
  const sheenX = useRef(new Animated.Value(-SHEEN_W)).current;
  const enter = useRef(new Animated.Value(0)).current;

  // On becoming active, the ticket scales up and rotates from 0° to its rest tilt.
  useEffect(() => {
    if (active) {
      Animated.spring(enter, { toValue: 1, stiffness: 170, damping: 16, mass: 1, useNativeDriver: true }).start();
    } else {
      Animated.timing(enter, { toValue: 0, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();
    }
  }, [active, enter]);

  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
  const rotate = enter.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "5deg"] });
  const opacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sheenX, {
          toValue: VB_W,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // animating an SVG attribute, not a transform
        }),
        Animated.delay(2400),
        Animated.timing(sheenX, { toValue: -SHEEN_W, duration: 0, useNativeDriver: false }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sheenX]);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <StarburstVisual />
      </View>

      <Animated.View style={[styles.ticketBox, { opacity, transform: [{ scale }, { rotate }] }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
          <Defs>
            <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
              <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.7} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </LinearGradient>
            <Mask id="ticketMask" maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
              <SvgImage href={TICKET} x="0" y="0" width={VB_W} height={VB_H} preserveAspectRatio="xMidYMid meet" />
            </Mask>
          </Defs>

          {/* The ticket itself */}
          <SvgImage href={TICKET} x="0" y="0" width={VB_W} height={VB_H} preserveAspectRatio="xMidYMid meet" />

          {/* Shimmer sweep, clipped to the ticket shape */}
          <ARect
            x={sheenX}
            y={-40}
            width={SHEEN_W}
            height={VB_H + 80}
            fill="url(#sheen)"
            mask="url(#ticketMask)"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ticketBox: {
    width: "75%",
    aspectRatio: VB_W / VB_H,
  },
});
