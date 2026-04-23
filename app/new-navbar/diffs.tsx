import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import ExpandIcon from "@/assets/images/new-design/chat/expland.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import { SFMono, SFPro } from "@/constants/theme";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChangeType = "A" | "M" | "D" | "R" | "C";
type DiffLineType = "added" | "deleted" | "context";

type DiffLine = { lineNum: number; type: DiffLineType; content: string };
type FileDiff = {
  id: string;
  changeType: ChangeType;
  path: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
  allLines: DiffLine[];
};

const BADGE_CONFIG: Record<ChangeType, { bg: string }> = {
  A: { bg: "#22C55E" },
  M: { bg: "#F59E0B" },
  D: { bg: "#EF4444" },
  R: { bg: "#3B82F6" },
  C: { bg: "#8B5CF6" },
};

const contextLines = (from: number, to: number): DiffLine[] =>
  Array.from({ length: to - from + 1 }, (_, i) => ({
    lineNum: from + i,
    type: "context" as DiffLineType,
    content: "",
  }));

const MOCK_DIFFS: FileDiff[] = [
  {
    id: "1",
    changeType: "A",
    path: "src/utils/jwt.ts",
    additions: 15,
    deletions: 0,
    lines: [
      { lineNum: 1, type: "added", content: "+ import jwt from 'jsonwebtoken';" },
      { lineNum: 2, type: "added", content: "+ interface TokenPayload {" },
      { lineNum: 3, type: "added", content: "+   userId: string;" },
      { lineNum: 4, type: "added", content: "+   role: string;" },
    ],
    allLines: [
      { lineNum: 1, type: "added", content: "+ import jwt from 'jsonwebtoken';" },
      { lineNum: 2, type: "added", content: "+ interface TokenPayload {" },
      { lineNum: 3, type: "added", content: "+   userId: string;" },
      { lineNum: 4, type: "added", content: "+   role: string;" },
      { lineNum: 5, type: "added", content: "+ }" },
      { lineNum: 6, type: "added", content: "+" },
      { lineNum: 7, type: "added", content: "+ const SECRET = process.env.JWT_SECRET!;" },
      { lineNum: 8, type: "added", content: "+" },
      { lineNum: 9, type: "added", content: "+ export function validateToken(" },
      { lineNum: 10, type: "added", content: "+   token: string" },
      { lineNum: 11, type: "added", content: "+ ): TokenPayload {" },
      { lineNum: 12, type: "added", content: "+   const decoded = jwt.verify(token, SECRET);" },
      { lineNum: 13, type: "added", content: "+   return {" },
      { lineNum: 14, type: "added", content: "+     userId: (decoded as any).sub," },
      { lineNum: 15, type: "added", content: "+     role: (decoded as any).role," },
      ...contextLines(16, 25),
    ],
  },
  {
    id: "2",
    changeType: "M",
    path: "src/middleware/auth.ts",
    additions: 2,
    deletions: 2,
    lines: [
      { lineNum: 3, type: "deleted", content: "- import jwt from 'jsonwebtoken';" },
      { lineNum: 3, type: "added", content: "+ import { validateToken } from '../utils/jwt';" },
      { lineNum: 7, type: "deleted", content: "- const decoded = jwt.verify(token, SECRE..." },
      { lineNum: 7, type: "added", content: "+ const payload = validateToken(token);" },
    ],
    allLines: [
      { lineNum: 1, type: "context", content: "  import express from 'express';" },
      { lineNum: 2, type: "context", content: "  import { Request, Response, Next } from 'express';" },
      { lineNum: 3, type: "deleted", content: "- import jwt from 'jsonwebtoken';" },
      { lineNum: 3, type: "added", content: "+ import { validateToken } from '../utils/jwt';" },
      { lineNum: 4, type: "context", content: "" },
      { lineNum: 5, type: "context", content: "  export function authMiddleware(" },
      { lineNum: 6, type: "context", content: "    req: Request, res: Response, next: Next" },
      { lineNum: 7, type: "deleted", content: "- const decoded = jwt.verify(token, SECRET);" },
      { lineNum: 7, type: "added", content: "+ const payload = validateToken(token);" },
      { lineNum: 8, type: "context", content: "    next();" },
      { lineNum: 9, type: "context", content: "  }" },
      ...contextLines(10, 20),
    ],
  },
  {
    id: "3",
    changeType: "D",
    path: "src/helpers/tokenHelper.ts",
    additions: 0,
    deletions: 5,
    lines: [
      { lineNum: 1, type: "deleted", content: "- import jwt from 'jsonwebtoken';" },
      { lineNum: 2, type: "deleted", content: "-" },
      { lineNum: 3, type: "deleted", content: "- export function decodeToken(token: string) {" },
      { lineNum: 4, type: "deleted", content: "-   return jwt.decode(token);" },
    ],
    allLines: [
      { lineNum: 1, type: "deleted", content: "- import jwt from 'jsonwebtoken';" },
      { lineNum: 2, type: "deleted", content: "-" },
      { lineNum: 3, type: "deleted", content: "- export function decodeToken(token: string) {" },
      { lineNum: 4, type: "deleted", content: "-   return jwt.decode(token);" },
      { lineNum: 5, type: "deleted", content: "- }" },
    ],
  },
  {
    id: "4",
    changeType: "R",
    path: "src/routes/auth.ts → src/routes/authRouter.ts",
    additions: 1,
    deletions: 1,
    lines: [
      { lineNum: 2, type: "deleted", content: "- const router = require('./oldRouter');" },
      { lineNum: 2, type: "added", content: "+ const router = require('./authRouter');" },
    ],
    allLines: [
      { lineNum: 1, type: "context", content: "  import express from 'express';" },
      { lineNum: 2, type: "deleted", content: "- const router = require('./oldRouter');" },
      { lineNum: 2, type: "added", content: "+ const router = require('./authRouter');" },
      { lineNum: 3, type: "context", content: "  router.use('/login', loginHandler);" },
      { lineNum: 4, type: "context", content: "  module.exports = router;" },
    ],
  },
];

