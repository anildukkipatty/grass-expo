import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
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

import CopyIcon from "@/assets/images/new-design/connect-more/copy-icon.svg";
import SecureIcon from "@/assets/images/new-design/connect-more/secure.svg";
import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";

import { SFMono, SFPro } from "@/constants/theme";
import { VM_ICONS } from "@/constants/vm-icons";
import { orderVmUrls, useNavbar } from "@/contexts/navbar-context";
import { openConnectionWithKey } from "@/store/connection-store";
import { saveUrl } from "@/store/url-store";
import { setVmMetadata } from "@/store/vm-metadata-store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const CLOSE_THRESHOLD = 80;
const COMMAND = "npx grass start";

type Step = "scan" | "paired" | "setup" | "ready";

const ICONS = VM_ICONS;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectLaptopSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const successTranslateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  const [copied, setCopied] = useState(false);
  const { vmUrls, setVmUrls, primaryVmUrl } = useNavbar();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [step, setStep] = useState<Step>("scan");
  const [machineName, setMachineName] = useState("");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [scannedUrl, setScannedUrl] = useState("");

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
    setCameraEnabled(false);
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
      setCopied(false);
      setCameraEnabled(false);
      setStep("scan");
      setMachineName("");
      setSelectedIconIndex(0);
      open();
    }
  }, [visible, open, translateY, successTranslateY]);

  const slideSuccessIn = useCallback(
    (nextStep: "paired" | "ready") => {
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

  const slideSuccessOut = useCallback(
    (nextStep: Step) => {
      Animated.timing(successTranslateY, {
        toValue: SHEET_HEIGHT,
        duration: 280,
        useNativeDriver: true,
      }).start(() => setStep(nextStep));
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

  const handleCopy = useCallback(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleEnableCamera = useCallback(async () => {
    if (cameraPermission?.granted) {
      setCameraEnabled(true);
      return;
    }

    if (cameraPermission?.canAskAgain === false) {
      Alert.alert(
        "Camera access required",
        "Enable camera access for Grass to scan the QR code.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    const result = await requestCameraPermission();
    if (result.granted) {
      setCameraEnabled(true);
    } else if (!result.granted && result.canAskAgain === false) {
      Alert.alert(
        "Camera access denied",
        "Enable camera access for Grass to scan the QR code.",
        [
          { text: "Not now", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() },
        ],
      );
    }
  }, [cameraPermission, requestCameraPermission]);

  if (!visible) return null;

  const isGreenStep = step === "paired" || step === "ready";
  const SelectedIconComponent = ICONS[selectedIconIndex];

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

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
      >
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

        {/* Close button */}
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

        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View
            style={[styles.dragger, isGreenStep && styles.draggerOnGreen]}
          />
        </View>

        {/* ── Scan step ── */}
        {step === "scan" && (
          <>
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Connect your laptop</Text>
                <Text style={styles.headerSubtitle}>
                  All optional. Set up whenever you&#39;re ready.
                </Text>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              bounces={false}
            >
              <View style={styles.stepBlock}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>1</Text>
                  </View>
                  <Text style={styles.stepTitle}>
                    Run this in your terminal
                  </Text>
                </View>

                <View style={styles.commandBox}>
                  <Text style={styles.commandText}>{COMMAND}</Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopy}
                    activeOpacity={0.8}
                  >
                    <CopyIcon width={14} height={14} color="#FFF" />
                    <Text style={styles.copyButtonText}>
                      {copied ? "Copied!" : "Copy"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.stepDivider} />

                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>2</Text>
                  </View>
                  <Text style={styles.stepTitle}>Scan the QR code</Text>
                </View>

                <View style={styles.qrArea}>
                  {cameraEnabled ? (
                    <CameraView
                      style={styles.camera}
                      facing="back"
                      barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                      onBarcodeScanned={(result) => {
                        if (result.data) {
                          setScannedUrl(result.data);
                          setCameraEnabled(false);
                          slideSuccessIn("paired");
                        }
                      }}
                    />
                  ) : (
                    <TouchableOpacity
                      style={styles.cameraPlaceholder}
                      onPress={handleEnableCamera}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.cameraPlaceholderText}>
                        Tap to enable camera
                      </Text>
                      <Text style={styles.cameraPlaceholderSub}>
                        Camera permission required
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <View style={styles.footerSection}>
                <View style={styles.footerRow}>
                  <SecureIcon width={14} height={14} />
                  <Text style={styles.footerNote}>
                    Your code never leaves your machine.
                  </Text>
                </View>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.learnMore}>Learn more →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </>
        )}

        {/* ── Setup step ── */}
        {step === "setup" && (
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <View style={styles.header}>
                  <View style={styles.headerText}>
                    <Text style={styles.headerTitle}>Set up this machine</Text>
                    <Text style={styles.headerSubtitle}>
                      Pick a icon and a name you&#39;ll recognize.
                    </Text>
                  </View>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.setupScrollContent}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.iconSelectorContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {ICONS.map((IconComp, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.iconItem,
                          selectedIconIndex === index &&
                            styles.iconItemSelected,
                        ]}
                        onPress={() => {
                          Keyboard.dismiss();
                          setSelectedIconIndex(index);
                        }}
                        activeOpacity={0.8}
                      >
                        <IconComp width={50} height={50} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.nameInputContainer}>
                    <TextInput
                      style={styles.nameInput}
                      placeholder="Work Laptop"
                      placeholderTextColor="#888"
                      value={machineName}
                      onChangeText={setMachineName}
                      textAlign="center"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                    <Text style={styles.nameLabel}>NAME</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      machineName.trim()
                        ? styles.saveButtonActive
                        : styles.saveButtonInactive,
                    ]}
                    onPress={async () => {
                      if (!machineName.trim()) return;
                      Keyboard.dismiss();
                      const url = scannedUrl.trim();
                      if (url) {
                        await saveUrl(url);
                        await setVmMetadata(url, { name: machineName.trim(), iconIndex: selectedIconIndex });
                        openConnectionWithKey(url, url);
                        setVmUrls(orderVmUrls([...vmUrls, url], primaryVmUrl));
                      }
                      slideSuccessIn("ready");
                    }}
                    activeOpacity={machineName.trim() ? 0.85 : 1}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        )}

        {/* ── Green success overlay (paired + ready) — slides up from bottom ── */}
        <Animated.View
          style={[
            styles.successOverlay,
            { transform: [{ translateY: successTranslateY }] },
          ]}
          pointerEvents={isGreenStep ? "auto" : "none"}
        >
          {/* ── Machine paired step ── */}
          {step === "paired" && (
            <View style={styles.greenContent}>
              <View style={styles.greenCenter}>
                <SuccessMark width={192} height={244} />
                <Text style={styles.greenTitle}>Machine paired</Text>
                <Text style={styles.greenSubtitle}>
                  Your computer is connected to Grass over your local network.
                </Text>
              </View>
              <View style={styles.greenFooter}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => slideSuccessOut("setup")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Ready to go step ── */}
          {step === "ready" && (
            <View style={styles.greenContent}>
              <View style={styles.greenCenter}>
                <View style={styles.readyIconGlow}>
                  <View style={styles.readyIconCircle}>
                    <SelectedIconComponent width={72} height={72} />
                  </View>
                </View>
                <Text style={styles.greenTitle}>Ready to go</Text>
                <Text style={styles.greenSubtitle}>
                  {machineName} is connected. Start a session anytime.
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
                    setStep("scan");
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.addAnotherButtonText}>
                    Add another machine
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
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
    borderRadius: 296,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonTranslucent: {
    backgroundColor: "rgba(255, 255, 255, 0.30)",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 26,
    lineHeight: 31,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#888",
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 20,
  },
  stepBlock: {
    gap: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    padding: 16,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#3D841E",
    borderColor: "rgba(255, 255, 255, 0.50)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: {
    fontFamily: SFPro.bold,
    fontSize: 12,
    color: "#FFF",
    lineHeight: 14,
    letterSpacing: -0.3,
  },
  stepDivider: {
    height: 1,
    backgroundColor: "#EBEBEB",
    marginVertical: 4,
  },
  stepTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.3,
  },
  commandBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  commandText: {
    flex: 1,
    fontFamily: SFMono.medium,
    fontSize: 16,
    color: "#000",
    letterSpacing: -0.2,
    paddingVertical: 6,
  },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copyButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#FFF",
    letterSpacing: -0.2,
  },
  qrArea: {
    borderRadius: 12,
    overflow: "hidden",
    height: 339,
  },
  camera: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cameraPlaceholderText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },
  cameraPlaceholderSub: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#888",
    letterSpacing: -0.2,
  },
  footerSection: {
    alignItems: "center",
    gap: 6,
  },
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
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  learnMore: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#3D841E",
    letterSpacing: -0.2,
    lineHeight: 18,
  },
  // Green success overlay — absolutely fills the sheet and slides up from bottom
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
  // Ready icon
  readyIconGlow: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  readyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  // Setup step
  setupScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 28,
  },
  iconSelectorContent: {
    paddingVertical: 8,
    gap: 12,
  },
  iconItem: {
    width: 72,
    height: 72,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
  },
  iconItemSelected: {
    borderColor: "#3D841E",
    backgroundColor: "rgba(61, 132, 30, 0.08)",
  },
  nameInputContainer: {
    gap: 6,
  },
  nameInput: {
    fontFamily: SFPro.semiBold,
    fontSize: 24,
    color: "#000",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingVertical: 8,
    letterSpacing: -0.3,
  },
  nameLabel: {
    fontFamily: SFPro.medium,
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    letterSpacing: 0.8,
  },
  saveButton: {
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
  },
  saveButtonActive: {
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
  },
  saveButtonInactive: {
    borderColor: "#808080",
    backgroundColor: "#9F9F9F",
  },
  saveButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },
});
