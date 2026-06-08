import { getVmName } from "@/store/vm-metadata-store";
import { AgentOrbitVisual } from "@/components/onboarding/AgentOrbitVisual";
import { OnboardingAuthSheet } from "@/components/onboarding/OnboardingAuthSheet";
import { TicketVisual } from "@/components/onboarding/TicketVisual";
import { TaskLoopVisual } from "@/components/onboarding/TaskLoopVisual";
import { SFPro } from "@/constants/theme";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LogoFull from "@/assets/images/new-design/onboarding/logo-full.svg";

const { width: SCREEN_W } = Dimensions.get("window");
const SIDE = 24; // screen inset on the left (and to the right of the last card)
const PEEK = 26; // how much of the next card peeks in at the right edge
const GAP = 14; // gap between cards
const CARD_W = SCREEN_W - SIDE - PEEK - GAP;
const ITEM_W = CARD_W + GAP; // snap interval
const BG_SHIFT = 90; // how far the background drifts right across the whole scroll
const LOGO_W = 132;
const LOGO_H = (LOGO_W * 206) / 666; // preserve the logo's aspect ratio

type Slide = {
  title: string;
  body: string;
  image?: ReturnType<typeof require>;
  /** Render the animated server + task-loop illustration as the visual. */
  taskLoop?: boolean;
  /** Render the orbiting agent-icons illustration as the visual. */
  orbit?: boolean;
  /** Render the "7 days free" pass illustration as the visual. */
  pass?: boolean;
};

const SLIDES: Slide[] = [
  {
    title: "Your agents\nneed a home.",
    body: "Grass gives every AI agent a real cloud machine. No sandboxes. No timeouts. Just work that keeps on running.",
    taskLoop: true,
  },
  {
    title: "Run it from\nyour pocket.",
    body: "Start tasks and check progress right from your iPhone. Your agents work while you move across the world today.",
    image: require("@/assets/images/new-design/onboarding/card-pocket.webp"),
  },
  {
    title: "Any agent.\nAny machine.",
    body: "Claude Code, OpenCode, or your own. Use Grass or any VM you connect. Your own stack and your own rules, always.",
    orbit: true,
  },
  {
    title: "Your first week\nis on us.",
    body: "Your first week is on us. No credit card. No catch. Just let it run. See what agents do when they never sleep.",
    pass: true,
  },
];

const ORBIT_INDEX = SLIDES.findIndex((s) => s.orbit);
// Fraction of a card-step away from centre at which the orbit starts animating
// in (0.8 ⇒ ~20% into the swipe, vs 0.5/50% for the normal active state).
const ORBIT_TRIGGER = 0.8;

