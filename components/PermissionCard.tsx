import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CodeLine = { num: number; prefix: "+" | "-" | " "; text: string };

export interface PermissionCardData {
  id: string;
  toolName: string;
  toolType: "Write" | "Edit" | "Bash" | "Read" | string;
  time: string;
  path: string;
  origin: string;
  initials: string;
  codeLines: CodeLine[];
}

// ─── Badge Config ─────────────────────────────────────────────────────────────

export const BADGE_CONFIG: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  Write: { bg: "#FFF5E6", border: "#FF9500", text: "#B05A00" },
  Bash: { bg: "#EEF2FF", border: "#4F6BFF", text: "#1E3799" },
  Edit: { bg: "#F3EEFF", border: "#8B5CF6", text: "#5B21B6" },
  Read: { bg: "#E6F7FF", border: "#0EA5E9", text: "#0C4A6E" },
  default: { bg: "#F0F0F0", border: "#999999", text: "#555555" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PermissionCard({
  item,
  onApprove,
  onDeny,
}: {
  item: PermissionCardData;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const badge = BADGE_CONFIG[item.toolType] ?? BADGE_CONFIG.default;
  const isBash = item.toolType === "Bash";

  return (
    <View style={perm.card}>
      {/* Top row: tool badge + time */}
      <View style={perm.cardHeader}>
        <View
          style={[
            perm.toolBadge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Text style={[perm.toolBadgeText, { color: badge.text }]}>
            {item.toolName}
          </Text>
        </View>
        <Text style={perm.cardTime}>{item.time}</Text>
      </View>

      {/* Path row */}
      <View style={perm.pathRow}>
        <View style={perm.pathIconWrap}>
          <Text style={perm.pathIconText}>{isBash ? "</>" : "⬡"}</Text>
        </View>
        <Text style={perm.pathText} numberOfLines={1}>
          {item.path}
        </Text>
      </View>

      {/* Origin row */}
      <View style={perm.originRow}>
        <Text style={perm.originLabel}>Origin</Text>
        <View style={perm.originAvatar}>
          <Text style={perm.originInitials}>{item.initials}</Text>
        </View>
        <Text style={perm.originText}>{item.origin}</Text>
      </View>

      {/* Code preview */}
      {item.codeLines.length > 0 && (
        <View style={perm.codeBlock}>
          {/* Unified left gutter — one background for all lines */}
          <View style={perm.codeGutterCol}>
            {item.codeLines.map((line, idx) => (
              <View key={idx} style={perm.gutterRow}>
                <Text style={perm.codeLineNum}>{line.num}</Text>
                <Text
                  style={[
                    perm.codePrefix,
                    line.prefix === "+"
                      ? perm.codeAdd
                      : line.prefix === "-"
                        ? perm.codeDel
                        : perm.codeNeutral,
                  ]}
                >
                  {line.prefix}
                </Text>
              </View>
            ))}
          </View>
          {/* Code text column */}
          <View style={perm.codeTextCol}>
            {item.codeLines.map((line, idx) => (
              <Text
                key={idx}
                style={[
                  perm.codeText,
                  line.prefix === "+"
                    ? perm.codeAdd
                    : line.prefix === "-"
                      ? perm.codeDel
                      : null,
                ]}
                numberOfLines={1}
              >
                {line.text}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* Action buttons */}
      <View style={perm.buttonRow}>
        {/* Deny */}
        <TouchableOpacity
          style={perm.denyOuter}
          onPress={onDeny}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#FF3D3D", "#FFA047"]}
            start={{ x: 0.72, y: 1 }}
            end={{ x: 0.28, y: 0 }}
            style={perm.btnGradient}
          >
            <Text style={perm.denyText}>✕ Deny</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Approve */}
        <TouchableOpacity
          style={perm.approveOuter}
          onPress={onApprove}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#00FF40", "#E0FF47"]}
            start={{ x: 0.72, y: 1 }}
            end={{ x: 0.28, y: 0 }}
            style={perm.btnGradient}
          >
            <Text style={perm.approveText}>✓ Approve</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const perm = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginHorizontal: 14,
    marginBottom: 12,
    padding: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  toolBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  cardTime: {
    fontSize: 11,
    color: "#8E8E93",
  },
  pathRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    overflow: "hidden",
    gap: 10,
    paddingRight: 10,
  },
  pathIconWrap: {
    alignSelf: "stretch",
    backgroundColor: "#E4E3E3",
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pathIconText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },
  pathText: {
    flex: 1,
    fontSize: 13,
    color: "#1C1C1E",
    fontFamily: "monospace",
  },
  originRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  originLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginRight: 2,
  },
  originAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#4F6BFF",
    alignItems: "center",
    justifyContent: "center",
  },
  originInitials: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  originText: {
    fontSize: 12,
    color: "#3C3C43",
    fontWeight: "500",
  },
  codeBlock: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E1E1E1",
    overflow: "hidden",
  },
  codeGutterCol: {
    backgroundColor: "#E4E3E3",
    borderRightWidth: 1,
    borderRightColor: "#E1E1E1",
    paddingVertical: 8,
    paddingHorizontal: 6,
    gap: 5,
  },
  gutterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  codeTextCol: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 5,
  },
  codeLineNum: {
    fontSize: 11,
    color: "#8E8E93",
    width: 14,
    textAlign: "right",
    fontFamily: "monospace",
  },
  codePrefix: {
    fontSize: 12,
    fontWeight: "700",
    width: 10,
    fontFamily: "monospace",
  },
  codeAdd: {
    color: "#16A34A",
  },
  codeDel: {
    color: "#DC2626",
  },
  codeNeutral: {
    color: "#8E8E93",
  },
  codeText: {
    flex: 1,
    fontSize: 11,
    color: "#1C1C1E",
    fontFamily: "monospace",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  denyOuter: {
    flex: 1,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#CC0000",
    overflow: "hidden",
  },
  approveOuter: {
    flex: 1,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    overflow: "hidden",
  },
  btnGradient: {
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  denyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  approveText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1C4A00",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
  },
});
