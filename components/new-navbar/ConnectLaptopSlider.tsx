import { BlurView } from "expo-blur";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import CopyIcon from "@/assets/images/new-design/connect-more/copy-icon.svg";
import SecureIcon from "@/assets/images/new-design/connect-more/secure.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";

import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;
const COMMAND = "npx grass start";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectLaptopSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [copied, setCopied] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraEnabled, setCameraEnabled] = useState(false);

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
      setCopied(false);
      setCameraEnabled(false);
      open();
    }
  }, [visible, open, translateY]);

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
        "Camera permission required",
        "Please enable camera access in your device settings to scan the QR code.",
      );
      return;
    }

    const result = await requestCameraPermission();
    if (result.granted) {
      setCameraEnabled(true);
    }
  }, [cameraPermission, requestCameraPermission]);

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

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={["#FFF", "rgba(255,255,255,0.90)", "rgba(255,255,255,0.00)"]}
          locations={[0.2862, 0.7975, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Connect your laptop</Text>
            <Text style={styles.headerSubtitle}>
              All optional. Set up whenever you&#39;re ready.
            </Text>
          </View>
          <TouchableOpacity
            onPress={close}
            style={styles.closeButton}
            hitSlop={8}
          >
            <CloseIcon />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
        >
          {/* Step 1 */}
          <View style={styles.stepBlock}>
            <View style={styles.stepHeader}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>1</Text>
              </View>
              <Text style={styles.stepTitle}>Run this in your terminal</Text>
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
          </View>

          {/* Step 2 */}
          <View style={styles.stepBlock}>
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
                      setCameraEnabled(false);
                      Alert.alert("QR Scanned", result.data);
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
                    Tap to scan QR code
                  </Text>
                  <Text style={styles.cameraPlaceholderSub}>
                    Camera access required
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer note */}
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
    maxHeight: SCREEN_HEIGHT * 0.88,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#FFF",
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  closeX: {
    fontSize: 13,
    color: "#666",
    lineHeight: 16,
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
    fontFamily: "SF Mono",
    fontSize: 16,
    color: "#000",
    fontWeight: 500,
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
});
