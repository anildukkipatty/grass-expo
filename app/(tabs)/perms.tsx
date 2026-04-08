import { NavBanner } from "@/components/NavBanner";
import { StickyBannerLayout } from "@/components/StickyBannerLayout";
import { useNavbar } from "@/contexts/navbar-context";
import {
  getPermissions,
  GlobalPermissionItem,
  respondGlobalPermission,
  subscribeToPermissions,
} from "@/store/connection-store";
import { useTheme } from "@/store/theme-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SyntaxBlock } from "@/components/SyntaxBlock";
import { GrassColors } from "@/constants/theme";
import { fenceColors } from "@/constants/markdownStyles";

// ─── Old UI (commented out for future reference) ──────────────────────────────
/*
import { PermissionCard } from "@/components/PermissionCard";

const MOCK_PERMISSIONS = [
  {
    id: '1',
    toolName: 'WRITE FILE',
    toolType: 'Write' as const,
    time: '2m ago',
    path: 'src/utils/auth.ts',
    origin: 'You via Opencode',
    initials: 'Y',
    codeLines: [
      { num: 1, prefix: '+', text: "import jwt from 'jsonwebtoken';" },
      { num: 2, prefix: '+', text: 'interface TokenPayload {' },
      { num: 3, prefix: '+', text: '  userId: string;' },
    ],
  },
  {
    id: '2',
    toolName: 'BASH',
    toolType: 'Bash' as const,
    time: '2m ago',
    path: 'npm run test -- --coverage',
    origin: 'Sahil via Claude Mythos',
    initials: 'S',
    codeLines: [],
  },
  {
    id: '3',
    toolName: 'EDIT FILE',
    toolType: 'Edit' as const,
    time: '2m ago',
    path: 'src/routes/api.ts',
    origin: 'Sahil via Claude Mythos',
    initials: 'S',
    codeLines: [
      { num: 1, prefix: '-', text: 'const router = express.Router();' },
      { num: 2, prefix: '+', text: 'const router = Router();' },
    ],
  },
  {
    id: '4',
    toolName: 'READ FILE',
    toolType: 'Read' as const,
    time: '8m ago',
    path: 'src/middleware/auth.ts',
    origin: 'You via Opencode',
    initials: 'Y',
    codeLines: [],
  },
];

// Old render (inside PermsTab):
// const { permissions: livePermissions, setPermissions } = useNavbar();
// const permissions = livePermissions.length > 0 ? livePermissions : MOCK_PERMISSIONS;
//
// {permissions.map((item) => (
//   <PermissionCard
//     key={item.id}
//     item={item}
//     onApprove={() => handleApprove(item.id)}
//     onDeny={() => handleDeny(item.id)}
//   />
// ))}
*/
// ─────────────────────────────────────────────────────────────────────────────

// ─── Section helpers (mirrors PermissionModal's formatSections) ───────────────

interface Section { label: string; code: string; language: string }

function formatSections(toolName: string, input: Record<string, unknown>): Section[] {
  switch (toolName) {
    case 'Write': {
      const content = (input.content as string) || '';
      const preview = content.slice(0, 500) + (content.length > 500 ? '\n...' : '');
      return [{ label: `File: ${input.file_path}`, code: preview, language: 'tsx' }];
    }
    case 'Edit':
      return [
        { label: `File: ${input.file_path}  —  Replace`, code: (input.old_string as string || '').slice(0, 300), language: 'tsx' },
        { label: 'With', code: (input.new_string as string || '').slice(0, 300), language: 'tsx' },
      ];
    case 'Bash':
      return [{ label: 'Command', code: String(input.command ?? ''), language: 'bash' }];
    default:
      return [{ label: '', code: JSON.stringify(input, null, 2), language: 'json' }];
  }
}

// ─── PermCard — PermissionModal structure + PermissionCard styling ────────────

const BADGE_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  Write:   { bg: "#FFF5E6", border: "#FF9500", text: "#B05A00" },
  Bash:    { bg: "#EEF2FF", border: "#4F6BFF", text: "#1E3799" },
  Edit:    { bg: "#F3EEFF", border: "#8B5CF6", text: "#5B21B6" },
  Read:    { bg: "#E6F7FF", border: "#0EA5E9", text: "#0C4A6E" },
  default: { bg: "#F0F0F0", border: "#999999", text: "#555555" },
};

