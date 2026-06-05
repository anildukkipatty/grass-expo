import { AddRepoSlider } from "@/components/new-navbar/AddRepoSlider";
import { ConfigureGitAccessSlider } from "@/components/new-navbar/ConfigureGitAccessSlider";
import { ConnectLaptopSlider } from "@/components/new-navbar/ConnectLaptopSlider";
import {
  ConnectMoreHeader,
  ConnectMoreOptions,
} from "@/components/new-navbar/ConnectMoreSlider";
import { ConnectOwnAgentSlider } from "@/components/new-navbar/ConnectOwnAgentSlider";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MachinesScreen() {
  const { bottom } = useSafeAreaInsets();
  const [ownAgentVisible, setOwnAgentVisible] = React.useState(false);
  const [laptopVisible, setLaptopVisible] = React.useState(false);
  const [addRepoVisible, setAddRepoVisible] = React.useState(false);
  const [gitAccessVisible, setGitAccessVisible] = React.useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottom + 24 },
        ]}
      >
        <ConnectMoreHeader />
        <ConnectMoreOptions
          onConnectAgent={() => setOwnAgentVisible(true)}
          onConnectLaptop={() => setLaptopVisible(true)}
          onAddRepo={() => setAddRepoVisible(true)}
          onConfigureGitAccess={() => setGitAccessVisible(true)}
        />
      </ScrollView>
      <ConnectOwnAgentSlider
        visible={ownAgentVisible}
        onClose={() => setOwnAgentVisible(false)}
      />
      <ConnectLaptopSlider
        visible={laptopVisible}
        onClose={() => setLaptopVisible(false)}
      />
      <AddRepoSlider
        visible={addRepoVisible}
        onClose={() => setAddRepoVisible(false)}
      />
      <ConfigureGitAccessSlider
        visible={gitAccessVisible}
        onClose={() => setGitAccessVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
});
