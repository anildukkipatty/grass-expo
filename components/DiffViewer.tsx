import BackButtonIcon from "@/assets/images/new-design/chat/back-button.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import { SFMono, SFPro } from "@/constants/theme";
import {
  getDiffsStore,
  getEntry,
  subscribeToConnection,
} from "@/store/connection-store";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type FileDiff = {
  filename: string;
  lines: string[];
  status: "modified" | "new" | "deleted" | "renamed";
  renamedFrom?: string;
  additions: number;
  deletions: number;
};

function parseFileDiffs(text: string): FileDiff[] {
  const lines = text.split("\n");
  const files: FileDiff[] = [];
  let current: FileDiff | null = null;

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/.+ b\/(.+)$/);
      current = {
        filename: match?.[1] ?? "unknown",
        lines: [],
        status: "modified",
        additions: 0,
        deletions: 0,
      };
      files.push(current);
      continue;
    }
    if (!current) continue;
    if (line.startsWith("new file mode")) {
      current.status = "new";
      continue;
    }
    if (line.startsWith("deleted file mode")) {
      current.status = "deleted";
      continue;
    }
    if (line.startsWith("rename from ")) {
      current.status = "renamed";
      current.renamedFrom = line.slice(12);
      continue;
    }
    if (line.startsWith("rename to ")) continue;
    if (line.startsWith("--- ") || line.startsWith("+++ ")) continue;
    if (line.startsWith("index ") || line.startsWith("similarity index"))
      continue;
    if (line.startsWith("+")) current.additions++;
    else if (line.startsWith("-")) current.deletions++;
    current.lines.push(line);
  }

  if (files.length === 0 && text.trim()) {
    files.push({
      filename: "diff",
      lines,
      status: "modified",
      additions: 0,
      deletions: 0,
    });
  }

  return files;
}

type LineInfo = {
  text: string;
  oldNum: string;
  newNum: string;
  kind: "add" | "del" | "hunk" | "ctx";
};

function buildLines(rawLines: string[]): LineInfo[] {
  const result: LineInfo[] = [];
  let oldLine = 0;
  let newLine = 0;

  for (const line of rawLines) {
    if (line.startsWith("@@")) {
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (m) {
        oldLine = parseInt(m[1], 10);
        newLine = parseInt(m[2], 10);
      }
      result.push({ text: line, oldNum: "", newNum: "", kind: "hunk" });
    } else if (line.startsWith("+")) {
      result.push({
        text: line,
        oldNum: "",
        newNum: String(newLine),
        kind: "add",
      });
      newLine++;
    } else if (line.startsWith("-")) {
      result.push({
        text: line,
        oldNum: String(oldLine),
        newNum: "",
        kind: "del",
      });
      oldLine++;
    } else {
      result.push({
        text: line,
        oldNum: String(oldLine),
        newNum: String(newLine),
        kind: "ctx",
      });
      oldLine++;
      newLine++;
    }
  }
  return result;
}

function DiffLineView({ info }: { info: LineInfo }) {
  let numBg = "transparent";
  let numBorderColor = "transparent";
  let codeBg = "transparent";
  let codeColor = "#1A1A1A";

  if (info.kind === "add") {
    numBg = "#C3F6AD";
    numBorderColor = "#9EE67F";
    codeBg = "#E3FDD7";
    codeColor = "#3D841E";
  } else if (info.kind === "del") {
    numBg = "#FFB2B2";
    numBorderColor = "#FFB2B2";
    codeBg = "#FFEFEF";
    codeColor = "#841E1E";
  } else if (info.kind === "hunk") {
    codeColor = "#808080";
  }

  return (
    <View style={styles.lineRow}>
      <View
        style={[
          styles.lineNums,
          { backgroundColor: numBg, borderRightColor: numBorderColor },
        ]}
      >
        <Text style={styles.lineNum}>{info.oldNum.padStart(3)}</Text>
        <Text style={styles.lineNum}>{info.newNum.padStart(3)}</Text>
      </View>
      <View style={[styles.lineCode, { backgroundColor: codeBg }]}>
        <Text style={[styles.lineText, { color: codeColor }]}>{info.text}</Text>
      </View>
    </View>
  );
}

