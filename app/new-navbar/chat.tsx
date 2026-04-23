import AddIcon from "@/assets/images/new-design/chat/add.svg";
import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import BuildIcon from "@/assets/images/new-design/chat/build.svg";
import CameraIcon from "@/assets/images/new-design/chat/camera.svg";
import CopyIcon from "@/assets/images/new-design/chat/copy.svg";
import DiffButtonIcon from "@/assets/images/new-design/chat/diff-button.svg";
import ExplandIcon from "@/assets/images/new-design/chat/expland.svg";
import FilesIcon from "@/assets/images/new-design/chat/files.svg";
import PhotosIcon from "@/assets/images/new-design/chat/photos.svg";
import ReloadIcon from "@/assets/images/new-design/chat/reload.svg";
import SearchIcon from "@/assets/images/new-design/chat/search-icon.svg";
import SelectedIcon from "@/assets/images/new-design/chat/selected.svg";
import ShareIcon from "@/assets/images/new-design/chat/share.svg";
import WriteIcon from "@/assets/images/new-design/chat/write.svg";
import DownArrowIcon from "@/assets/images/new-design/down-arrow.svg";
import ApproveIcon from "@/assets/images/new-design/navbar/approve-icon.svg";
import DenyIcon from "@/assets/images/new-design/navbar/deny-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import UpArrowIcon from "@/assets/images/new-design/up-arrow.svg";
import { SFMono, SFPro } from "@/constants/theme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS = [
  {
    key: "claude-opus-4-7",
    label: "Claude Opus 4.6",
    subtitle: "Most capable",
  },
  {
    key: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    subtitle: "Fast, Capable",
  },
  {
    key: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    subtitle: "Fastest response",
  },
];

