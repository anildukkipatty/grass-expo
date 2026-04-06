import { NavBanner } from "@/components/NavBanner";
import { PermissionCard } from "@/components/PermissionCard";
import { StickyBannerLayout } from "@/components/StickyBannerLayout";
import { useNavbar } from "@/contexts/navbar-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const BANNER_HEIGHT = 160;

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

export default function PermsTab() {
  const { permissions: livePermissions, setPermissions } = useNavbar();
  const permissions = livePermissions.length > 0 ? livePermissions : MOCK_PERMISSIONS;
  const { bottom } = useSafeAreaInsets();
  const tabBarHeight = bottom + 110;

  function handleApprove(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  }

  function handleDeny(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <View style={{ flex: 1 }}>
      <NavBanner />
      <StickyBannerLayout
        bannerHeight={BANNER_HEIGHT}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {permissions.length === 0 ? (
          <View style={styles.emptyState}>
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
      </StickyBannerLayout>
    </View>
  );
}

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
