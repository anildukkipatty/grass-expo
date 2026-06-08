import { SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

import GiftIcon from "@/assets/images/new-design/onboarding/gift.svg";

const TICKET_W = 252;
const TICKET_H = 134;
const STUB_W = 74;
const PERF_X = TICKET_W - STUB_W; // x of the perforation line
const NOTCH = 22;
const BG = "#EEF4FB"; // soft backdrop so the white ticket + notches read

/** A diagonal light sweep that crosses the ticket on a loop. */
function Shimmer() {
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(2400),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [x]);

  const translateX = x.interpolate({ inputRange: [0, 1], outputRange: [-90, TICKET_W + 90] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.shimmer, { transform: [{ translateX }, { rotate: "18deg" }] }]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.55)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

/** Card 4 visual: a "7 days free" pass that springs in, with a shimmer sweep. */
export function FreeWeekPass({ active }: { active: boolean }) {
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      Animated.spring(enter, { toValue: 1, stiffness: 190, damping: 17, mass: 1, useNativeDriver: true }).start();
    } else {
      Animated.timing(enter, { toValue: 0, duration: 250, easing: Easing.in(Easing.ease), useNativeDriver: true }).start();
    }
  }, [active, enter]);

  const opacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: "clamp" });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });
  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.ticket, { opacity, transform: [{ translateY }, { scale }] }]}>
        {/* Main body */}
        <View style={styles.main}>
          <Text style={styles.kicker}>WELCOME GIFT</Text>
          <View style={styles.headlineRow}>
            <Text style={styles.days}>7 DAYS </Text>
            <Text style={styles.free}>FREE</Text>
          </View>
          <Text style={styles.sub}>No card · No catch</Text>
        </View>

        {/* Perforation + stub */}
        <View style={styles.perf} />
        <View style={styles.stub}>
          <GiftIcon width={30} height={30} />
        </View>

        {/* Notches carve the ticket on the perforation line */}
        <View style={[styles.notch, { top: -NOTCH / 2 }]} />
        <View style={[styles.notch, { bottom: -NOTCH / 2 }]} />

        <Shimmer />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ticket: {
    width: TICKET_W,
    height: TICKET_H,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0D3463",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  main: {
    flex: 1,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  kicker: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: "#9AA7BD",
    marginBottom: 6,
  },
  headlineRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  days: {
    fontFamily: SFPro.displayBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: "#16243A",
  },
  free: {
    fontFamily: SFPro.displayBold,
    fontSize: 26,
    letterSpacing: -0.5,
    color: "#3D841E",
  },
  sub: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#56657D",
    marginTop: 6,
  },
  perf: {
    position: "absolute",
    left: PERF_X,
    top: NOTCH / 2,
    bottom: NOTCH / 2,
    borderLeftWidth: 1.5,
    borderLeftColor: "#D5DEEA",
    borderStyle: "dashed",
  },
  stub: {
    width: STUB_W,
    alignItems: "center",
    justifyContent: "center",
  },
  notch: {
    position: "absolute",
    left: PERF_X - NOTCH / 2,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: BG,
  },
  shimmer: {
    position: "absolute",
    top: -40,
    width: 46,
    height: TICKET_H + 80,
  },
});