function getShortTitle(text: string): string {
  const cleaned = (text || "").replace(/\n/g, " ").trim();
  const first = cleaned.split(/[.!?]/)[0].trim();
  if (first.length <= 36) return first;
  return cleaned.substring(0, 33) + "...";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UserBubble({ text }: { text: string }) {
  return (
    <View style={styles.userBubble}>
      <Text style={styles.userText}>{text}</Text>
    </View>
  );
}

function ReadingPill({ path }: { path: string }) {
  return (
    <View style={styles.actionPill}>
      <SearchIcon width={14} height={14} />
      <Text style={styles.actionPillText}>Reading {path}</Text>
    </View>
  );
}

function WritingPill({ path }: { path: string }) {
  return (
    <View style={styles.actionPill}>
      <WriteIcon width={14} height={14} />
      <Text style={styles.actionPillText}>Writing {path}</Text>
    </View>
  );
}

function AgentResponse() {
  return (
    <View style={styles.agentBlock}>
      <Text style={styles.agentText}>
        {
          "I've analyzed the current auth setup. JWT validation is duplicated across 4 route files.\nHere's my plan:"
        }
      </Text>
      <View style={styles.listRow}>
        <Text style={styles.agentText}>{"1. Create "}</Text>
        <View style={styles.inlineCodeBox}>
          <Text style={styles.inlineCodeText}>src/utils/jwt.ts</Text>
        </View>
        <Text style={styles.agentText}>{" with shared validation"}</Text>
      </View>
      <Text style={styles.agentText}>
        {"2. Update the middleware to use the new utility"}
      </Text>
      <Text style={styles.agentText}>{"3. Update all route handlers"}</Text>
      <Text style={styles.agentText}>{"4. Add unit tests"}</Text>
      <Text style={[styles.agentText, { marginTop: 10 }]}>
        {"Starting with the utility file:"}
      </Text>
    </View>
  );
}

function AgentCodeBlock() {
  const code = `export function validateToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, SECRET);
  return { userId: decoded.s, role: decoded.role };
}`;
  return (
    <View style={styles.codeBlock}>
      <Text style={styles.codeText}>{code}</Text>
    </View>
  );
}

function PermCard({
  permType,
  command,
  onApprove,
  onDeny,
}: {
  permType: string;
  command: string;
  onApprove: () => void;
  onDeny: () => void;
}) {
  return (
    <View style={styles.permCard}>
      <View style={styles.permTopRow}>
        <View style={styles.permBadge}>
          <Text style={styles.permBadgeText}>{permType}</Text>
        </View>
        <Text style={styles.permRequiredText}>Permission required</Text>
        <View style={{ flex: 1 }} />
        <ExplandIcon width={18} height={18} />
      </View>
      <View style={styles.permCommandRow}>
        <View style={styles.permIconBox}>
          <Text style={styles.permCodeIconText}>{`</>`}</Text>
        </View>
        <View style={styles.permCommandTextBox}>
          <Text style={styles.permCommandText} numberOfLines={1}>
            {command}
          </Text>
        </View>
      </View>
      <View style={styles.permActionRow}>
        <TouchableOpacity
          style={styles.denyBtn}
          onPress={onDeny}
          activeOpacity={0.8}
        >
          <DenyIcon width={16} height={16} />
          <Text style={styles.actionBtnText}>Deny</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveBtn}
          onPress={onApprove}
          activeOpacity={0.8}
        >
          <ApproveIcon width={16} height={16} />
          <Text style={styles.actionBtnText}>Approve</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ChatActions() {
  return (
    <View style={styles.chatActionsRow}>
      <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <ShareIcon width={16} height={16} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <CopyIcon width={16} height={16} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.chatActionBtn} activeOpacity={0.7}>
        <ReloadIcon width={16} height={16} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const router = useRouter();
  const {
    task = "",
    repoName = "grass-welcome",
    branchName = "main",
  } = useLocalSearchParams<{
    task: string;
    repoName: string;
    branchName: string;
  }>();

  const [inputText, setInputText] = useState("");
  const [perm1Dismissed, setPerm1Dismissed] = useState(false);
  const [perm2Dismissed, setPerm2Dismissed] = useState(false);
  const [perm3Dismissed, setPerm3Dismissed] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedModelKey, setSelectedModelKey] = useState("claude-opus-4-7");
  const [tempModelKey, setTempModelKey] = useState("claude-opus-4-7");
  const [addBtnMeasure, setAddBtnMeasure] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [inputContainerHeight, setInputContainerHeight] = useState(0);

  const modelSheetRef = useRef<BottomSheetModal>(null);
  const addBtnRef = useRef<TouchableOpacity>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const taskStr = Array.isArray(task) ? task[0] : task;
  const repoStr = Array.isArray(repoName) ? repoName[0] : repoName;
  const branchStr = Array.isArray(branchName) ? branchName[0] : branchName;
  const shortTitle = getShortTitle(taskStr);

  const selectedModel =
    MODELS.find((m) => m.key === selectedModelKey) ?? MODELS[0];

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    Keyboard.dismiss();
    setInputText("");
  };

  const openModelSheet = () => {
    setTempModelKey(selectedModelKey);
    Keyboard.dismiss();
    modelSheetRef.current?.present();
  };

  const confirmModel = () => {
    setSelectedModelKey(tempModelKey);
    modelSheetRef.current?.dismiss();
  };

  const renderModelBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  const openDiffs = () => {
    Keyboard.dismiss();
    router.push({
      pathname: "/new-navbar/diffs" as any,
      params: { repoName: repoStr, branchName: branchStr },
    });
  };

  const openOptions = () => {
    Keyboard.dismiss();
    setTimeout(() => {
      addBtnRef.current?.measureInWindow((x, y, w, h) => {
        setAddBtnMeasure({ x, y, w, h });
        setShowOptions(true);
      });
    }, 50);
  };

  const closeOptions = () => {
    setShowOptions(false);
    setAddBtnMeasure(null);
  };

  const handleCameraPress = async () => {
    closeOptions();
    if (cameraPermission?.granted) {
      Alert.alert("Camera", "Camera will open here.");
      return;
    }
    const result = await requestCameraPermission();
    if (result.granted) {
      Alert.alert("Camera", "Camera will open here.");
    } else if (!result.canAskAgain) {
      Alert.alert(
        "Camera Permission Required",
        "Please enable camera access in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: () => Linking.openURL("app-settings:"),
          },
        ],
      );
    }
  };

  const handlePhotosPress = () => {
    closeOptions();
    Alert.alert("Photos", "Photo library will open here.");
  };

  const handleFilesPress = () => {
    closeOptions();
    Alert.alert("Files", "File picker will open here.");
  };

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => router.push("/new-navbar/chat-list" as any)}
        >
          <BackButtonIcon width={40} height={40} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.repoName} numberOfLines={1}>
            {shortTitle || "New Chat"}
          </Text>
          <View style={styles.branchRow}>
            <Text style={styles.branchName}>
              {repoStr} ·
              <GitBranchIcon width={14} height={14} /> {branchStr}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={openDiffs}
        >
          <DiffButtonIcon width={20} height={20} />
        </TouchableOpacity>
      </View>

      {/* ── Messages + Input ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Chat area */}
        <View style={styles.chatArea}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!!taskStr && <UserBubble text={taskStr} />}
            <ReadingPill path="src/routes/api.ts" />
            <ReadingPill path="src/middleware/auth.ts" />
            <AgentResponse />
            <AgentCodeBlock />
            <WritingPill path="src/routes/api.ts" />
            <View style={styles.agentBlock}>
              <Text style={styles.agentText}>
                {
                  "Created the shared utility. Now I need to update the middleware file — this will modify existing auth logic."
                }
              </Text>
            </View>
            {!perm1Dismissed && (
              <PermCard
                permType="BASH"
                command="npm run test -- --coverage"
                onApprove={() => setPerm1Dismissed(true)}
                onDeny={() => setPerm1Dismissed(true)}
              />
            )}
            {!perm2Dismissed && (
              <PermCard
                permType="WRITE FILE"
                command="src/utils/jwt.ts"
                onApprove={() => setPerm2Dismissed(true)}
                onDeny={() => setPerm2Dismissed(true)}
              />
            )}
            {!perm3Dismissed && (
              <PermCard
                permType="READ FILE"
                command="src/middleware/auth.ts"
                onApprove={() => setPerm3Dismissed(true)}
                onDeny={() => setPerm3Dismissed(true)}
              />
            )}
            <ChatActions />
          </ScrollView>
        </View>

        {/* ── Bottom input area ── */}
        <View
          style={[styles.inputContainer, { paddingBottom: bottom + 8 }]}
          onLayout={(e) => setInputContainerHeight(e.nativeEvent.layout.height)}
        >
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type here"
            placeholderTextColor="#000"
            multiline
          />
          <View style={styles.toolbarRow}>
            <TouchableOpacity
              ref={addBtnRef}
              style={styles.addBtn}
              activeOpacity={0.7}
              onPress={openOptions}
            >
              <AddIcon width={18} height={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modelDropdown}
              activeOpacity={0.7}
              onPress={openModelSheet}
            >
              <Text style={styles.dropdownText}>{selectedModel.label}</Text>
              <DownArrowIcon width={14} height={14} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.buildBtn} activeOpacity={0.7}>
              <Text style={styles.buildText}>Build</Text>
              <BuildIcon width={16} height={16} />
            </TouchableOpacity>

            <View style={styles.toolbarSpacer} />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                !inputText.trim() && styles.submitBtnDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleSubmit}
              disabled={!inputText.trim()}
            >
              <UpArrowIcon width={20} height={20} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ── Full-screen blur overlay when add options are open ── */}
      {showOptions && addBtnMeasure && (
        <>
          <BlurView
            style={StyleSheet.absoluteFill}
            intensity={10}
            tint="light"
            pointerEvents="none"
          />
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeOptions}
          />
          <View
            style={[
              styles.optionsPanel,
              {
                position: "absolute",
                left: 16,
                bottom: inputContainerHeight + 12,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleCameraPress}
            >
              <View style={styles.optionIconBg}>
                <CameraIcon width={22} height={22} />
              </View>
              <Text style={styles.optionLabel}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handlePhotosPress}
            >
              <View style={styles.optionIconBg}>
                <PhotosIcon width={22} height={22} />
              </View>
              <Text style={styles.optionLabel}>Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleFilesPress}
            >
              <View style={styles.optionIconBg}>
                <FilesIcon width={22} height={22} />
              </View>
              <Text style={styles.optionLabel}>Files</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.addBtn,
              {
                position: "absolute",
                left: addBtnMeasure.x,
                top: addBtnMeasure.y,
              },
            ]}
            activeOpacity={0.7}
            onPress={closeOptions}
          >
            <CloseIcon width={36} height={36} />
          </TouchableOpacity>
        </>
      )}

      {/* ── Model picker bottom sheet ── */}
      <BottomSheetModal
        ref={modelSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderModelBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={() => (
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetDragger} />
          </View>
        )}
      >
        <BottomSheetView>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Select model</Text>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              activeOpacity={0.7}
              onPress={() => modelSheetRef.current?.dismiss()}
            >
              <CloseIcon width={36} height={36} />
            </TouchableOpacity>
          </View>

          <View style={styles.sheetModelList}>
            {MODELS.map((m, index) => (
              <TouchableOpacity
                key={m.key}
                style={[
                  styles.modelRow,
                  tempModelKey === m.key && styles.modelRowSelected,
                  index < MODELS.length - 1 && styles.modelRowSeparator,
                ]}
                activeOpacity={0.7}
                onPress={() => setTempModelKey(m.key)}
              >
                <View style={styles.modelInfo}>
                  <Text style={styles.modelLabel}>{m.label}</Text>
                  <Text style={styles.modelSubtitle}>{m.subtitle}</Text>
                </View>
                {tempModelKey === m.key && (
                  <SelectedIcon width={16} height={16} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.confirmBtn}
              activeOpacity={0.85}
              onPress={confirmModel}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    marginRight: 25,
    marginLeft: 25,
    flex: 1,
    alignItems: "center",
    gap: 5,
  },
  repoName: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  branchName: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.3,
    lineHeight: 18,
  },

  // Chat area
  chatArea: {
    flex: 1,
    position: "relative",
  },

  // Messages — 15 px gap between every section
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 15,
  },

  // User bubble
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "85%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 5,
    borderBottomLeftRadius: 20,
    borderWidth: 1,
    borderColor: "#8CBB67",
    backgroundColor: "#DCF8C6",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userText: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },

  // Reading / Writing pills (shared style)
  actionPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 17,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionPillText: {
    fontFamily: SFMono.semiBold,
    fontSize: 15,
    color: "#929292",
  },

  // Agent text block
  agentBlock: {
    alignSelf: "stretch",
    gap: 4,
  },
  agentText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  listRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },

  // Inline code
  inlineCodeBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  inlineCodeText: {
    fontFamily: SFMono.semiBold,
    fontSize: 15,
    color: "#808080",
  },

  // Code block
  codeBlock: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    padding: 14,
  },
  codeText: {
    fontFamily: SFMono.semiBold,
    fontSize: 15,
    color: "#404040",
    lineHeight: 25,
  },

  // Permission card
  permCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  permTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  permBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#B20000",
    backgroundColor: "#FFCCCC",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  permBadgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: "#B20000",
    letterSpacing: 0.5,
  },
  permRequiredText: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
  },
  permCommandRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  permIconBox: {
    width: 40,
    height: 40,
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
    backgroundColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
  },
  permCodeIconText: {
    fontFamily: SFMono.semiBold,
    fontSize: 13,
    color: "#404040",
  },
  permCommandTextBox: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
    height: 40,
  },
  permCommandText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#333",
    letterSpacing: -0.2,
  },
  permActionRow: { flexDirection: "row", gap: 10 },
  denyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#841E1E",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#3D841E",
  },
  actionBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
  },

  // Chat action icons (share / copy / reload)
  chatActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  chatActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 18,
    // borderWidth: 1,
    // borderColor: "#DFDFDF",
    // backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  // Options popup
  optionsPanel: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFF",
    backgroundColor: "rgba(0, 0, 0, 0.08)",
    overflow: "hidden",
    width: 150,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  optionIconBg: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  optionSeparator: {
    // height: 1,
    // backgroundColor: "rgba(255, 255, 255, 0.40)",
    marginHorizontal: 16,
  },

  // Bottom input container
  inputContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(249, 249, 249, 0.20)",
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 10,
  },
  textInput: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#1A1A1A",
    padding: 0,
    maxHeight: 100,
    minHeight: 24,
  },
  toolbarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarSpacer: { flex: 1 },
  addBtn: {
    width: 36,
    height: 36,
    // backgroundColor: "#F2F2F2",
    borderRadius: 20,
    borderColor: "#FFF",
    backgroundColor: "rgba(0, 0, 0, 0.00)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIconText: {
    fontFamily: SFPro.medium,
    fontSize: 16,
    color: "#1A1A1A",
    lineHeight: 18,
  },
  modelDropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.50)",
  },
  dropdownText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  buildBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "rgba(255, 255, 255, 0.50)",
  },
  buildText: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  submitBtn: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },

  // Model bottom sheet
  sheetBackground: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHandleContainer: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 8,
  },
  sheetDragger: {
    width: 63,
    height: 8,
    borderRadius: 70,
    backgroundColor: "#E0E0E0",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 25,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2F2F2",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetModelList: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFF",
  },
  modelRowSelected: {
    backgroundColor: "#F2F2F2",
  },
  modelRowSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
  },
  modelInfo: {
    flex: 1,
    gap: 2,
  },
  modelLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  modelSubtitle: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "rgba(0,0,0,0.5)",
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  sheetFooter: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  confirmBtn: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },
});
