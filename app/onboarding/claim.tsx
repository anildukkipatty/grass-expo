import { OnboardingAuthSheet } from "@/components/onboarding/OnboardingAuthSheet";
import { SFPro } from "@/constants/theme";
import { getVmName } from "@/store/vm-metadata-store";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

const DOT_COLS = 5;
const DOT_ROWS = 3;
const GREEN = "#4FA825";
const CONFETTI_COLORS = ["#4FA825", "#7ED957", "#3A7D1C", "#5CC330", "#2E6B10", "#8FE85A", "#6DD148", "#A8E87A"];
const CONFETTI_COUNT = 80;

export default function OnboardingClaimScreen() {
  const router = useRouter();
  const scale = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const imageScale = useRef(new Animated.Value(1)).current;
  const imageTranslateX = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const [claimed, setClaimed] = useState(false);
  const [authVisible, setAuthVisible] = useState(false);
  const screenDims = useRef(Dimensions.get("window")).current;

  const handleVerified = async (type: "new" | "old") => {
    const existingName = await getVmName();
    if (type === "old" || existingName) {
      router.replace({ pathname: "/onboarding/vm-final" as any, params: { vmName: existingName ?? "" } });
    } else {
      router.replace("/onboarding/vm-ready" as any);
    }
  };

  // Claimed terminal loop animation values
  const claimedTextOp = useRef(new Animated.Value(0)).current;
  const heartOp = useRef(new Animated.Value(0)).current;
  const smileOp = useRef(new Animated.Value(0)).current;

  const confettiAnims = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(1),
      rotate: new Animated.Value(0),
    }))
  ).current;
  const [confettiVisible, setConfettiVisible] = useState(false);
  const [confettiPieces] = useState(() =>
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      startX: Math.random() * screenDims.width,
      driftX: (Math.random() - 0.5) * 60,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      w: Math.random() * 8 + 4,
      h: Math.random() * 12 + 6,
      delay: Math.random() * 600,
      fallDuration: Math.random() * 1000 + 1500,
      maxRotation: (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 4) + 2) * 180,
    }))
  );

  const dotAnims = useRef(
    Array.from({ length: DOT_COLS * DOT_ROWS }, () => new Animated.Value(0.15))
  ).current;
  const flashAnim = useRef(new Animated.Value(0)).current;

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [activeLine, setActiveLine] = useState(1);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];

    Animated.loop(
      Animated.sequence([
        Animated.delay(2500),
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
        Animated.delay(600),
        Animated.timing(flashAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ])
    ).start();

    dotAnims.forEach((anim, i) => {
      const id = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
            Animated.timing(anim, { toValue: 0.15, duration: 500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          ])
        ).start();
      }, (i * 100) % 1000);
      timeoutIds.push(id);
    });

    const text1 = "> INIT VM";
    const text2 = "> ALLOC 10H";
    let i = 0;
    const t1 = setInterval(() => {
      i++;
      setLine1(text1.slice(0, i));
      if (i >= text1.length) {
        clearInterval(t1);
        const delay = setTimeout(() => {
          setActiveLine(2);
          let j = 0;
          const t2 = setInterval(() => {
            j++;
            setLine2(text2.slice(0, j));
            if (j >= text2.length) { clearInterval(t2); setActiveLine(0); }
          }, 100);
          timeoutIds.push(t2 as unknown as ReturnType<typeof setTimeout>);
        }, 400);
        timeoutIds.push(delay);
      }
    }, 100);
    timeoutIds.push(t1 as unknown as ReturnType<typeof setTimeout>);

    const cursorId = setInterval(() => setShowCursor(v => !v), 500);
    return () => {
      timeoutIds.forEach(clearTimeout);
      dotAnims.forEach(a => a.stopAnimation());
      flashAnim.stopAnimation();
      clearInterval(cursorId);
    };
  }, []);

  // Claimed terminal loop: text → disappears → heart (left) → smile (right) → both disappear → repeat
  useEffect(() => {
    if (!claimed) return;
    claimedTextOp.setValue(0);
    heartOp.setValue(0);
    smileOp.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(claimedTextOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(900),
        Animated.timing(claimedTextOp, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.delay(150),
        Animated.timing(heartOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(450),
        Animated.timing(smileOp, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(750),
        Animated.parallel([
          Animated.timing(heartOp, { toValue: 0, duration: 150, useNativeDriver: true }),
          Animated.timing(smileOp, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]),
        Animated.delay(200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [claimed]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#3D841E", "#2A5C14"],
  });

  const onPressIn = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 60, bounciness: 0 }),
      Animated.spring(colorAnim, { toValue: 1, useNativeDriver: false, speed: 60, bounciness: 0 }),
    ]).start();
  };

  const onPressOut = () => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 5 }),
      Animated.spring(colorAnim, { toValue: 0, useNativeDriver: false, speed: 30, bounciness: 0 }),
    ]).start();
  };

  const launchConfetti = () => {
    setConfettiVisible(true);
    const { height } = screenDims;

    confettiAnims.forEach((anim, i) => {
      anim.translateY.setValue(0);
      anim.translateX.setValue(0);
      anim.opacity.setValue(1);
      anim.rotate.setValue(0);

      const piece = confettiPieces[i];
      setTimeout(() => {
        Animated.timing(anim.translateY, {
          toValue: height + 40,
          duration: piece.fallDuration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }).start();

        Animated.timing(anim.translateX, {
          toValue: piece.driftX,
          duration: piece.fallDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();

        Animated.timing(anim.rotate, {
          toValue: 1,
          duration: piece.fallDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }).start();

        Animated.sequence([
          Animated.delay(piece.fallDuration * 0.65),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: piece.fallDuration * 0.35,
            useNativeDriver: true,
          }),
        ]).start();
      }, piece.delay);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.imageWrapper}>
          <Animated.View style={[styles.imageContainer, { transform: [{ scale: imageScale }, { translateX: imageTranslateX }] }]}>
            <Image
              source={require("@/assets/images/new-design/onboarding/server.png")}
              style={styles.heroImage}
              contentFit="contain"
            />
            <View style={styles.screenRect}>
              <View style={styles.dotGrid}>
                {dotAnims.map((anim, i) => (
                  <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
                ))}
              </View>
              <View style={styles.terminal}>
                {!claimed && line1 !== "" && (
                  <Text style={styles.monoLine}>
                    {line1}{activeLine === 1 && showCursor ? "▋" : ""}
                  </Text>
                )}
                {!claimed && line2 !== "" && (
                  <Text style={styles.monoLine}>
                    {line2}{activeLine === 2 && showCursor ? "▋" : ""}
                  </Text>
                )}
                {!claimed && (
                  <Animated.Text style={[styles.monoLineFree, { opacity: flashAnim }]}>
                    FREE
                  </Animated.Text>
                )}
              </View>

              {/* Claimed overlay — covers the full screenRect */}
              {claimed && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}>
                  {/* "I'M YOURS" fills full width */}
                  <Animated.View style={[StyleSheet.absoluteFill, { justifyContent: "center", alignItems: "center", opacity: claimedTextOp }]}>
                    <Text style={styles.claimedText} numberOfLines={1} adjustsFontSizeToFit>
                      I'M YOURS
                    </Text>
                  </Animated.View>

                  {/* Heart — left half */}
                  <Animated.View style={[styles.symbolHalf, { left: 0, opacity: heartOp }]}>
                    <Text style={styles.symbolText} numberOfLines={1} adjustsFontSizeToFit>♥</Text>
                  </Animated.View>

                  {/* Smiley — right half */}
                  <Animated.View style={[styles.symbolHalf, { right: 0, opacity: smileOp }]}>
                    <Text style={styles.symbolText} numberOfLines={1} adjustsFontSizeToFit>☻</Text>
                  </Animated.View>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
        <Animated.View style={[styles.textSection, { opacity: textOpacity }]}>
          <View style={styles.pretitlePill}>
            <Text style={styles.pretitle}>{claimed ? "It's yours" : "Compute unlocked"}</Text>
          </View>
          <Text style={styles.title}>{claimed ? "10 cloud hours added." : "Your first 10 cloud hours are ready."}</Text>
          <Text style={styles.subtitle}>{claimed ? "Your agents now have space to run. Come back every month for 10 more." : "Run your agents in the cloud.\nNo card needed."}</Text>
          <Pressable
            style={styles.pressable}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => {
              if (claimed) {
                setAuthVisible(true);
                return;
              }
              launchConfetti();
              const sw = screenDims.width;
              Animated.parallel([
                Animated.spring(imageScale, { toValue: 1.5, useNativeDriver: true, speed: 12, bounciness: 6 }),
                Animated.spring(imageTranslateX, { toValue: sw * 0.15, useNativeDriver: true, speed: 12, bounciness: 6 }),
              ]).start();
              Animated.timing(textOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
                setClaimed(true);
                Animated.timing(textOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
              });
            }}
          >
            <Animated.View style={[styles.buttonShadow, { transform: [{ scale }] }]}>
              <LinearGradient
                colors={["#7ED957", "#1A4D09"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.buttonBorder}
              >
                <Animated.View style={[styles.button, { backgroundColor }]}>
                  <Text style={styles.buttonText}>{claimed ? "Continue" : "Claim 10 hours"}</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </Pressable>
          <Text style={styles.footnote}>{claimed ? "No card needed. Renews automatically every month." : "Renews monthly on the early bird plan."}</Text>
        </Animated.View>
      </View>
      <OnboardingAuthSheet
        visible={authVisible}
        onClose={() => setAuthVisible(false)}
        onVerified={handleVerified}
      />
      {confettiVisible && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {confettiPieces.map((piece, i) => {
            const anim = confettiAnims[i];
            const rotateStr = anim.rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ["0deg", `${piece.maxRotation}deg`],
            });
            return (
              <Animated.View
                key={piece.id}
                style={{
                  position: "absolute",
                  left: piece.startX,
                  top: -20,
                  width: piece.w,
                  height: piece.h,
                  backgroundColor: piece.color,
                  transform: [
                    { translateX: anim.translateX },
                    { translateY: anim.translateY },
                    { rotate: rotateStr },
                  ],
                  opacity: anim.opacity,
                }}
              />
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  imageWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
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
    padding: 3,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  dotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: GREEN,
  },
  terminal: {
    gap: 1,
  },
  monoLine: {
    fontFamily: "Courier New",
    fontSize: 5,
    lineHeight: 7,
    color: GREEN,
  },
  monoLineFree: {
    fontFamily: "Courier New",
    fontSize: 6,
    lineHeight: 8,
    color: "#fff",
    fontWeight: "700",
    letterSpacing: 1,
  },
  claimedText: {
    fontFamily: "Courier New",
    fontSize: 40,
    color: GREEN,
    fontWeight: "700",
    width: "100%",
    textAlign: "center",
  },
  symbolHalf: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "50%",
    justifyContent: "center",
    alignItems: "center",
  },
  symbolText: {
    fontFamily: "Courier New",
    fontSize: 40,
    color: GREEN,
    width: "100%",
    textAlign: "center",
  },
  textSection: {
    alignItems: "center",
    width: "100%",
  },
  pretitlePill: {
    alignSelf: "center",
    backgroundColor: "#EAF7E2",
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  pretitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    lineHeight: 20,
    color: "#4A9A2A",
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -1,
    color: "#000",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: SFPro.regular,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.5,
    color: "#000",
    textAlign: "center",
  },
  pressable: {
    marginTop: 24,
    width: "100%",
  },
  buttonShadow: {
    width: "100%",
  },
  buttonBorder: {
    width: "100%",
    borderRadius: 25,
    borderCurve: "continuous",
    padding: 2,
  },
  button: {
    height: 46,
    borderRadius: 23,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  footnote: {
    marginTop: 10,
    fontFamily: SFPro.regular,
    fontSize: 13,
    lineHeight: 18,
    color: "#999",
    textAlign: "center",
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "500",
    letterSpacing: 0,
    color: "#fff",
  },
});
