import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { Easing } from "react-native-reanimated";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";

import CopyIcon from "@/assets/images/new-design/connect-more/copy-icon.svg";
import SecureIcon from "@/assets/images/new-design/connect-more/secure.svg";
import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";

import { SFMono, SFPro } from "@/constants/theme";
import { VM_ICONS } from "@/constants/vm-icons";
import { orderVmUrls, useNavbar } from "@/contexts/navbar-context";
import { openConnectionWithKey } from "@/store/connection-store";
import { saveUrl } from "@/store/url-store";
import { setVmMetadata } from "@/store/vm-metadata-store";

const COMMAND = "npx grass start";
type Step = "scan" | "paired" | "setup" | "ready";
const ICONS = VM_ICONS;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectLaptopSlider({ visible, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [copied, setCopied] = useState(false);
  const { vmUrls, setVmUrls, primaryVmUrl } = useNavbar();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [step, setStep] = useState<Step>("scan");
  const [machineName, setMachineName] = useState("");
  const [selectedIconIndex, setSelectedIconIndex] = useState(0);
  const [scannedUrl, setScannedUrl] = useState("");

  const snapPoints = ["90%"];
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.out(Easing.cubic),
  });
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  // Success overlay animation
  const successTranslateY = useSharedValue(800);
  const successStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: successTranslateY.value }],
  }));

  const slideSuccessIn = useCallback(
    (nextStep: "paired" | "ready") => {
      setStep(nextStep);
      successTranslateY.value = 800;
      successTranslateY.value = withSpring(0, { damping: 20, stiffness: 180 });
    },
    [successTranslateY],
  );

  const slideSuccessOut = useCallback(
    (nextStep: Step) => {
      successTranslateY.value = withTiming(800, { duration: 280 }, () => {
        // run on JS thread after animation
      });
      // Use setTimeout so setStep runs after animation starts
      setTimeout(() => setStep(nextStep), 280);
    },
    [successTranslateY],
  );

  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      successTranslateY.value = 800;
      setCopied(false);
      setCameraEnabled(false);
      setStep("scan");
      setMachineName("");
      setSelectedIconIndex(0);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, successTranslateY]);

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

  const isGreenStep = step === "paired" || step === "ready";
  const SelectedIconComponent = ICONS[selectedIconIndex];

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      onDismiss={() => { setCameraEnabled(false); onClose(); }}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.dragHandle}
    >
      {/* Close button */}
      <TouchableOpacity
        onPress={() => { setCameraEnabled(false); bottomSheetRef.current?.dismiss(); }}
        style={styles.closeButton}
        hitSlop={8}
      >
        <View style={styles.closeX}>
          <Text style={styles.closeXText}>✕</Text>
        </View>
      </TouchableOpacity>

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

          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
          </BottomSheetScrollView>
        </>
      )}

      {/* ── Setup step ── */}
      {step === "setup" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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
              {ICONS.map((IconComp, index) => {
                const isSelected = selectedIconIndex === index;
                return (
                  <View key={index} style={styles.iconWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.iconItem,
                        isSelected && styles.iconItemSelected,
                      ]}
                      onPress={() => {
                        Keyboard.dismiss();
                        setSelectedIconIndex(index);
                      }}
                      activeOpacity={0.8}
                    >
                      {isSelected ? (
                        <View style={styles.iconInnerCircle}>
                          <IconComp width={60} height={60} />
                        </View>
                      ) : (
                        <IconComp width={44} height={44} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
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
        </KeyboardAvoidingView>
      )}

      {/* ── Green success overlay (paired + ready) ── */}
      <Animated.View
        style={[styles.successOverlay, successStyle]}
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
                  <SelectedIconComponent width={60} height={60} />
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
                onPress={() => bottomSheetRef.current?.dismiss()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Start a session</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={() => {
                  successTranslateY.value = 800;
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
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFF",
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  closeX: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  closeXText: {
    fontSize: 14,
    color: "#333",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerText: {
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
  },
  greenCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  readyIconGlow: {
    width: 80,
    height: 80,
    borderRadius: 100,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  readyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 70,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  setupScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 28,
  },
  iconSelectorContent: {
    paddingVertical: 8,
    gap: 4,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  iconItem: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "transparent",
    backgroundColor: "#E3FDD7",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  iconItemSelected: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#3D841E",
    backgroundColor: "#FFF",
  },
  iconInnerCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#E3FDD7",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
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
