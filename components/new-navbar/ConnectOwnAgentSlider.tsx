import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
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

import ClaudeTransparentIcon from "@/assets/images/new-design/connect-more/claude-transparent.svg";
import ClaudeIcon from "@/assets/images/new-design/connect-more/claude.svg";
import CopyIcon from "@/assets/images/new-design/connect-more/copy-icon.svg";
import LogoIcon from "@/assets/images/new-design/connect-more/logo.svg";
import OpenCodeIcon from "@/assets/images/new-design/connect-more/opencode-transparent.svg";
import SecureIcon from "@/assets/images/new-design/connect-more/secure.svg";
import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";

import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const CLOSE_THRESHOLD = 80;
const SKELETON_DURATION = 5000;

const CLAUDE_AUTH_URL = "claude.ai/oauth/device?code=GRSS";
const TABS = ["Claude Code", "Opencode"] as const;
type Tab = (typeof TABS)[number];
type Step = "form" | "connected";

type Props = {
  visible: boolean;
  onClose: () => void;
};

function SkeletonBox({
  width,
  height,
  borderRadius = 8,
  style,
}: {
  width?: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  return (
    <View
      style={[
        {
          width: width ?? "100%",
          height,
          borderRadius,
          backgroundColor: "#E8E8E8",
        },
        style,
      ]}
    />
  );
}

export function ConnectOwnAgentSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [activeTab, setActiveTab] = useState<Tab>("Claude Code");
  const [authCode, setAuthCode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<Step>("form");
  const authInputRef = useRef<TextInput>(null);
  const skeletonTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (skeletonTimer.current) clearTimeout(skeletonTimer.current);
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
      setActiveTab("Claude Code");
      setAuthCode("");
      setAuthError(false);
      setIsLoading(true);
      setStep("form");
      open();
      skeletonTimer.current = setTimeout(() => {
        setIsLoading(false);
      }, SKELETON_DURATION);
    }
    return () => {
      if (skeletonTimer.current) clearTimeout(skeletonTimer.current);
    };
  }, [visible, open, translateY, successTranslateY]);

  const slideSuccessIn = useCallback(() => {
    setStep("connected");
    successTranslateY.setValue(SHEET_HEIGHT);
    Animated.spring(successTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 180,
    }).start();
  }, [successTranslateY]);

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

  const handleCopy = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleOpenBrowser = useCallback(() => {
    Linking.openURL(`https://${CLAUDE_AUTH_URL}`);
  }, []);

  const handleConnect = useCallback(() => {
    if (authCode.trim().length < 1) {
      setAuthError(true);
      return;
    }
    setAuthError(false);
    slideSuccessIn();
  }, [authCode, slideSuccessIn]);

  const agentLabel = activeTab === "Claude Code" ? "Claude" : "Opencode";
  const isGreenStep = step === "connected";

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

      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          {!isGreenStep && (
            <LinearGradient
              colors={[
                "#FFF",
                "rgba(255,255,255,0.90)",
                "rgba(255,255,255,0.00)",
              ]}
              locations={[0.2862, 0.7975, 1]}
              style={StyleSheet.absoluteFillObject}
              pointerEvents="none"
            />
          )}

          {/* Drag handle */}
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={[styles.dragger, isGreenStep && styles.draggerOnGreen]} />
          </View>

          {/* Close button – top right */}
          <TouchableOpacity
            onPress={close}
            style={[styles.closeButton, isGreenStep && styles.closeButtonTranslucent]}
            hitSlop={8}
          >
            <CloseIcon />
          </TouchableOpacity>

          {/* Header */}
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Connect your own agent</Text>
                <Text style={styles.headerSubtitle}>
                  All optional. Set up whenever you&#39;re ready.
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Single card containing tabs + steps */}
            <View style={styles.card}>
              {/* Tabs row */}
              <View style={styles.tabRow}>
                {TABS.map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tab, isActive && styles.tabActive]}
                      onPress={() => {
                        setActiveTab(tab);
                        setAuthCode("");
                        setAuthError(false);
                      }}
                      activeOpacity={0.7}
                    >
                      {tab === "Claude Code" ? (
                        <ClaudeTransparentIcon width={18} height={18} />
                      ) : (
                        <OpenCodeIcon width={18} height={18} />
                      )}
                      <Text
                        style={[
                          styles.tabText,
                          isActive && styles.tabTextActive,
                        ]}
                      >
                        {tab}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Step 1 */}
              <View style={styles.stepBlock}>
                {/* Connection illustration */}
                <View style={styles.illustrationRow}>
                  {isLoading ? (
                    <SkeletonBox width={44} height={44} borderRadius={10} />
                  ) : activeTab === "Claude Code" ? (
                    <ClaudeIcon width={44} height={44} />
                  ) : (
                    <OpenCodeIcon width={44} height={44} />
                  )}
                  <Image
                    source={require("@/assets/images/new-design/connect-more/arrow-lock-arrow.png")}
                    style={styles.arrowImage}
                    resizeMode="contain"
                  />
                  {isLoading ? (
                    <SkeletonBox width={44} height={44} borderRadius={10} />
                  ) : (
                    <LogoIcon width={44} height={44} />
                  )}
                </View>

                <View style={styles.stepHeader}>
                  {isLoading ? (
                    <SkeletonBox width={160} height={18} borderRadius={6} />
                  ) : (
                    <>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>1</Text>
                      </View>
                      <Text style={styles.stepTitle}>Connect {agentLabel}</Text>
                    </>
                  )}
                </View>

                {isLoading ? (
                  <View style={styles.skeletonDescGroup}>
                    <SkeletonBox width="90%" height={13} borderRadius={6} />
                    <SkeletonBox width="100%" height={13} borderRadius={6} />
                    <SkeletonBox width="70%" height={13} borderRadius={6} />
                  </View>
                ) : (
                  <Text style={styles.stepDesc}>
                    {activeTab === "Claude Code"
                      ? "You'll be redirected to Anthropic to login, and authorize Grass."
                      : "You'll be redirected to Opencode to login, and authorize Grass."}
                  </Text>
                )}

                {/* URL input */}
                {isLoading ? (
                  <SkeletonBox height={40} borderRadius={10} />
                ) : (
                  <View style={styles.urlInputBox}>
                    <Text style={styles.urlInputText} numberOfLines={1}>
                      {CLAUDE_AUTH_URL}
                    </Text>
                  </View>
                )}

                {/* Buttons */}
                {isLoading ? (
                  <View style={styles.buttonRow}>
                    <SkeletonBox width="42%" height={38} borderRadius={40} />
                    <SkeletonBox width="55%" height={38} borderRadius={40} />
                  </View>
                ) : (
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={handleCopy}
                      activeOpacity={0.75}
                    >
                      <CopyIcon width={15} height={15} />
                      <Text style={styles.copyButtonText}>
                        {copied ? "Copied!" : "Copy link"}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.openBrowserButton}
                      onPress={handleOpenBrowser}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.openBrowserText}>
                        Open in browser
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Divider */}
              <View style={styles.cardDivider} />

              {/* Step 2 */}
              <View style={styles.stepBlock}>
                <View style={styles.stepHeader}>
                  {isLoading ? (
                    <SkeletonBox width={200} height={18} borderRadius={6} />
                  ) : (
                    <>
                      <View style={styles.stepBadge}>
                        <Text style={styles.stepBadgeText}>2</Text>
                      </View>
                      <Text style={styles.stepTitle}>
                        Paste your auth code here
                      </Text>
                    </>
                  )}
                </View>

                {/* Auth code input */}
                {isLoading ? (
                  <SkeletonBox height={48} borderRadius={10} />
                ) : (
                  <TextInput
                    ref={authInputRef}
                    style={[
                      styles.authInput,
                      authError && styles.authInputError,
                    ]}
                    placeholder="Enter auth code"
                    placeholderTextColor="#9F9F9F"
                    value={authCode}
                    onChangeText={(t) => {
                      setAuthCode(t);
                      setAuthError(false);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                )}

                {authError && (
                  <Text style={styles.errorText}>
                    That code doesn&apos;t match. Try again.
                  </Text>
                )}

                {/* Connect button */}
                {isLoading ? (
                  <SkeletonBox height={52} borderRadius={50} />
                ) : (
                  <View
                    style={[
                      styles.connectButtonWrap,
                      authCode.trim().length === 0 &&
                        styles.connectButtonWrapNoShadow,
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.connectButton,
                        authCode.trim().length > 0
                          ? styles.connectButtonActive
                          : styles.connectButtonDisabled,
                      ]}
                      onPress={handleConnect}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.connectButtonText}>
                        Connect {agentLabel}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <SecureIcon width={14} height={14} />
              <Text style={styles.footerNote}>
                Auth happens on Anthropic&apos;s servers, not ours.
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} style={styles.learnMoreWrap}>
              <Text style={styles.learnMoreText}>Learn more →</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── Green success overlay — slides up from bottom ── */}
          <Animated.View
            style={[
              styles.successOverlay,
              { transform: [{ translateY: successTranslateY }] },
            ]}
            pointerEvents={isGreenStep ? "auto" : "none"}
          >
            {step === "connected" && (
              <View style={styles.greenContent}>
                <View style={styles.greenCenter}>
                  <SuccessMark width={192} height={244} />
                  <Text style={styles.greenTitle}>Agent connected</Text>
                  <Text style={styles.greenSubtitle}>
                    Claude Code is ready to run on your Mac.
                  </Text>
                </View>
                <View style={styles.greenFooter}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={close}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.primaryButtonText}>Start a session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.addAnotherButton}
                    onPress={() => {
                      successTranslateY.setValue(SHEET_HEIGHT);
                      setStep("form");
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
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
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
    height: SHEET_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: "transparent",
    marginBottom: 20,
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerText: {
    gap: 4,
  },
  headerTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 28,
    lineHeight: 31,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#808080",
    letterSpacing: -0.2,
  },
  closeButton: {
    position: "absolute",
    top: 14,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 14,
  },
  // Card
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  cardDivider: {
    height: 1,
    backgroundColor: "#DFDFDF",
  },
  // Tabs
  tabRow: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
  },
  tabActive: {
    borderColor: "#3D841E",
    backgroundColor: "#E3FDD7",
  },
  tabText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.2,
  },
  tabTextActive: {
    color: "#000",
    fontFamily: SFPro.semiBold,
  },
  // Steps
  stepBlock: {
    padding: 16,
    gap: 12,
  },
  illustrationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  arrowImage: {
    width: 60,
    height: 28,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#3D841E",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontFamily: SFPro.bold,
    fontSize: 13,
    color: "#FFF",
    lineHeight: 16,
  },
  stepTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  skeletonDescGroup: {
    gap: 6,
    paddingLeft: 34,
  },
  urlInputBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  urlInputText: {
    fontFamily: "DM Mono",
    fontSize: 16,
    color: "#000",
    fontWeight: 400,
    letterSpacing: -0.2,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#808080",
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  copyButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  openBrowserButton: {
    flex: 1,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    paddingHorizontal: 16,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  openBrowserText: {
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#FFF",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  // Auth input (single box)
  authInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9F9F9F",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.2,
    height: 48,
  },
  authInputError: {
    borderColor: "#841E1E",
  },
  errorText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#841E1E",
    lineHeight: 18,
  },
  connectButtonWrap: {
    borderRadius: 50,
    shadowColor: "rgba(84, 147, 50, 0.70)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
    marginTop: 4,
  },
  connectButtonWrapNoShadow: {
    shadowColor: "transparent",
    shadowRadius: 0,
    elevation: 0,
  },
  connectButton: {
    borderRadius: 50,
    borderWidth: 2,
    height: 52,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  connectButtonActive: {
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
  },
  connectButtonDisabled: {
    borderColor: "#808080",
    backgroundColor: "#9F9F9F",
    shadowColor: "transparent",
    shadowRadius: 0,
    elevation: 0,
  },
  connectButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#F2F2F2",
    letterSpacing: -0.5,
  },
  // Footer
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerNote: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#888",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  learnMoreWrap: {
    alignItems: "center",
  },
  learnMoreText: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#3D841E",
    letterSpacing: -0.2,
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
