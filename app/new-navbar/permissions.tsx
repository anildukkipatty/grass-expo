import { SFPro } from "@/constants/theme";
import { SafeAreaView, StyleSheet, Text } from "react-native";

export default function PermissionsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Permissions</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  label: { fontFamily: SFPro.semiBold, fontSize: 20, color: "#000" },
});