function PermCard({
  item,
  serverUrl,
  theme,
}: {
  item: GlobalPermissionItem & { serverUrl: string };
  serverUrl: string;
  theme: 'light' | 'dark';
}) {
  const fence = fenceColors(theme);
  const sections = formatSections(item.toolName, item.input);
  const badge = BADGE_CONFIG[item.toolName] ?? BADGE_CONFIG.default;

  function handleApprove() {
    respondGlobalPermission(serverUrl, item.sessionId, item.toolUseID, true);
  }

  function handleDeny() {
    respondGlobalPermission(serverUrl, item.sessionId, item.toolUseID, false);
  }

  return (
    <View style={card.container}>
      {/* Tool badge + repo context */}
      <View style={card.headerRow}>
        <View style={[card.toolBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[card.toolBadgeText, { color: badge.text }]}>{item.toolName}</Text>
        </View>
        <Text style={card.repoText} numberOfLines={1}>{item.repoName}</Text>
      </View>

      {/* Content sections (matches PermissionModal body) */}
      <ScrollView style={card.body} showsVerticalScrollIndicator={false} nestedScrollEnabled>
        {sections.map((sec, idx) => (
          <View key={idx} style={idx > 0 ? { marginTop: 10 } : undefined}>
            {sec.label ? (
              <Text
                style={[
                  card.sectionLabel,
                  {
                    color: fence.text,
                    backgroundColor: fence.bg,
                    borderColor: fence.border,
                  },
                ]}
              >
                {sec.label}
              </Text>
            ) : null}
            <SyntaxBlock code={sec.code} language={sec.language} theme={theme} />
          </View>
        ))}
      </ScrollView>

      {/* Action buttons — PermissionCard gradient style */}
      <View style={card.buttonRow}>
        <TouchableOpacity style={card.denyOuter} onPress={handleDeny} activeOpacity={0.85}>
          <LinearGradient
            colors={["#FF3D3D", "#FFA047"]}
            start={{ x: 0.72, y: 1 }}
            end={{ x: 0.28, y: 0 }}
            style={card.btnGradient}
          >
            <Text style={card.denyText}>✕ Deny</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={card.approveOuter} onPress={handleApprove} activeOpacity={0.85}>
          <LinearGradient
            colors={["#00FF26"]}
            start={{ x: 0.72, y: 1 }}
            end={{ x: 0.28, y: 0 }}
            style={card.btnGradient}
          >
            <Text style={card.approveText}>✓ Approve</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const BANNER_HEIGHT = 160;

export default function PermsTab() {
  const { selectedVmUrl } = useNavbar();
  const [theme] = useTheme();
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = bottom + 110;

  const [perms, setPerms] = useState<(GlobalPermissionItem & { serverUrl: string })[]>([]);

  useEffect(() => {
    if (!selectedVmUrl) {
      setPerms([]);
      return;
    }

    const collect = () => {
      const items = getPermissions(selectedVmUrl).map((p) => ({
        ...p,
        serverUrl: selectedVmUrl,
      }));
      setPerms(items);
    };

    const unsub = subscribeToPermissions(selectedVmUrl, collect);
    collect();
    return unsub;
  }, [selectedVmUrl]);

  return (
    <View style={{ flex: 1, backgroundColor: "#F2F2F7" }}>
      <NavBanner />
      <StickyBannerLayout
        bannerHeight={BANNER_HEIGHT}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {perms.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No pending permissions</Text>
          </View>
        ) : (
          perms.map((item) => (
            <PermCard
              key={item.toolUseID}
              item={item}
              serverUrl={selectedVmUrl!}
              theme={theme}
            />
          ))
        )}
      </StickyBannerLayout>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const card = StyleSheet.create({
  container: {
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  repoText: {
    flex: 1,
    fontSize: 12,
    color: "#8E8E93",
  },
  body: {
    maxHeight: 260,
  },
  sectionLabel: {
    fontSize: 11,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
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
});

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "#8E8E93",
  },
});
