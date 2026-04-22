import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MachineCarousel, Machine } from "@/components/new-navbar/MachineCarousel";
import { ConnectMoreSlider } from "@/components/new-navbar/ConnectMoreSlider";
import { AddRepoSlider } from "@/components/new-navbar/AddRepoSlider";

import AddIcon from "@/assets/images/new-design/navbar/add-icon.svg";
import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import GitIcon from "@/assets/images/new-design/navbar/git-icon.svg";

import { SFPro } from "@/constants/theme";

// ─── Mock data ────────────────────────────────────────────────────────────────

const REPOS: { id: string; name: string; branch: string; language: string }[] = [
  { id: "1", name: "Grass-welcome", branch: "main", language: "Python" },
  { id: "2", name: "api-server", branch: "dev", language: "Markdown" },
  { id: "3", name: "grocery-tracker", branch: "main", language: "Swift" },
];

const MACHINES: Machine[] = [
  {
    id: "1",
    name: "Son of Anton",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
  },
  {
    id: "2",
    name: "Sam's Mac...",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-two.png"),
    borderColor: "#D8A4E8",
    backgroundColor: "#f0c5e8",
  },
  {
    id: "3",
    name: "iMac",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-three.png"),
    borderColor: "#BDBDBD",
    backgroundColor: "#D9D9D9",
  },
  {
    id: "4",
    name: "Da...",
    image: require("@/assets/images/new-design/navbar/dummy-profile-icons/profile-one.png"),
    borderColor: "#A0C4E8",
    backgroundColor: "#E3FDD7",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ReposScreen() {
  const { bottom } = useSafeAreaInsets();
  const [selectedMachineId, setSelectedMachineId] = useState<string>("2");
  const [connectMoreVisible, setConnectMoreVisible] = useState(false);
  const [addRepoVisible, setAddRepoVisible] = useState(false);

  return (
    <View style={styles.reposContainer}>
      <MachineCarousel
        machines={MACHINES}
        selectedId={selectedMachineId}
        onSelect={setSelectedMachineId}
        onAddNew={() => setConnectMoreVisible(true)}
      />
      <ConnectMoreSlider
        visible={connectMoreVisible}
        onClose={() => setConnectMoreVisible(false)}
      />
      <AddRepoSlider
        visible={addRepoVisible}
        onClose={() => setAddRepoVisible(false)}
      />
        {/* Sticky action buttons */}
        <View style={styles.repoActionRow}>
          <TouchableOpacity style={styles.repoActionBtn} activeOpacity={0.75} onPress={() => setAddRepoVisible(true)}>
            <AddIcon width={30} height={30} />
            <Text style={styles.repoActionText}>Add new repo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.repoActionBtn} activeOpacity={0.75} onPress={() => setAddRepoVisible(true)}>
            <GitIcon width={30} height={16} />
            <Text style={styles.repoActionText}>Clone from GitHub</Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable repo list */}
        <ScrollView
          style={styles.repoScrollList}
          contentContainerStyle={{ paddingBottom: bottom + 80 + 16 }}
          showsVerticalScrollIndicator={false}
        >
          {REPOS.map((repo) => (
            <TouchableOpacity key={repo.id} style={styles.repoItem} activeOpacity={0.7}>
              <View style={styles.repoInfo}>
                <Text style={styles.repoName}>{repo.name}</Text>
                <View style={styles.repoBranchRow}>
                  <GitBranchIcon width={14} height={14} style={styles.repoBranchIconSvg} />
                  <Text style={styles.repoBranchText}>{repo.branch}</Text>
                </View>
              </View>
              <View style={styles.repoLanguageBadge}>
                <Text style={styles.repoLanguageText}>{repo.language}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  reposContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  repoActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  repoActionBtn: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  repoActionText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#000",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  repoScrollList: {
    flex: 1,
  },
  repoItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  repoInfo: {
    gap: 4,
  },
  repoName: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  repoBranchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  repoBranchIconSvg: {},
  repoBranchText: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#9F9F9F",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  repoLanguageBadge: {
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 8,
  },
  repoLanguageText: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: "#9F9F9F",
    lineHeight: 18,
    letterSpacing: -0.3,
  },
});
