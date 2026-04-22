import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const CLOSE_THRESHOLD = 80;

type Step = "input" | "added" | "cloned";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddRepoSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const scrollRef = useRef<ScrollView>(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [step, setStep] = useState<Step>("input");

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, backdropOpacity]);

  const close = useCallback(() => {
    Keyboard.dismiss();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [translateY, backdropOpacity, onClose]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      successTranslateY.setValue(SHEET_HEIGHT);
      setRepoUrl("");
      setStep("input");
      open();
    }
  }, [visible, open, translateY, successTranslateY]);

  const slideSuccessIn = useCallback(
    (nextStep: "added" | "cloned") => {
      setStep(nextStep);
      successTranslateY.setValue(SHEET_HEIGHT);
      Animated.spring(successTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 180,
      }).start();
    },
    [successTranslateY],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > CLOSE_THRESHOLD || gs.vy > 0.5) {
          close();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  const repoName = (() => {
    const clean = repoUrl.replace(/\.git$/, "");
    return clean.split("/").filter(Boolean).pop() ?? "repo";
  })();

  const repoFullName = (() => {
    const clean = repoUrl.replace(/\.git$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length >= 2)
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    return clean || "repo";
  })();

  const isGreenStep = step === "added" || step === "cloned";

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      <View style={styles.kavContainer} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {!isGreenStep && (
            <LinearGradient
              colors={["#FFF", "#fff"]}
              locations={[0.2862, 0.7975]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
          )}

          {/* Drag handle */}
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View
              style={[styles.dragger, isGreenStep && styles.draggerOnGreen]}
            />
          </View>

          {/* Close button – absolute, always on top */}
          <TouchableOpacity
            onPress={close}
            style={[
              styles.closeButton,
              isGreenStep && styles.closeButtonTranslucent,
            ]}
            hitSlop={8}
          >
            <CloseIcon />
          </TouchableOpacity>

          <KeyboardAvoidingView
            style={styles.kavInner}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              ref={scrollRef}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onScrollBeginDrag={Keyboard.dismiss}
              contentContainerStyle={styles.scrollContent}
            >
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View>
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.headerText}>
                      <Text style={styles.headerTitle}>Add a repository</Text>
                      <Text style={styles.headerSubtitle}>
                        Paste a Git clone URL. No login needed for public repos.
                      </Text>
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.content}>
                    <View style={styles.urlCard}>
                      <Text style={styles.inputLabel}>Repository URL</Text>
                      <TextInput
                        style={styles.input}
                        value={repoUrl}
                        onChangeText={setRepoUrl}
                        placeholder="Paste link here"
                        placeholderTextColor="#B0B0B0"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        onFocus={() => {
                          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
                        }}
                      />
                      <TouchableOpacity
                        style={[
                          styles.button,
                          !repoUrl.trim() && styles.buttonDisabled,
                        ]}
                        activeOpacity={0.85}
                        disabled={!repoUrl.trim()}
                        onPress={() => {
                          if (repoUrl.trim()) {
                            Keyboard.dismiss();
                            slideSuccessIn("added");
                          }
                        }}
                      >
                        <Text style={styles.buttonText}>Add repo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* ── Green success overlay — slides up from bottom ── */}
          <Animated.View
            style={[
              styles.successOverlay,
              { transform: [{ translateY: successTranslateY }] },
            ]}
            pointerEvents={isGreenStep ? "auto" : "none"}
          >
            {/* ── Repo added ── */}
            {step === "added" && (
              <View style={styles.greenContent}>
                <View style={styles.greenCenter}>
                  <SuccessMark width={192} height={244} />
                  <Text style={styles.greenTitle}>Repo added</Text>
                  <View style={styles.repoPillRow}>
                    <View style={styles.repoPill}>
                      <Text style={styles.repoPillText}>{repoFullName}</Text>
                    </View>
                    <Text style={styles.greenSubtitle}>
                      is ready. Start a session anytime.
                    </Text>
                  </View>
                </View>
                <View style={styles.greenFooter}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => slideSuccessIn("cloned")}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>
                      Start a session
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addAnotherButton}
                    onPress={() => {
                      successTranslateY.setValue(SHEET_HEIGHT);
                      setStep("input");
                      setRepoUrl("");
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addAnotherButtonText}>
                      Connect another
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ── Repo cloned ── */}
            {step === "cloned" && (
              <View style={styles.greenContent}>
                <View style={styles.greenCenter}>
                  <SuccessMark width={192} height={244} />
                  <Text style={styles.greenTitle}>Repo cloned</Text>
                  <View style={styles.repoPillRow}>
                    <View style={styles.repoPill}>
                      <Text style={styles.repoPillText}>{repoName}</Text>
                    </View>
                    <Text style={styles.greenSubtitle}>
                      is on your sandbox.{"\n"}Ready when you are.
                    </Text>
                  </View>
                </View>
                <View style={styles.greenFooter}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={close}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>Open session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addAnotherButton}
                    onPress={close}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.addAnotherButtonText}>
                      Back to repos
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
  },
  kavContainer: {
    flex: 1,
    justifyContent: "flex-end",
    pointerEvents: "box-none",
  },
  sheet: {
    width: "100%",
    flex: 1,
    maxHeight: SHEET_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "transparent",
    marginBottom: 25,
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  draggerOnGreen: {
    backgroundColor: "rgba(255, 255, 255, 0.40)",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 294,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonTranslucent: {
    backgroundColor: "rgba(255, 255, 255, 0.30)",
  },
  kavInner: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
    paddingRight: 52,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 31,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    lineHeight: 20,
    color: "#808080",
    letterSpacing: -0.5,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  urlCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    padding: 14,
    gap: 8,
  },
  inputLabel: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "DM Mono",
    fontSize: 15,
    color: "#000",
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  buttonDisabled: {
    borderColor: "#9F9F9F",
    backgroundColor: "#DFDFDF",
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#fff",
    letterSpacing: -0.5,
  },
  // Green success overlay
  successOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#3D841E",
  },
  greenContent: {
    flex: 1,
    paddingBottom: 40,
  },
  greenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  greenTitle: {
    fontFamily: SFPro.bold,
    fontSize: 32,
    color: "#FFF",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  repoPillRow: {
    alignItems: "center",
    gap: 8,
  },
  repoPill: {
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.20)",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  repoPillText: {
    fontFamily: "DM Mono",
    fontSize: 14,
    color: "#FFF",
    letterSpacing: -0.2,
  },
  greenSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.80)",
    textAlign: "center",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  greenFooter: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 50,
    backgroundColor: "#FFF",
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#3D841E",
    letterSpacing: -0.3,
  },
  addAnotherButton: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#FFF",
    paddingVertical: 16,
    alignItems: "center",
  },
  addAnotherButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },
});
