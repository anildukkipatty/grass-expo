import { SFPro } from "@/constants/theme";
import { Image as ExpoImage } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";
import Arrow from "@/assets/images/new-design/onboarding/arrow.svg";

type Status = "done" | "in-progress" | "queued";

type Task = {
  emoji: string;
  label: string;
  status: Status;
  /** Show the animated progress bar instead of a status chip. */
  progress?: boolean;
  /** Show a pulsing dot in the status chip. */
  pulse?: boolean;
};

const TASKS: Task[] = [
  { emoji: "✅", label: 'git commit — "fix: login redirect"', status: "done" },
  { emoji: "⚙️", label: "Running test suite — 31/47", status: "in-progress", progress: true },
  { emoji: "⏳", label: "Deploying to staging", status: "queued" },
  { emoji: "📄", label: "Refactoring auth.ts — 3 files", status: "done" },
  { emoji: "🌐", label: "Browsing docs.stripe.com", status: "in-progress", pulse: true },
];

// iOS spring(response: 0.45, dampingFraction: 0.72) → RN stiffness/damping (mass 1).
const SPRING = { stiffness: 195, damping: 20, mass: 1 } as const;

// Source artwork is 1448×1086. LED centres as a percentage of that image, so they
// stay locked to the same spot on the artwork at every screen size.
const IMAGE_ASPECT = 1448 / 1086;
const LED_POSITIONS = {
  power: { left: 19.3, top: 48.7 },
  status: { left: 19.5, top: 55.2 },
};
const LED_COLOR = "#36D95B";
const GLOW_SIZE = 20; // diameter of the soft glow halo (display px)

// Arrow above the VM. Centre point as % of the server image box (so it stays
// locked to the artwork at every size); ARROW_W is its display width in px.
const ARROW_POS = { left: 50, top: 85 };
const ARROW_W = 150;
const ARROW_H = (ARROW_W * 467) / 1545;

