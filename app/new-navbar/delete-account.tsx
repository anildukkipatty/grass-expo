import { BlurView } from "expo-blur";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { clearAuth, getUser } from "@/store/auth-store";
import { closeConnection, getConnectedUrls } from "@/store/connection-store";
import { clearUrls } from "@/store/url-store";
import { clearAllVmMetadata } from "@/store/vm-metadata-store";

import BackButton from "@/assets/images/new-design/chat/back-button.svg";
import RightArrow from "@/assets/images/new-design/onboarding/right-arrow-head.svg";
import ConnectionIcon from "@/assets/images/new-design/settings/connection.svg";
import DeleteIcon from "@/assets/images/new-design/settings/delete.svg";
import DeletedIcon from "@/assets/images/new-design/settings/deleted.svg";
import HistoryIcon from "@/assets/images/new-design/settings/history.svg";
import IssueIcon from "@/assets/images/new-design/settings/issue.svg";
import LaptopIcon from "@/assets/images/new-design/settings/laptop.svg";
import ProfileIcon from "@/assets/images/new-design/settings/profile.svg";

export default function DeleteAccountScreen() {
  const { top } = useSafeAreaInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [emailInput, setEmailInput] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getUser().then((u) => setUserEmail(u?.email ?? null));
  }, []);

  const emailMatches = emailInput === (userEmail ?? "");

  const handleDeleteNow = async () => {
    posthog.capture("user_deleted_account");
    posthog.reset();
    const connectedUrls = getConnectedUrls();
    connectedUrls.forEach((url) => closeConnection(url));
    await clearUrls();
    await clearAllVmMetadata();
    await clearAuth();
    setStep(4);
  };

  const handleDone = () => {
    router.dismissAll();
    router.replace("/onboarding");
  };

  return (
    <View style={[styles.screen, { paddingTop: top }]}>
      {/* ── Header ── */}
      {step !== 4 && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={step === 2 ? () => setStep(1) : () => router.back()}
            hitSlop={8}
          >
            <BackButton />
          </TouchableOpacity>
          {/* <View style={styles.headerTitleWrap} pointerEvents="none">
            <Text style={styles.headerTitle}>Delete Account</Text>
          </View> */}
        </View>
      )}

      {/* ─── Step 1: Delete info ─── */}
      {step === 1 && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <DeleteIcon width={26} height={30} />
            </View>
          </View>

          <Text style={styles.title}>Delete your account</Text>
          <Text style={styles.subtitle}>This can&#39;t be undone.</Text>

          <View style={styles.removeBox}>
            <Text style={styles.removeBoxTitle}>
              When you delete your account, we&#39;ll remove:
            </Text>
            <View style={styles.removeItemWrapper}>
              <View style={styles.removeItem}>
                <ProfileIcon width={18} height={18} />
                <Text style={styles.removeItemText}>
                  Your profile and settings
                </Text>
              </View>
              <View style={styles.removeItem}>
                <LaptopIcon width={20} height={12} />
                <Text style={styles.removeItemText}>
                  All connected machines
                </Text>
              </View>
              <View style={styles.removeItem}>
                <HistoryIcon width={18} height={17} />
                <Text style={styles.removeItemText}>
                  All session history and logs
                </Text>
              </View>
              <View style={styles.removeItem}>
                <ConnectionIcon width={18} height={18} />
                <Text style={styles.removeItemText}>
                  Your GitHub connection
                </Text>
              </View>
            </View>
            <Text style={styles.repoNote}>
              Your repos on GitHub won&#39;t be affected.{"\n"}
              We&#39;ll just lose access to them.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setStep(2)}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.outlineBtnText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ─── Step 2 + Step 3 ─── */}
      {(step === 2 || step === 3) && (
        <View style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.iconOuter, styles.iconOuterRed]}>
                <View style={styles.iconInner}>
                  <DeleteIcon width={26} height={30} />
                </View>
              </View>

              <Text style={styles.title}>Are you sure?</Text>
              <Text style={styles.subtitle}>Type your email to confirm.</Text>

              <View style={styles.emailPill}>
                <Text style={styles.emailPillText}>
                  {userEmail ?? "your@email.com"}
                </Text>
              </View>
              <Text style={styles.emailHint}>
                Enter your email exactly as shown above.
              </Text>

              <TextInput
                style={styles.emailInput}
                placeholder="Enter your email"
                placeholderTextColor="#9F9F9F"
                value={emailInput}
                onChangeText={setEmailInput}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />
            </ScrollView>

            <View style={styles.bottomActions}>
              <TouchableOpacity
                style={styles.issueCard}
                activeOpacity={0.8}
                onPress={() => router.push("/new-navbar/support")}
              >
                <View style={styles.issueIconWrap}>
                  <IssueIcon width={20} height={19} />
                </View>
                <View style={styles.issueTextWrap}>
                  <Text style={styles.issueTitleText}>Having an issue?</Text>
                  <Text style={styles.issueSubText}>
                    There might be a fix.{"\n"}Talk to a founder.
                  </Text>
                </View>
                <RightArrow width={20} height={20} />
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  emailMatches ? styles.primaryBtn : styles.deleteBtnDisabled
                }
                onPress={
                  emailMatches
                    ? () => {
                        Keyboard.dismiss();
                        setStep(3);
                      }
                    : undefined
                }
                activeOpacity={emailMatches ? 0.85 : 1}
              >
                <Text
                  style={
                    emailMatches
                      ? styles.primaryBtnText
                      : styles.deleteBtnDisabledText
                  }
                >
                  Delete account
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>

          {/* ─── Step 3: blur + last chance popup ─── */}
          {step === 3 && (
            <>
              <BlurView
                intensity={10}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, styles.popupOverlay]}>
                <View style={styles.popupCard}>
                  <Text style={styles.popupTitle}>Last chance</Text>
                  <Text style={styles.popupBody}>
                    This will permanently delete your account and all associated
                    data. You can&#39;t recover it.
                  </Text>
                  <View style={styles.popupBtns}>
                    <TouchableOpacity
                      style={styles.popupCancelBtn}
                      onPress={() => setStep(2)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.popupCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.popupDeleteBtn}
                      onPress={handleDeleteNow}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.popupDeleteText}>Delete now</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </View>
      )}

      {/* ─── Step 4: Success ─── */}
      {step === 4 && (
        <View style={[styles.successContent, { paddingTop: top + 24 }]}>
          <View style={styles.successIconOuter}>
            <View style={styles.successIconCircle}>
              <DeletedIcon width={18} height={18} />
            </View>
          </View>

          <Text style={styles.title}>Thanks for trying Grass</Text>
          <Text style={styles.subtitle}>
            Your account has been deleted. If you ever want to come back,
            we&#39;d love to have you.
          </Text>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={styles.doneBtn}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tellUsBtn}
            onPress={() =>
              router.push({
                pathname: "/new-navbar/coming-soon",
                params: { title: "Tell Us Why You Left" },
              })
            }
            activeOpacity={0.7}
          >
            <Text style={styles.tellUsBtnText}>Tell us why you left</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 50,
    zIndex: 1,
  },
  headerTitleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    paddingTop: 30,
    alignItems: "center",
  },

  iconOuter: {
    width: 77,
    height: 77,
    borderRadius: 70,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#630D0D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 100,
  },
  iconOuterRed: {
    borderWidth: 1.5,
    borderColor: "#E8A0A0",
  },
  iconInner: {
    // width: 92,
    // height: 92,
    // borderRadius: 46,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    marginTop: 30,
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    textAlign: "center",
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#808080",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.5,
    marginBottom: 20,
  },

  removeBox: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    padding: 16,
    gap: 12,
    marginBottom: 75,
  },
  removeBoxTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    marginBottom: 16,
    borderBottomColor: "#dfdfdf",
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  removeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  removeItemWrapper: {
    marginBottom: 16,
    borderBottomColor: "#dfdfdf",
    borderBottomWidth: 1,
    paddingBottom: 16,
    gap: 10,
  },
  removeItemText: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
  },
  repoNote: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
  },

  primaryBtn: {
    width: "100%",
    borderRadius: 50,
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  primaryBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },

  outlineBtn: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#3D841E",
    paddingVertical: 14,
    alignItems: "center",
  },
  outlineBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#3D841E",
    letterSpacing: -0.3,
  },

  emailPill: {
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignSelf: "center",
    marginBottom: 8,
    marginTop: 50,
  },
  emailPillText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
  },
  emailHint: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },

  emailInput: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#f2f2f2",
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontFamily: SFPro.medium,
    fontSize: 16,
    color: "#000",
    marginBottom: 0,
  },

  bottomActions: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    paddingTop: 12,
    gap: 12,
  },

  issueCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dfdfdf",
    // backgroundColor: "#E3FDD7",
    padding: 12,
    gap: 10,
  },
  issueIconWrap: {
    width: 59,
    height: 59,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#E3FDD7",
    justifyContent: "center",
    alignItems: "center",
  },
  issueTextWrap: { flex: 1 },
  issueTitleText: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
  },
  issueSubText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#606060",
    lineHeight: 22,
  },

  deleteBtnDisabled: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#9F9F9F",
    backgroundColor: "#DFDFDF",
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteBtnDisabledText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#9F9F9F",
    letterSpacing: -0.3,
  },

  popupOverlay: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popupCard: {
    width: "100%",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.80)",
    padding: 24,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  popupTitle: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.43,
  },
  popupBody: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    textAlign: "center",
    lineHeight: 22,
  },
  popupBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    width: "100%",
  },
  popupCancelBtn: {
    flex: 1,
    borderRadius: 100,
    backgroundColor: "rgba(120, 120, 128, 0.16)",
    paddingVertical: 14,
    alignItems: "center",
  },
  popupCancelText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
  },
  popupDeleteBtn: {
    flex: 1,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(120, 120, 128, 0.16)",
  },
  popupDeleteText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FF383C",
  },

  successContent: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
    // gap: 14,
  },
  successIconOuter: {
    width: 106,
    height: 106,
    borderRadius: 53,
    backgroundColor: "#FFF",
    borderWidth: 15,
    borderColor: "#C3F6AD",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "rgb(39, 99, 13)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 10,
    marginBottom: 4,
  },
  successIconCircle: {
    borderWidth: 4,
    borderColor: "rgba(39, 99, 13, 0.26)",
    width: 77,
    height: 77,
    borderRadius: 53,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  doneBtn: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  doneBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },

  tellUsBtn: {
    marginTop: 16,

    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#3D841E",
    paddingVertical: 14,
    alignItems: "center",
  },
  tellUsBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#3D841E",
    letterSpacing: -0.3,
  },
});
