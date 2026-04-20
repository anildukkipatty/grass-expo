import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ApproveIcon from "@/assets/images/new-design/navbar/approve-icon.svg";
import DenyIcon from "@/assets/images/new-design/navbar/deny-icon.svg";
import FolderIcon from "@/assets/images/new-design/navbar/folder-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import GitIcon from "@/assets/images/new-design/navbar/git-icon.svg";
import PermissionIcon from "@/assets/images/new-design/navbar/permission-icon.svg";

import { SFPro } from "@/constants/theme";

// ─── Types ────────────────────────────────────────────────────────────────────

type PermissionType =
  | "BASH"
  | "WRITE FILE"
  | "READ FILE"
  | "GIT"
  | "CREATE FILE"
  | "DELETE FILE"
  | "NETWORK";

type DiffLine = { type: "add" | "remove" | "context"; content: string };

type Permission = {
  id: string;
  type: PermissionType;
  time: string;
  command: string;
  origin: { initials: string; color: string; name: string; agent: string };
  diff?: DiffLine[];
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const PERMISSIONS: Permission[] = [
  {
    id: "1",
    type: "BASH",
    time: "2m ago",
    command: "npm run test -- --coverage",
    origin: {
      initials: "SK",
      color: "#72C44E",
      name: "Sahil",
      agent: "Claude Mythos",
    },
  },
  {
    id: "2",
    type: "WRITE FILE",
    time: "2m ago",
    command: "src/utils/auth.ts",
    origin: {
      initials: "SJ",
      color: "#D8A4E8",
      name: "You",
      agent: "Claude Mythos",
    },
    diff: [
      { type: "add", content: "+ import jwt from 'jsonwebtoken';" },
      { type: "add", content: "+ interface TokenPayload {" },
      { type: "add", content: "+   userId: string;" },
    ],
  },
  {
    id: "3",
    type: "GIT",
    time: "5m ago",
    command: "git push origin main --force",
    origin: {
      initials: "AY",
      color: "#F4A261",
      name: "Ayyappa",
      agent: "Gemini 2.0",
    },
  },
  {
    id: "4",
    type: "CREATE FILE",
    time: "8m ago",
    command: "src/components/Modal.tsx",
    origin: {
      initials: "SK",
      color: "#72C44E",
      name: "Sahil",
      agent: "Claude Mythos",
    },
    diff: [
      { type: "add", content: "+ import React from 'react';" },
      { type: "add", content: "+ export function Modal({ children }) {" },
      { type: "add", content: "+   return <View>{children}</View>;" },
    ],
  },
  {
    id: "5",
    type: "BASH",
    time: "12m ago",
    command: "rm -rf node_modules && npm i",
    origin: { initials: "SJ", color: "#D8A4E8", name: "You", agent: "GPT-4o" },
  },
  {
    id: "6",
    type: "DELETE FILE",
    time: "15m ago",
    command: "src/legacy/old-auth.ts",
    origin: {
      initials: "AY",
      color: "#F4A261",
      name: "Ayyappa",
      agent: "Claude Mythos",
    },
    diff: [
      { type: "remove", content: "- export const legacyAuth = () => {" },
      { type: "remove", content: "-   // deprecated method" },
      { type: "remove", content: "- };" },
    ],
  },
  {
    id: "7",
    type: "NETWORK",
    time: "20m ago",
    command: "POST api.revise.network/deploy",
    origin: {
      initials: "SK",
      color: "#72C44E",
      name: "Sahil",
      agent: "Opencode",
    },
  },
  {
    id: "8",
    type: "READ FILE",
    time: "22m ago",
    command: ".env.production",
    origin: {
      initials: "SJ",
      color: "#D8A4E8",
      name: "You",
      agent: "Claude Mythos",
    },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCommandIcon(type: PermissionType) {
  switch (type) {
    case "GIT":
      return <GitIcon width={18} height={18} />;
    case "CREATE FILE":
    case "WRITE FILE":
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
  if (type === "remove") return "#F6ADad";
  return "#E8E8E8";
}

function getDiffLineBorderColor(type: DiffLine["type"]) {
  if (type === "add") return "#9EE67F";
  if (type === "remove") return "#E67F7F";
  return "#DFDFDF";
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
  return (
    <View style={styles.card}>
      {/* Top row: badge + time */}
      <View style={styles.cardTopRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{item.type}</Text>
        </View>
        <Text style={styles.cardTime}>{item.time}</Text>
      </View>

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
        <View
          style={[styles.originAvatar, { backgroundColor: item.origin.color }]}
        >
          <Text style={styles.originInitials}>{item.origin.initials}</Text>
        </View>
        <Text style={styles.originName}>
          <Text style={styles.originNameBold}>{item.origin.name}</Text>
          {" via "}
          <Text style={styles.originAgent}>{item.origin.agent}</Text>
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
              <Text style={styles.diffLineContent} numberOfLines={1}>
                {line.content}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actionRow}>
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function PermissionsScreen() {
  const { bottom } = useSafeAreaInsets();
  const [permissions, setPermissions] = useState(PERMISSIONS);

  function handleApprove(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  }

  function handleDeny(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <View style={styles.container}>
      {/* ── Section header ── */}
      {/* <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Pending permissions</Text>
        {permissions.length > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{permissions.length}</Text>
          </View>
        )}
      </View> */}

      {/* ── Permission cards ── */}
      <ScrollView
        style={styles.cardList}
        contentContainerStyle={{ paddingBottom: bottom + 24, gap: 12 }}
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

  // Section header
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  sectionHeader: { fontFamily: SFPro.semiBold, fontSize: 17, color: "#000" },
  pendingBadge: {
    backgroundColor: "#841E1E",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pendingBadgeText: { fontFamily: SFPro.semiBold, fontSize: 12, color: "#FFF" },

  // Card list
  cardList: { flex: 1, paddingHorizontal: 16 },

  // Permission card
  card: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2f2f2",
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  // Type badge + top row
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  typeBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#B20000",
    backgroundColor: "#FCC",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  typeBadgeText: {
    fontFamily: SFPro.semiBold,
    fontSize: 11,
    color: "#B20000",
    letterSpacing: 0.5,
  },
  cardTime: { fontFamily: SFPro.regular, fontSize: 13, color: "#808080" },

  // Command row
  commandRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  commandIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
    backgroundColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
  },
  commandTextBox: { flex: 1, paddingHorizontal: 12, justifyContent: "center" },
  commandText: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: "#333",
    letterSpacing: -0.2,
  },
  codeSymbol: { fontFamily: SFPro.semiBold, fontSize: 13, color: "#555" },

  // Origin
  originRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  originLabel: { fontFamily: SFPro.semiBold, fontSize: 15, color: "#000" },
  originAvatar: {
    width: 20,
    height: 20,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  originInitials: { fontFamily: SFPro.semiBold, fontSize: 9, color: "#FFF" },
  originName: {
    fontFamily: SFPro.semiBold,
    fontSize: 15,
    color: "#000",
    flex: 1,
  },
  originNameBold: { fontFamily: SFPro.semiBold, color: "#000" },
  originAgent: { fontFamily: SFPro.semiBold, color: "#000" },

  // Diff
  diffContainer: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    overflow: "hidden",
  },
  diffLine: { flexDirection: "row", alignItems: "center", minHeight: 30 },
  diffLineFirst: { borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  diffLineLast: { borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  diffLineNumber: {
    width: 32,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    paddingVertical: 6,
    minHeight: 30,
  },
  diffLineNumberText: {
    fontFamily: SFPro.regular,
    fontSize: 11,
    color: "#555",
  },
  diffLineContent: {
    flex: 1,
    fontFamily: "Courier",
    fontSize: 12,
    color: "#333",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // Action buttons
  actionRow: { flexDirection: "row", gap: 10 },
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
  actionBtnText: { fontFamily: SFPro.semiBold, fontSize: 17, color: "#FFF" },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
  },
  emptyText: { fontFamily: SFPro.medium, fontSize: 17, color: "#808080" },
});