/** Small green server LED: a soft radial glow that blinks at random intervals. */
function Led({ left, top, gid }: { left: number; top: number; gid: string }) {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const blink = () => {
      if (cancelled) return;
      const bright = Math.random() > 0.5;
      // Dim dips lower for punchier blinks; fades stay eased so it reads soft.
      const toValue = bright ? 1 : 0.12 + Math.random() * 0.28;
      const duration = 130 + Math.random() * 170;
      Animated.timing(o, {
        toValue,
        duration,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (cancelled || !finished) return;
        // Short holds → frequent, aggressive blinking.
        const hold = bright ? 70 + Math.random() * 360 : 50 + Math.random() * 170;
        timer = setTimeout(blink, hold);
      });
    };
    timer = setTimeout(blink, Math.random() * 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      o.stopAnimation();
    };
  }, [o]);

  const id = `led-${gid}`;
  return (
    <Animated.View
      style={[
        styles.led,
        {
          left: `${left}%`,
          top: `${top}%`,
          width: GLOW_SIZE,
          height: GLOW_SIZE,
          marginLeft: -GLOW_SIZE / 2,
          marginTop: -GLOW_SIZE / 2,
          opacity: o,
        },
      ]}
    >
      <Svg width={GLOW_SIZE} height={GLOW_SIZE}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#EAFFEF" stopOpacity={1} />
            <Stop offset="0.2" stopColor={LED_COLOR} stopOpacity={0.95} />
            <Stop offset="0.55" stopColor={LED_COLOR} stopOpacity={0.35} />
            <Stop offset="1" stopColor={LED_COLOR} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={GLOW_SIZE / 2} cy={GLOW_SIZE / 2} r={GLOW_SIZE / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const CHIP: Record<Status, { bg: string; fg: string; label: string }> = {
  done: { bg: "#3D841E", fg: "#FFFFFF", label: "Done" },
  "in-progress": { bg: "#2077D1", fg: "#FFFFFF", label: "In progress" },
  queued: { bg: "#E8EDF5", fg: "#56657D", label: "Queued" },
};

function PulseDot({ color }: { color: string }) {
  const o = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(o, { toValue: 0.3, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(o, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, opacity: o }]} />;
}

function StatusChip({ status, pulse }: { status: Status; pulse?: boolean }) {
  const c = CHIP[status];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      {pulse ? <PulseDot color={c.fg} /> : null}
      <Text style={[styles.chipText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

function ProgressBar({ progress }: { progress: Animated.Value }) {
  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["40%", "75%"],
    extrapolate: "clamp",
  });
  return (
    <View style={styles.progressTrack}>
      <Animated.View style={[styles.progressFill, { width }]} />
    </View>
  );
}

export function TaskLoopVisual() {
  const [task, setTask] = useState<Task>(TASKS[0]);
  const idx = useRef(0);

  const y = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runCycle = () => {
      if (cancelled) return;
      const current = TASKS[idx.current];
      setTask(current);

      y.setValue(30);
      opacity.setValue(0);
      scale.setValue(0.92);
      progress.setValue(0);

      const enter = Animated.parallel([
        Animated.spring(y, { toValue: 0, ...SPRING, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, ...SPRING, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 250, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]);

      const exit = Animated.parallel([
        Animated.timing(y, { toValue: -24, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 350, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]);

      enter.start(() => {
        if (cancelled) return;
        // Dwell — fill the progress bar for in-progress cards.
        if (current.progress) {
          Animated.timing(progress, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }).start();
        }
        timers.push(
          setTimeout(() => {
            if (cancelled) return;
            exit.start(() => {
              if (cancelled) return;
              idx.current = (idx.current + 1) % TASKS.length;
              timers.push(setTimeout(runCycle, 150));
            });
          }, 1800),
        );
      });
    };

    runCycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      y.stopAnimation();
      opacity.stopAnimation();
      scale.stopAnimation();
      progress.stopAnimation();
    };
  }, [y, opacity, scale, progress]);

  const c = CHIP[task.status];

  return (
    <View style={styles.root}>
      {/* Server rack pinned in the background. The image fills an aspect-locked
          box so LED positions (set as % of this box) map exactly to the artwork. */}
      <View style={styles.bgWrap} pointerEvents="none">
        <ExpoImage
          source={require("@/assets/images/new-design/onboarding/card-home.webp")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        <View style={styles.tint} />
        <Led left={LED_POSITIONS.power.left} top={LED_POSITIONS.power.top} gid="power" />
        <Led left={LED_POSITIONS.status.left} top={LED_POSITIONS.status.top} gid="status" />
        <Arrow
          width={ARROW_W}
          height={ARROW_H}
          style={[
            styles.arrow,
            {
              left: `${ARROW_POS.left}%`,
              top: `${ARROW_POS.top}%`,
              marginLeft: -ARROW_W / 2,
              marginTop: -ARROW_H / 2,
            },
          ]}
        />
      </View>

      {/* Floating task card. */}
      <View style={styles.cardLayer} pointerEvents="none">
        <Animated.View
          style={[styles.taskCard, { opacity, transform: [{ translateY: y }, { scale }] }]}
        >
          <View style={styles.iconBox}>
            <Text style={styles.emoji}>{task.emoji}</Text>
          </View>
          <View style={styles.taskText}>
            <Text style={styles.taskLabel} numberOfLines={1}>
              {task.label}
            </Text>
            {task.progress ? (
              <ProgressBar progress={progress} />
            ) : (
              <StatusChip status={task.status} pulse={task.pulse} />
            )}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  bgWrap: {
    position: "absolute",
    // Pinned to the lower portion (so the floating card sits above it), width set
    // by the side insets and height derived from the artwork's aspect ratio.
    left: 30,
    right: 30,
    bottom: 0,
    aspectRatio: IMAGE_ASPECT,
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  led: {
    position: "absolute",
  },
  arrow: {
    position: "absolute",
  },
  cardLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    // Card sits in the upper area, above the server image.
    justifyContent: "flex-start",
    paddingTop: "15%",
  },
  taskCard: {
    width: 260,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F4FA",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  taskText: {
    flex: 1,
    marginLeft: 10,
  },
  taskLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#16243A",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
  },
  chipText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#E8EDF5",
    marginTop: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2077D1",
  },
});
