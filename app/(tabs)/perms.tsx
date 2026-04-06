import { PermissionCard } from "@/components/PermissionCard";
import { useNavbar } from "@/contexts/navbar-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function PermsTab() {
  const { permissions, setPermissions } = useNavbar();
  const tabBarHeight = useBottomTabBarHeight();

  function handleApprove(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  }

  function handleDeny(id: string) {
    setPermissions((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingBottom: tabBarHeight + 20,
        paddingTop: 4,
      }}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
