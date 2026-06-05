import { SFPro } from "@/constants/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Placeholder Machines tab. Wire up the real machines list/management UI here.
export default function MachinesScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: top + 12 }]}>
      <Text style={styles.title}>Machines</Text>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Your machines will show up here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: SFPro.semiBold,
    fontSize: 28,
    color: "#1A1A1A",
    letterSpacing: -0.5,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontFamily: SFPro.regular,
    fontSize: 16,
    color: "#808080",
  },
});
