import React, { useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

import ApproveIcon from "@/assets/images/new-design/navbar/approve-icon.svg";
import DenyIcon from "@/assets/images/new-design/navbar/deny-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import FolderIcon from "@/assets/images/new-design/navbar/folder-icon.svg";
import GitIcon from "@/assets/images/new-design/navbar/git-icon.svg";
import PermissionIcon from "@/assets/images/new-design/navbar/permission-icon.svg";

import { SFMono, SFPro } from "@/constants/theme";
import { useNavbar } from "@/contexts/navbar-context";
import {
  getPermissions,
  GlobalPermissionItem,
  respondGlobalPermission,
  subscribeToPermissions,
} from "@/store/connection-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type DiffLine = { type: "add" | "remove" | "context"; content: string };

type Permission = {
  id: string;
  type: string;
  time: string;
  command: string;
  origin: { initials: string; color: string; name: string; agent: string };
  diff?: DiffLine[];
};

// ─── Badge color mapping ───────────────────────────────────────────────────────

type BadgeColors = { bg: string; border: string; text: string };

const BADGE_COLORS: Record<string, BadgeColors> = {
  BASH:        { bg: "#FCC",     border: "#B20000", text: "#B20000" },
  "WRITE FILE":{ bg: "#FFE5CC", border: "#B25900", text: "#804000" },
  "EDIT FILE": { bg: "#FFE5CC", border: "#B25900", text: "#804000" },
  "READ FILE": { bg: "#E5EFFF", border: "#2B5CB8", text: "#1A3A7A" },
  GIT:         { bg: "#EDE5FF", border: "#6B3CB8", text: "#3A1A7A" },
  NETWORK:     { bg: "#F2F2F2", border: "#9F9F9F", text: "#555"    },
};

const DEFAULT_BADGE: BadgeColors = { bg: "#F2F2F2", border: "#9F9F9F", text: "#555" };

function getBadgeColors(type: string): BadgeColors {
  return BADGE_COLORS[type] ?? DEFAULT_BADGE;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

const TOOL_TYPE_MAP: Record<string, string> = {
  Bash: "BASH",
  Write: "WRITE FILE",
  Edit: "EDIT FILE",
  Read: "READ FILE",
  Glob: "READ FILE",
  Grep: "READ FILE",
  AskUserQuestion: "NETWORK",
};

function mapPermission(item: GlobalPermissionItem & { serverUrl: string }): Permission {
  const type = TOOL_TYPE_MAP[item.toolName] ?? item.toolName.toUpperCase();

  const command = String(
    item.input?.command ??
    item.input?.file_path ??
    item.input?.path ??
    item.input?.description ??
    item.input?.prompt ??
    item.toolName
  );

  let diff: DiffLine[] | undefined;
  if (item.toolName === "Edit" && item.input?.old_string && item.input?.new_string) {
    const removes = String(item.input.old_string).split("\n").slice(0, 4).map(l => ({ type: "remove" as const, content: `- ${l}` }));
    const adds = String(item.input.new_string).split("\n").slice(0, 4).map(l => ({ type: "add" as const, content: `+ ${l}` }));
    diff = [...removes, ...adds].slice(0, 8);
  } else if (item.toolName === "Write" && item.input?.content) {
    diff = String(item.input.content).split("\n").slice(0, 6).map(l => ({ type: "add" as const, content: `+ ${l}` }));
  }

  const repoShort = item.repoName?.slice(0, 2).toUpperCase() ?? "AI";

  return {
    id: item.toolUseID,
    type,
    time: "",
    command,
    origin: {
      initials: repoShort,
      color: "#72C44E",
      name: item.repoName ?? "Agent",
      agent: item.toolName,
    },
    diff,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCommandIcon(type: string) {
  switch (type) {
    case "GIT":
      return <GitIcon width={18} height={18} />;
    case "CREATE FILE":
    case "WRITE FILE":
    case "EDIT FILE":
    case "READ FILE":
    case "DELETE FILE":
      return <FolderIcon width={18} height={18} />;
    case "NETWORK":
      return <PermissionIcon width={18} height={18} />;
    default:
      return <Text style={styles.codeSymbol}>{"</>"}</Text>;
  }
}

function getDiffLineColor(type: DiffLine["type"]) {
  if (type === "add") return "#E3FDD7";
  if (type === "remove") return "#FDD7D7";
  return "#F5F5F5";
}

function getDiffLineNumberColor(type: DiffLine["type"]) {
  if (type === "add") return "#C3F6AD";
  if (type === "remove") return "#F6ADAD";
  return "#E8E8E8";
}

function getDiffLineBorderColor(type: DiffLine["type"]) {
  if (type === "add") return "#9EE67F";
  if (type === "remove") return "#E67F7F";
  return "#DFDFDF";
}

function getDiffTextColor(type: DiffLine["type"]) {
  if (type === "add") return "#3D841E";
  if (type === "remove") return "#841E1E";
  return "#404040";
}

// ─── Permission Card ──────────────────────────────────────────────────────────

function PermissionCard({
  item,
  onApprove,
  onDeny,
}: {
  item: Permission;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const badge = getBadgeColors(item.type);

  return (
    <View style={styles.cardWrapper}>
      {/* Header section */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.typeBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
            <Text style={[styles.typeBadgeText, { color: badge.text }]}>{item.type}</Text>
          </View>
          {!!item.time && <Text style={styles.cardTime}>{item.time}</Text>}
        </View>
        <SymbolView name="arrow.up.left.and.arrow.down.right" size={16} weight="medium" tintColor="#606060" />
      </View>

      {/* Content section */}
      <View style={styles.cardContent}>
        {/* Command row */}
        <View style={styles.commandRow}>
          <View style={styles.commandIconBox}>{getCommandIcon(item.type)}</View>
          <View style={styles.commandTextBox}>
            <Text style={styles.commandText} numberOfLines={1}>
              {item.command}
            </Text>
          </View>
        </View>

        {/* Origin */}
        <View style={styles.originRow}>
          <Text style={styles.originLabel}>Origin</Text>
          <View style={[styles.originAvatar, { backgroundColor: item.origin.color }]}>
            <Text style={styles.originInitials}>{item.origin.initials}</Text>
          </View>
          <Text style={styles.originName}>
            {item.origin.name}
            <Text style={styles.originVia}>{" via "}</Text>
            {item.origin.agent}
          </Text>
        </View>

        {/* Diff section */}
        {item.diff && item.diff.length > 0 && (
          <View style={styles.diffContainer}>
            {item.diff.map((line, idx) => (
              <View
                key={idx}
                style={[
                  styles.diffLine,
                  { backgroundColor: getDiffLineColor(line.type) },
                  idx === 0 && styles.diffLineFirst,
                  idx === item.diff!.length - 1 && styles.diffLineLast,
                ]}
              >
                <View
                  style={[
                    styles.diffLineNumber,
                    {
                      backgroundColor: getDiffLineNumberColor(line.type),
                      borderRightColor: getDiffLineBorderColor(line.type),
                    },
                  ]}
                >
                  <Text style={styles.diffLineNumberText}>{idx + 1}</Text>
                </View>
                <Text
                  style={[styles.diffLineContent, { color: getDiffTextColor(line.type) }]}
                  numberOfLines={1}
                >
                  {line.content}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.denyBtn} onPress={onDeny} activeOpacity={0.8}>
            <DenyIcon width={16} height={16} />
            <Text style={styles.actionBtnText}>Deny</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.approveBtn} onPress={onApprove} activeOpacity={0.8}>
            <ApproveIcon width={16} height={16} />
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PermissionsScreen() {
  const { bottom, top } = useSafeAreaInsets();
  const { selectedVmUrl } = useNavbar();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const rawMap = useRef<Map<string, GlobalPermissionItem & { serverUrl: string }>>(new Map());
  const prevPermCount = useRef(0);

  useEffect(() => {
    if (!selectedVmUrl) {
      setPermissions([]);
      rawMap.current = new Map();
      return;
    }

    const collect = () => {
      const items = getPermissions(selectedVmUrl).map((p) => ({
        ...p,
        serverUrl: selectedVmUrl,
      }));
      rawMap.current = new Map(items.map((i) => [i.toolUseID, i]));
      setPermissions(items.map(mapPermission));
    };

    const unsub = subscribeToPermissions(selectedVmUrl, collect);
    collect();
    return unsub;
  }, [selectedVmUrl]);

  useEffect(() => {
    if (permissions.length > prevPermCount.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
    }
    prevPermCount.current = permissions.length;
  }, [permissions.length]);

  function handleApprove(id: string) {
    const raw = rawMap.current.get(id);
    if (raw) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      respondGlobalPermission(raw.serverUrl, raw.sessionId, raw.toolUseID, true);
    }
  }

  function handleDeny(id: string) {
    const raw = rawMap.current.get(id);
    if (raw) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      respondGlobalPermission(raw.serverUrl, raw.sessionId, raw.toolUseID, false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.cardList}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: bottom + 24, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {permissions.length === 0 ? (
          <View style={styles.emptyState}>
            <GitBranchIcon width={40} height={40} />
            <Text style={styles.emptyText}>No pending permissions</Text>
          </View>
        ) : (
          permissions.map((item) => (
            <PermissionCard
              key={item.id}
              item={item}
              onApprove={() => handleApprove(item.id)}
              onDeny={() => handleDeny(item.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  cardList: { flex: 1, paddingHorizontal: 16 },

  // Card
  cardWrapper: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F2F2F2",
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardContent: {
    backgroundColor: "#F2F2F2",
    padding: 16,
    gap: 12,
  },

  // Badge
  typeBadge: {
    borderRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    letterSpacing: 0,
  },
  cardTime: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#808080",
    letterSpacing: -0.3,
  },

  // Command row
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
    height: 42,
  },
  commandIconBox: {
    width: 42,
    height: 42,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
    backgroundColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
  },
  commandTextBox: { flex: 1, paddingHorizontal: 12, justifyContent: "center" },
  commandText: {
    fontFamily: SFMono.medium,
    fontSize: 15,
    color: "#404040",
  },
  codeSymbol: { fontFamily: SFPro.medium, fontSize: 13, color: "#606060" },

  // Origin
  originRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  originLabel: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#000",
    letterSpacing: -0.3,
  },
  originAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  originInitials: { fontFamily: SFPro.semiBold, fontSize: 9, color: "#FFF" },
  originName: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#000",
    letterSpacing: -0.3,
    flex: 1,
  },
  originVia: {
    color: "#808080",
  },

  // Diff
  diffContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#9F9F9F",
    overflow: "hidden",
  },
  diffLine: { flexDirection: "row", alignItems: "center", minHeight: 32 },
  diffLineFirst: { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  diffLineLast: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  diffLineNumber: {
    width: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    paddingVertical: 6,
    minHeight: 32,
  },
  diffLineNumberText: {
    fontFamily: SFMono.medium,
    fontSize: 14,
    color: "#3D841E",
  },
  diffLineContent: {
    flex: 1,
    fontFamily: SFMono.medium,
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 8 },
  denyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
    borderRadius: 15,
    backgroundColor: "#841E1E",
  },
  approveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    padding: 10,
    borderRadius: 15,
    backgroundColor: "#3D841E",
  },
  actionBtnText: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.5,
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontFamily: SFPro.medium, fontSize: 17, color: "#808080" },
});
