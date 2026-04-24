import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import ExpandIcon from "@/assets/images/new-design/chat/expland.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import { SFMono, SFPro } from "@/constants/theme";
import { getEntry, openConnection } from "@/store/connection-store";
import { fetch } from "expo/fetch";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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

// ─── V1 diff parsing ──────────────────────────────────────────────────────────

type RawFileDiff = {
  filename: string;
  lines: string[];
  status: "modified" | "new" | "deleted" | "renamed";
  renamedFrom?: string;
  additions: number;
  deletions: number;
};

function parseFileDiffs(text: string): RawFileDiff[] {
  const lines = text.split("\n");
  const files: RawFileDiff[] = [];
  let current: RawFileDiff | null = null;

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/.+ b\/(.+)$/);
      current = { filename: match?.[1] ?? "unknown", lines: [], status: "modified", additions: 0, deletions: 0 };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("new file mode")) { current.status = "new"; continue; }
    if (line.startsWith("deleted file mode")) { current.status = "deleted"; continue; }
    if (line.startsWith("rename from ")) { current.status = "renamed"; current.renamedFrom = line.slice(12); continue; }
    if (line.startsWith("rename to ")) continue;
    if (line.startsWith("--- ") || line.startsWith("+++ ")) continue;
    if (line.startsWith("index ") || line.startsWith("similarity index")) continue;
    if (line.startsWith("+")) current.additions++;
    else if (line.startsWith("-")) current.deletions++;
    current.lines.push(line);
  }

  if (files.length === 0 && text.trim()) {
    files.push({ filename: "diff", lines, status: "modified", additions: 0, deletions: 0 });
  }
  return files;
}

type LineInfo = { text: string; oldNum: string; newNum: string; kind: "add" | "del" | "hunk" | "ctx" };

function buildLineInfos(rawLines: string[]): LineInfo[] {
  const result: LineInfo[] = [];
  let oldLine = 0;
  let newLine = 0;
  for (const line of rawLines) {
    if (line.startsWith("@@")) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) { oldLine = parseInt(m[1], 10); newLine = parseInt(m[2], 10); }
      result.push({ text: line, oldNum: "", newNum: "", kind: "hunk" });
    } else if (line.startsWith("+")) {
      result.push({ text: line, oldNum: "", newNum: String(newLine), kind: "add" });
      newLine++;
    } else if (line.startsWith("-")) {
      result.push({ text: line, oldNum: String(oldLine), newNum: "", kind: "del" });
      oldLine++;
    } else {
      result.push({ text: line, oldNum: String(oldLine), newNum: String(newLine), kind: "ctx" });
      oldLine++;
      newLine++;
    }
  }
  return result;
}

const STATUS_TO_CHANGE_TYPE: Record<string, ChangeType> = {
  modified: "M",
  new: "A",
  deleted: "D",
  renamed: "R",
};

function convertToFileDiffs(rawFiles: RawFileDiff[]): FileDiff[] {
  return rawFiles.map((raw, i) => {
    const changeType = STATUS_TO_CHANGE_TYPE[raw.status] ?? "M";
    const path = raw.renamedFrom ? `${raw.renamedFrom} → ${raw.filename}` : raw.filename;
    const lineInfos = buildLineInfos(raw.lines);
    const allLines: DiffLine[] = lineInfos.map((info) => ({
      type: info.kind === "add" ? "added" : info.kind === "del" ? "deleted" : "context",
      lineNum: parseInt(info.newNum || info.oldNum || "0", 10) || 0,
      content: info.text,
    }));
    const preview = allLines.filter((l) => l.type !== "context").slice(0, 4);
    return {
      id: String(i),
      changeType,
      path,
      additions: raw.additions,
      deletions: raw.deletions,
      lines: preview.length > 0 ? preview : allLines.slice(0, 4),
      allLines,
    };
  });
}

// ─── Badge config ─────────────────────────────────────────────────────────────

