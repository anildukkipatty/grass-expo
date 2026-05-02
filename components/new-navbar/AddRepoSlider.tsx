import SuccessMark from "@/assets/images/new-design/connect-more/success-mark.svg";
import { BlurView } from "expo-blur";
import { SymbolView } from "expo-symbols";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { cloneRepoStore, getEntry } from "@/store/connection-store";

type Step = "input" | "cloned";

type Props = {
  visible: boolean;
  onClose: () => void;
  serverUrl?: string;
  onRepoAdded?: () => void;
};

export function AddRepoSlider({ visible, onClose, serverUrl, onRepoAdded }: Props) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [repoUrl, setRepoUrl] = useState("");
  const [step, setStep] = useState<Step>("input");
  const [isCloning, setIsCloning] = useState(false);
  const [cloneError, setCloneError] = useState<string | null>(null);

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

  const slideSuccessIn = useCallback(() => {
    setStep("cloned");
    successTranslateY.value = 800;
    successTranslateY.value = withSpring(0, { damping: 20, stiffness: 180 });
  }, [successTranslateY]);

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
      successTranslateY.value = 800;
      setRepoUrl("");
      setStep("input");
      setIsCloning(false);
      setCloneError(null);
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible, successTranslateY]);

  const repoFullName = (() => {
    const clean = repoUrl.replace(/\.git$/, "");
    const parts = clean.split("/").filter(Boolean);
    if (parts.length >= 2)
      return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
    return clean || "repo";
  })();

  async function handleAddRepo() {
    const url = repoUrl.trim();
    if (!url) return;
    if (!serverUrl) {
      setCloneError("No machine selected. Please select a machine first.");
      return;
    }
    Keyboard.dismiss();
    setIsCloning(true);
    setCloneError(null);
    await cloneRepoStore(serverUrl, url);
    const entry = getEntry(serverUrl);
    setIsCloning(false);
    if (entry?.cloneStatus.error) {
      setCloneError(entry.cloneStatus.error);
    } else {
      posthog.capture("repo_cloned", { source: "manual_url" });
      onRepoAdded?.();
      slideSuccessIn();
    }
  }

  const isGreenStep = step === "cloned";

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      enableOverDrag={false}
      animationConfigs={animationConfigs}
      backdropComponent={renderBackdrop}
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.dragHandle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      {/* Close button */}
      <TouchableOpacity
        onPress={() => { Keyboard.dismiss(); bottomSheetRef.current?.dismiss(); }}
        style={styles.closeButton}
        hitSlop={8}
      >
        <BlurView intensity={60} tint="light" style={[styles.closeX, { backgroundColor: "#F2F2F2" }]}>
          <SymbolView name="xmark" size={17} weight="semibold" tintColor="#1A1A1A" />
        </BlurView>
      </TouchableOpacity>

      <BottomSheetScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
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
              onChangeText={(t) => {
                setRepoUrl(t);
                setCloneError(null);
              }}
              placeholder="Paste link here"
              placeholderTextColor="#B0B0B0"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            {cloneError ? (
              <Text style={styles.errorText}>{cloneError}</Text>
            ) : null}

            <TouchableOpacity
              style={[
                styles.button,
                (!repoUrl.trim() || isCloning) && styles.buttonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={!repoUrl.trim() || isCloning}
              onPress={handleAddRepo}
            >
              {isCloning ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>Add repo</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheetScrollView>

      {/* ── Green success overlay ── */}
      <Animated.View
        style={[styles.successOverlay, successStyle]}
        pointerEvents={isGreenStep ? "auto" : "none"}
      >
        {step === "cloned" && (
          <View style={styles.greenContent}>
            <View style={styles.greenCenter}>
              <SuccessMark width={192} height={244} />
              <Text style={styles.greenTitle}>Repo cloned</Text>
              <View style={styles.repoPillRow}>
                <View style={styles.repoPill}>
                  <Text style={styles.repoPillText}>{repoFullName}</Text>
                </View>
                <Text style={styles.greenSubtitle}>
                  is on your machine.{"\n"}Ready when you are.
                </Text>
              </View>
            </View>
            <View style={styles.greenFooter}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => bottomSheetRef.current?.dismiss()}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Done</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addAnotherButton}
                onPress={() => {
                  successTranslateY.value = 800;
                  setStep("input");
                  setRepoUrl("");
                  setCloneError(null);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.addAnotherButtonText}>
                  Add another
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
    top: 14,
    right: 16,
    zIndex: 10,
  },
  closeX: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerText: {
    flex: 1,
    gap: 4,
    paddingRight: 52,
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
  errorText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#841E1E",
    lineHeight: 18,
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
    elevation: 0,
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#fff",
    letterSpacing: -0.5,
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