const DIFF_TOTALS = MOCK_DIFFS.reduce(
  (acc, d) => ({ adds: acc.adds + d.additions, dels: acc.dels + d.deletions }),
  { adds: 0, dels: 0 },
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function DiffTypeBadge({ type }: { type: ChangeType }) {
  const { bg } = BADGE_CONFIG[type];
  return (
    <View style={[styles.diffBadge, { backgroundColor: bg }]}>
      <Text style={styles.diffBadgeText}>{type}</Text>
    </View>
  );
}

function DiffLineRow({ line, showFullBg }: { line: DiffLine; showFullBg?: boolean }) {
  const bg =
    line.type === "added" ? "#E3FDD7" : line.type === "deleted" ? "#FFEFEF" : "#FFF";
  return (
    <View style={[styles.diffLineRow, { backgroundColor: bg }]}>
      <Text style={styles.diffLineNum}>{line.lineNum}</Text>
      <Text style={styles.diffLineContent} numberOfLines={showFullBg ? undefined : 1}>
        {line.content}
      </Text>
    </View>
  );
}

function DiffFileCard({
  diff,
  onExpand,
}: {
  diff: FileDiff;
  onExpand: (diff: FileDiff) => void;
}) {
  return (
    <View style={styles.diffCard}>
      <View style={styles.diffCardHeader}>
        <DiffTypeBadge type={diff.changeType} />
        <Text style={styles.diffFilePath} numberOfLines={1} ellipsizeMode="middle">
          {diff.path}
        </Text>
        <TouchableOpacity
          style={styles.diffExpandBtn}
          onPress={() => onExpand(diff)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ExpandIcon width={18} height={18} />
        </TouchableOpacity>
      </View>
      <View style={styles.diffLinesWrapper}>
        {diff.lines.slice(0, 4).map((line, idx) => (
          <DiffLineRow key={idx} line={line} />
        ))}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DiffsScreen() {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const {
    repoName = "grass-welcome",
    branchName = "main",
  } = useLocalSearchParams<{ repoName: string; branchName: string }>();

  const repoStr = Array.isArray(repoName) ? repoName[0] : repoName;
  const branchStr = Array.isArray(branchName) ? branchName[0] : branchName;

  const expandSheetRef = useRef<BottomSheetModal>(null);
  const [expandedDiff, setExpandedDiff] = useState<FileDiff | null>(null);

  const handleExpandDiff = (diff: FileDiff) => {
    setExpandedDiff(diff);
    expandSheetRef.current?.present();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    [],
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <BackButtonIcon width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Diffs</Text>
          <View style={styles.branchRow}>
            <GitBranchIcon width={12} height={12} />
            <Text style={styles.branchName}>{repoStr} · {branchStr}</Text>
          </View>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* ── Summary ── */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>
          {MOCK_DIFFS.length} files changed (+{DIFF_TOTALS.adds} -{DIFF_TOTALS.dels})
        </Text>
        <Text style={styles.summarySubtitle}>
          <Text style={[styles.summarySubtitle, styles.additionsText]}>
            {DIFF_TOTALS.adds} additions
          </Text>
          {" and "}
          <Text style={[styles.summarySubtitle, styles.deletionsText]}>
            {DIFF_TOTALS.dels} deletions
          </Text>
        </Text>
      </View>

      {/* ── File list ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {MOCK_DIFFS.map((diff) => (
          <DiffFileCard key={diff.id} diff={diff} onExpand={handleExpandDiff} />
        ))}
      </ScrollView>

      {/* ── Expand diff slider ── */}
      <BottomSheetModal
        ref={expandSheetRef}
        snapPoints={["92%"]}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleComponent={() => (
          <View style={styles.sheetHandleContainer}>
            <View style={styles.sheetDragger} />
          </View>
        )}
      >
        {expandedDiff && (
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Diff</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                activeOpacity={0.7}
                onPress={() => expandSheetRef.current?.dismiss()}
              >
                <Text style={styles.sheetCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.expandedFileHeader}>
              <DiffTypeBadge type={expandedDiff.changeType} />
              <Text style={styles.diffFilePath} numberOfLines={1} ellipsizeMode="middle">
                {expandedDiff.path}
              </Text>
            </View>
            <BottomSheetScrollView>
              {expandedDiff.allLines.map((line, idx) => (
                <DiffLineRow key={idx} line={line} showFullBg />
              ))}
            </BottomSheetScrollView>
          </>
        )}
      </BottomSheetModal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  headerTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  branchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  branchName: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
    letterSpacing: -0.2,
  },

  summaryBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    gap: 2,
  },
  summaryTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  summarySubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
  },
  additionsText: {
    fontFamily: SFPro.semiBold,
    color: "#22C55E",
  },
  deletionsText: {
    fontFamily: SFPro.semiBold,
    color: "#EF4444",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    gap: 12,
  },

  diffCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  diffCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  diffBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  diffBadgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: "#FFF",
    letterSpacing: 0.2,
  },
  diffFilePath: {
    flex: 1,
    fontFamily: SFMono.regular,
    fontSize: 13,
    color: "#1A1A1A",
    letterSpacing: -0.2,
  },
  diffExpandBtn: {
    padding: 2,
  },
  diffLinesWrapper: {
    borderTopWidth: 1,
    borderTopColor: "#DFDFDF",
  },
  diffLineRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
    paddingVertical: 2,
  },
  diffLineNum: {
    width: 36,
    fontFamily: SFMono.regular,
    fontSize: 12,
    color: "#A0A0A0",
    textAlign: "right",
    paddingRight: 10,
    paddingLeft: 6,
    flexShrink: 0,
  },
  diffLineContent: {
    flex: 1,
    fontFamily: SFMono.regular,
    fontSize: 12,
    color: "#1A1A1A",
    paddingRight: 12,
    lineHeight: 18,
  },

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
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.4,
  },
  sheetCloseBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCloseText: {
    fontFamily: SFPro.medium,
    fontSize: 18,
    color: "#808080",
  },
  expandedFileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    backgroundColor: "#FFF",
  },
});