const BADGE_CONFIG: Record<ChangeType, { bg: string }> = {
  A: { bg: "#22C55E" },
  M: { bg: "#F59E0B" },
  D: { bg: "#EF4444" },
  R: { bg: "#3B82F6" },
  C: { bg: "#8B5CF6" },
};

// ─── Sub-components (V2 visual design — do not change styles) ─────────────────

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
      <Text style={styles.diffLineNum}>{line.lineNum || ""}</Text>
      <Text style={styles.diffLineContent} numberOfLines={showFullBg ? undefined : 1}>
        {line.content}
      </Text>
    </View>
  );
}

function DiffFileCard({ diff, onExpand }: { diff: FileDiff; onExpand: (diff: FileDiff) => void }) {
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
        {diff.lines.map((line, idx) => (
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
    serverUrl = "",
    repoPath = "",
    repoName = "",
    branchName = "",
  } = useLocalSearchParams<{ serverUrl?: string; repoPath?: string; repoName?: string; branchName?: string }>();

  const serverUrlStr = Array.isArray(serverUrl) ? serverUrl[0] : serverUrl;
  const repoPathStr = Array.isArray(repoPath) ? repoPath[0] : repoPath;
  const repoStrRaw = Array.isArray(repoName) ? repoName[0] : (repoName || repoPathStr);
  const repoStr = repoStrRaw.split("/").filter(Boolean).pop() ?? repoStrRaw;
  const branchStr = Array.isArray(branchName) ? branchName[0] : branchName;

  const [diffsText, setDiffsText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!serverUrlStr) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setDiffsText(null);

    const run = async () => {
      // Ensure connection entry exists so getEntry has a baseUrl
      openConnection(serverUrlStr);
      const entry = getEntry(serverUrlStr);
      const baseUrl = entry?.baseUrl ?? serverUrlStr;
      try {
        const qs = repoPathStr ? `?repoPath=${encodeURIComponent(repoPathStr)}` : "";
        const res = await fetch(`${baseUrl}/diffs${qs}`);
        const json = await res.json() as { diff?: string };
        if (!cancelled) {
          setDiffsText(json.diff ?? "");
          setLoading(false);
        }
      } catch (err) {
        console.error("[diffs] fetch failed:", err);
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [serverUrlStr, repoPathStr]);

  const files = useMemo(
    () => (diffsText ? convertToFileDiffs(parseFileDiffs(diffsText)) : []),
    [diffsText],
  );

  const totals = useMemo(
    () => files.reduce((acc, f) => ({ adds: acc.adds + f.additions, dels: acc.dels + f.deletions }), { adds: 0, dels: 0 }),
    [files],
  );

  const expandSheetRef = useRef<BottomSheetModal>(null);
  const [expandedDiff, setExpandedDiff] = useState<FileDiff | null>(null);

  const handleExpandDiff = (diff: FileDiff) => {
    setExpandedDiff(diff);
    expandSheetRef.current?.present();
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
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
            <Text style={styles.branchName}>
              {repoStr}{branchStr ? ` · ${branchStr}` : ""}
            </Text>
          </View>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#808080" style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>Loading diffs…</Text>
        </View>
      ) : !serverUrlStr || files.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {!serverUrlStr ? "No server URL provided" : "No diffs available"}
          </Text>
        </View>
      ) : (
        <>
          {/* ── Summary ── */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryTitle}>
              {files.length} file{files.length !== 1 ? "s" : ""} changed (+{totals.adds} -{totals.dels})
            </Text>
            <Text style={styles.summarySubtitle}>
              <Text style={[styles.summarySubtitle, styles.additionsText]}>
                {totals.adds} additions
              </Text>
              {" and "}
              <Text style={[styles.summarySubtitle, styles.deletionsText]}>
                {totals.dels} deletions
              </Text>
            </Text>
          </View>

          {/* ── File list ── */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {files.map((diff) => (
              <DiffFileCard key={diff.id} diff={diff} onExpand={handleExpandDiff} />
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Expand diff sheet ── */}
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

// ─── Styles (V2 visual design — do not change) ───────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
  },

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