function OnboardingCard({
  slide,
  last,
  active,
}: {
  slide: Slide;
  last?: boolean;
  active?: boolean;
}) {
  return (
    <View style={[styles.itemWrap, last && styles.itemWrapLast]}>
      {/* Outer layer carries the shadow; inner layer clips the visual to the
          rounded corners (overflow:hidden on the shadow layer would hide it). */}
      <View style={styles.card}>
        <View style={styles.cardInner}>
          {/* Visual — flush to the top/left/right edges of the card, with a
              bottom fade so it blends into the text instead of cutting hard. */}
          <View style={styles.visualHost}>
            {slide.taskLoop ? (
              <TaskLoopVisual />
            ) : slide.orbit ? (
              <AgentOrbitVisual active={!!active} />
            ) : slide.pass ? (
              <TicketVisual active={!!active} />
            ) : slide.image ? (
              <View style={styles.visual}>
                <ExpoImage
                  source={slide.image}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              </View>
            ) : (
              <View style={styles.visual} />
            )}
            {!slide.taskLoop && (
              <LinearGradient
                colors={["rgba(255,255,255,0)", "#FFFFFF"]}
                style={styles.visualFade}
                pointerEvents="none"
              />
            )}
          </View>

          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>{slide.title}</Text>
            <Text style={styles.cardBody}>{slide.body}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const currentX = useRef(0);
  const maxOffset = useRef((SLIDES.length - 1) * ITEM_W);
  const autoScroll = useRef<Animated.CompositeAnimation | null>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Background drifts a little to the right as the cards scroll left.
  const bgTranslateX = scrollX.interpolate({
    inputRange: [0, (SLIDES.length - 1) * ITEM_W],
    outputRange: [0, BG_SHIFT],
    extrapolate: "clamp",
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [orbitActive, setOrbitActive] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Gentle fade + rise on first paint.
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const isLast = activeIndex >= SLIDES.length - 1;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;
        currentX.current = x;
        const idx = Math.min(SLIDES.length - 1, Math.max(0, Math.round(x / ITEM_W)));
        setActiveIndex((prev) => (prev !== idx ? idx : prev));
        if (ORBIT_INDEX >= 0) {
          const near = Math.abs(x - ORBIT_INDEX * ITEM_W) < ITEM_W * ORBIT_TRIGGER;
          setOrbitActive((prev) => (prev !== near ? near : prev));
        }
      },
    },
  );

  // If the user grabs the carousel mid-glide, stop the auto-scroll so we don't fight them.
  const handleTouchStart = () => autoScroll.current?.stop();

  const handleVerified = async (type: "new" | "old") => {
    const existingName = await getVmName();
    if (type === "old" || existingName) {
      router.replace({
        pathname: "/onboarding/vm-final" as any,
        params: { vmName: existingName ?? "" },
      });
    } else {
      router.replace("/onboarding/vm-ready" as any);
    }
  };

  const handlePrimary = () => {
    if (isLast) {
      setAuthMode("signup");
      setAuthVisible(true);
      return;
    }
    // Slowly glide to the last card so the user can scan each one on the way.
    const startX = currentX.current;
    const targetX = maxOffset.current;
    const pagesToGo = Math.max(1, Math.round((targetX - startX) / ITEM_W));
    const driver = new Animated.Value(startX);
    const id = driver.addListener(({ value }) => {
      scrollRef.current?.scrollTo({ x: value, animated: false });
    });
    autoScroll.current?.stop();
    autoScroll.current = Animated.timing(driver, {
      toValue: targetX,
      duration: pagesToGo * 900,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    });
    autoScroll.current.start(() => driver.removeListener(id));
  };

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.bgWrap, { transform: [{ translateX: bgTranslateX }] }]}
        pointerEvents="none"
      >
        <ExpoImage
          source={require("@/assets/images/new-design/onboarding/onboarding-bg.webp")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="left"
        />
      </Animated.View>
      <StatusBar style="light" />

      <Animated.View
        style={[
          styles.body,
          {
            paddingTop: insets.top + 30,
            paddingBottom: insets.bottom + 20,
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Logo */}
        <View style={styles.wordmark}>
          <LogoFull width={LOGO_W} height={LOGO_H} />
        </View>

        {/* Carousel */}
        <View style={styles.carouselWrap}>
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            snapToInterval={ITEM_W}
            snapToAlignment="start"
            decelerationRate="fast"
            disableIntervalMomentum
            contentContainerStyle={styles.scrollContent}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            onScrollBeginDrag={handleTouchStart}
            onContentSizeChange={(w) => {
              maxOffset.current = Math.max(0, w - SCREEN_W);
            }}
            scrollEventThrottle={16}
          >
            {SLIDES.map((slide, i) => (
              <OnboardingCard
                key={i}
                slide={slide}
                last={i === SLIDES.length - 1}
                active={slide.orbit ? orbitActive : i === activeIndex}
              />
            ))}
          </Animated.ScrollView>
        </View>

        {/* Pagination */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Primary CTA */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.button} activeOpacity={0.85} onPress={handlePrimary}>
            <Text style={styles.buttonText}>
              {isLast ? "Get Started" : "Scroll to the end  →"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginRow}
            onPress={() => {
              setAuthMode("login");
              setAuthVisible(true);
            }}
          >
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <OnboardingAuthSheet
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onVerified={handleVerified}
        mode={authMode}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#2077D1",
  },
  bgWrap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    // Extra slack on the left so the rightward parallax drift never exposes a gap.
    left: -BG_SHIFT,
    width: SCREEN_W + BG_SHIFT,
  },
  body: {
    flex: 1,
    paddingHorizontal: SIDE,
  },

  // Logo
  wordmark: {
    alignSelf: "center",
  },

  // Carousel
  carouselWrap: {
    flex: 1,
    // Cancel the body's horizontal padding so the carousel spans the full screen
    // width (lets the next card peek in at the right edge).
    marginHorizontal: -SIDE,
  },
  scrollContent: {
    // First card inset from the left; trailing inset so the last card rests
    // flush with the same margin instead of leaving a dead gap.
    paddingLeft: SIDE,
    paddingRight: SIDE,
  },
  itemWrap: {
    width: CARD_W,
    marginRight: GAP,
    // Equal vertical room top/bottom so the card sits centered, with enough
    // space for the soft shadow to clear the ScrollView bounds.
    paddingTop: 24,
    paddingBottom: 24,
  },
  itemWrapLast: {
    marginRight: 0,
  },
  card: {
    flex: 1,
    width: CARD_W,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  cardInner: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  visualHost: {
    flex: 1,
    overflow: "hidden",
  },
  visualFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  visual: {
    // Fills the space above the text.
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardTextWrap: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 28,
  },
  cardTitle: {
    fontFamily: SFPro.displayBold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: "#16243A",
    marginBottom: 12,
  },
  cardBody: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    lineHeight: 23,
    color: "#56657D",
  },

  // Pagination
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 0,
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: "#FFFFFF",
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(255,255,255,0.35)",
  },

  // Footer
  footer: {
    alignItems: "center",
  },
  button: {
    width: "100%",
    height: 54,
    borderRadius: 50,
    backgroundColor: "#3D841E",
    borderWidth: 2,
    borderColor: "#72C44E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  loginRow: {
    marginTop: 18,
  },
  loginText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#000000",
  },
  loginLink: {
    fontFamily: SFPro.bold,
    color: "#000000",
  },
});