const statusLabels: Record<FileDiff["status"], string> = {
  modified: "M",
  new: "A",
  deleted: "D",
  renamed: "R",
};
const statusColors: Record<FileDiff["status"], string> = {
  modified: "#FFE5CC",
  new: "#FCC",
  deleted: "#EF4444",
  renamed: "#3B82F6",
};

function FileBox({ file }: { file: FileDiff }) {
  const lines = useMemo(() => buildLines(file.lines), [file.lines]);
  return (
    <View style={styles.fileBox}>
      <View style={styles.fileHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[file.status] + "22" },
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              { color: statusColors[file.status] },
            ]}
          >
            {statusLabels[file.status]}
          </Text>
        </View>
        <Text style={styles.fileName} numberOfLines={1}>
          {file.renamedFrom
            ? `${file.renamedFrom} → ${file.filename}`
            : file.filename}
        </Text>
        <View style={{ flex: 1 }} />
        {file.additions > 0 && (
          <Text style={styles.statAdd}>+{file.additions}</Text>
        )}
        {file.deletions > 0 && (
          <Text style={styles.statDel}>-{file.deletions}</Text>
        )}
      </View>
      <View style={styles.fileBody}>
        {lines.map((info, i) => (
          <DiffLineView key={i} info={info} />
        ))}
      </View>
    </View>
  );
}

export function DiffViewer({
  serverUrl,
  repoPath,
  repoName,
  branchName,
}: {
  serverUrl: string;
  repoPath: string;
  repoName?: string;
  branchName?: string;
}) {
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const [diffsText, setDiffsText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setDiffsText(null);
    const unsub = subscribeToConnection(serverUrl, () => {
      const entry = getEntry(serverUrl);
      if (entry?.diffs !== undefined) {
        setDiffsText(entry.diffs);
        setLoading(false);
      }
    });
    getDiffsStore(serverUrl, repoPath);
    return unsub;
  }, [serverUrl, repoPath]);

  const files = useMemo(
    () => (diffsText ? parseFileDiffs(diffsText) : []),
    [diffsText],
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
          <BackButtonIcon width={40} height={40} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Diffs
          </Text>
          <View style={styles.branchRow}>
            <Text style={styles.branchName}>{repoName ?? repoPath} ·</Text>
            <GitBranchIcon width={14} height={14} />
            <Text style={styles.branchName}>{branchName ?? ""}</Text>
          </View>
        </View>

        <View style={styles.headerBtn} />
      </View>

      {/* ── Content ── */}
      {loading || diffsText === null ? (
        <View style={styles.empty}>
          <ActivityIndicator color="#808080" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Loading diffs…</Text>
        </View>
      ) : diffsText === "" || files.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No diffs available</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
        >
          {files.map((file, i) => (
            <FileBox key={i} file={file} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },

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
  headerTitle: {
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

  // Scroll
  scroll: { flex: 1 },
  content: { paddingHorizontal: 12, paddingBottom: 24, gap: 16 },

  // File card
  fileBox: {
    borderWidth: 1,
    borderColor: "#DFDFDF",
    borderRadius: 8,
    overflow: "hidden",
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#F2F2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontFamily: SFMono.semiBold,
    fontSize: 11,
    fontWeight: "700",
  },
  fileName: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "600",
    flexShrink: 1,
  },
  statAdd: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    fontWeight: "500",
    color: "#3D841E",
  },
  statDel: {
    fontFamily: SFMono.regular,
    fontSize: 13,
    fontWeight: "500",
    color: "#841E1E",
  },
  fileBody: {
    paddingVertical: 4,
  },

  // Diff lines
  lineRow: {
    flexDirection: "row",
  },
  lineNums: {
    flexDirection: "row",
    borderRightWidth: 1,
  },
  lineNum: {
    fontFamily: SFMono.regular,
    fontSize: 11,
    lineHeight: 18,
    width: 30,
    textAlign: "right",
    paddingRight: 6,
    paddingLeft: 4,
    color: "#808080",
  },
  lineCode: {
    flex: 1,
    paddingHorizontal: 8,
  },
  lineText: {
    fontFamily: SFMono.regular,
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // Empty / loading
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    color: "#808080",
  },
});
