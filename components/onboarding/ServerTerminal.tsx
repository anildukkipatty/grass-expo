import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

const GREEN = "#4FA825";
const LED_COLOR = "#36D95B";
const GLOW = 14; // diameter of the LED glow halo (display px)

// Power / status LED centres as a % of the server image.
const LED_POSITIONS = {
  power: { left: 17.1, top: 25.3 },
  status: { left: 17.25, top: 44 },
};

/** Blinking green server LED with a soft radial glow. */
function Led({ left, top, gid }: { left: number; top: number; gid: string }) {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const blink = () => {
      if (cancelled) return;
      const bright = Math.random() > 0.5;
      const toValue = bright ? 1 : 0.12 + Math.random() * 0.28;
      const duration = 130 + Math.random() * 170;
      Animated.timing(o, { toValue, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start(
        ({ finished }) => {
          if (cancelled || !finished) return;
          const hold = bright ? 70 + Math.random() * 360 : 50 + Math.random() * 170;
          timer = setTimeout(blink, hold);
        },
      );
    };
    timer = setTimeout(blink, Math.random() * 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      o.stopAnimation();
    };
  }, [o]);

  const id = `srvled-${gid}`;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.led,
        { left: `${left}%`, top: `${top}%`, marginLeft: -GLOW / 2, marginTop: -GLOW / 2, opacity: o },
      ]}
    >
      <Svg width={GLOW} height={GLOW}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#EAFFEF" stopOpacity={1} />
            <Stop offset="0.2" stopColor={LED_COLOR} stopOpacity={0.95} />
            <Stop offset="0.55" stopColor={LED_COLOR} stopOpacity={0.35} />
            <Stop offset="1" stopColor={LED_COLOR} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW / 2} cy={GLOW / 2} r={GLOW / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

export type Mood = "idle" | "excited" | "waiting";

/** A little green face on the monitor. Its behaviour depends on `mood`:
 *  - idle: blinks and glances around now and then
 *  - excited: bounces and pulses with quick happy blinks
 *  - waiting: looks down (at the loading text) and blinks slowly */
function SmileyFace({ mood = "idle" }: { mood?: Mood }) {
  const blink = useRef(new Animated.Value(1)).current; // eye scaleY (1 = open)
  const lookX = useRef(new Animated.Value(0)).current;
  const lookY = useRef(new Animated.Value(0)).current;
  const bounceY = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const loops: Animated.CompositeAnimation[] = [];

    const quickBlink = (cb?: () => void) => {
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.1, duration: 70, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start(cb);
    };

    if (mood === "idle") {
      Animated.parallel([
        Animated.timing(lookY, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleA, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      const doBlink = () => {
        if (cancelled) return;
        quickBlink(() => {
          if (cancelled) return;
          timers.push(setTimeout(doBlink, 1500 + Math.random() * 2800));
        });
      };
      const doLook = () => {
        if (cancelled) return;
        const tx = (Math.random() * 2 - 1) * 3;
        const ty = (Math.random() * 2 - 1) * 1.2;
        Animated.parallel([
          Animated.timing(lookX, { toValue: tx, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(lookY, { toValue: ty, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]).start(() => {
          if (cancelled) return;
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              Animated.parallel([
                Animated.timing(lookX, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(lookY, { toValue: 0, duration: 300, useNativeDriver: true }),
              ]).start(() => {
                if (cancelled) return;
                timers.push(setTimeout(doLook, 2200 + Math.random() * 3000));
              });
            }, 650 + Math.random() * 900),
          );
        });
      };
      timers.push(setTimeout(doBlink, 1200 + Math.random() * 1500));
      timers.push(setTimeout(doLook, 1800 + Math.random() * 1500));
    } else if (mood === "excited") {
      Animated.parallel([
        Animated.timing(lookX, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(lookY, { toValue: -1, duration: 150, useNativeDriver: true }),
      ]).start();
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceY, { toValue: -3, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(bounceY, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      );
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleA, { toValue: 1.14, duration: 160, useNativeDriver: true }),
          Animated.timing(scaleA, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      );
      bounce.start();
      pulse.start();
      loops.push(bounce, pulse);

      const doBlink = () => {
        if (cancelled) return;
        quickBlink(() => {
          if (cancelled) return;
          timers.push(setTimeout(() => !cancelled && quickBlink(), 140)); // double blink
          timers.push(setTimeout(doBlink, 700 + Math.random() * 700));
        });
      };
      timers.push(setTimeout(doBlink, 200));
    } else {
      // waiting — look down at the loading text and blink slowly
      Animated.parallel([
        Animated.timing(lookX, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(lookY, { toValue: 3, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bounceY, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(scaleA, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      const doBlink = () => {
        if (cancelled) return;
        quickBlink(() => {
          if (cancelled) return;
          timers.push(setTimeout(doBlink, 1800 + Math.random() * 2200));
        });
      };
      timers.push(setTimeout(doBlink, 1400));
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [mood, blink, lookX, lookY, bounceY, scaleA]);

  return (
    <Animated.View style={[styles.face, { transform: [{ translateY: bounceY }, { scale: scaleA }] }]}>
      <Animated.View style={[styles.eyes, { transform: [{ translateX: lookX }, { translateY: lookY }] }]}>
        <Animated.View style={[styles.eye, { transform: [{ scaleY: blink }] }]} />
        <Animated.View style={[styles.eye, { transform: [{ scaleY: blink }] }]} />
      </Animated.View>
      <View style={styles.mouth} />
    </Animated.View>
  );
}

// Roughly how many characters fit on the tiny monitor at this font size.
const PANEL_MAX_CHARS = 10;

/** Mirrors the live typed text on the monitor, with a blinking cursor.
    Shows the most recent characters — older ones scroll off the left. */
function TerminalText({ text }: { text: string }) {
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setCursor((v) => !v), 500);
    return () => clearInterval(id);
  }, []);
  const shown = text.length > PANEL_MAX_CHARS ? text.slice(-PANEL_MAX_CHARS) : text;
  return (
    <Text style={styles.panelText} numberOfLines={1}>
      {shown}
      {cursor ? "▋" : ""}
    </Text>
  );
}

/**
 * The server illustration with its little monitor. While `mood` is "idle" the
 * panel mirrors the live typed `label` (or an idle smiley when empty); other
 * moods always show the smiley acting that mood. Self-contained — drop it anywhere.
 */
export function ServerTerminal({
  style,
  label,
  mood = "idle",
}: {
  style?: StyleProp<ViewStyle>;
  label?: string;
  mood?: Mood;
}) {
  const hasText = (label ?? "").trim().length > 0;
  const showText = mood === "idle" && hasText;
  return (
    <View style={[styles.imageContainer, style]}>
      <Image
        source={require("@/assets/images/new-design/onboarding/server.png")}
        style={styles.heroImage}
        contentFit="contain"
      />
      <View style={styles.screenRect}>
        {showText ? <TerminalText text={label ?? ""} /> : <SmileyFace mood={mood} />}
      </View>
      <Led left={LED_POSITIONS.power.left} top={LED_POSITIONS.power.top} gid="power" />
      <Led left={LED_POSITIONS.status.left} top={LED_POSITIONS.status.top} gid="status" />
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    width: "95%",
    aspectRatio: 1499 / 521,
    alignSelf: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  screenRect: {
    position: "absolute",
    top: "23%",
    left: "25.5%",
    width: "22.3%",
    height: "30%",
    backgroundColor: "#000",
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  led: {
    position: "absolute",
    width: GLOW,
    height: GLOW,
  },
  panelText: {
    fontFamily: "Courier New",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    color: "#7ED957",
    textAlign: "center",
    paddingHorizontal: 2,
  },
  face: {
    alignItems: "center",
    justifyContent: "center",
  },
  eyes: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 3,
  },
  eye: {
    // Big, round eyes read cuter.
    width: 6,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: GREEN,
  },
  mouth: {
    // Small, gentle smile under the big eyes.
    width: 10,
    height: 6,
    borderColor: GREEN,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: "transparent",
  },
});
