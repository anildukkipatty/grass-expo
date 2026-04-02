import { GetMoreSheet } from "@/components/GetMoreSheet";
import { BlurView } from "expo-blur";
import { Image as ExpoImage } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MachineStatus = "online" | "offline";

interface Machine {
  id: string;
  name: string;
  detail: string;
  icon: any;
  status: MachineStatus;
  // online only
  timerLabel?: string;
  timerValue?: string;
  activeRepos?: number;
  agents?: number;
  // offline only
  offlineNote?: string;
}

const MACHINES: Machine[] = [
  {
    id: "1",
    name: "Grass VM",
    detail: "Online. Ubuntu 24.04",
    icon: require("@/assets/images/settings/machine-icon.png"),
    status: "online",
    timerLabel: "VM Time left",
    timerValue: "7h",
    activeRepos: 2,
    agents: 3,
  },
  {
    id: "2",
    name: "Anils-Macbook-pro",
    detail: "Self hosted. Mac OS Sequoia",
    icon: require("@/assets/images/machines/laptop-icon.png"),
    status: "offline",
    offlineNote:
      "Run  grass start  in your terminal\nto bring this machine online.",
  },
];

export default function MachinesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetInitialView, setSheetInitialView] = useState<
    "home" | "connect-laptop"
  >("home");

  function renderOnlineCard(machine: Machine) {
    return (
      <View key={machine.id} style={styles.card}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Image source={machine.icon} style={styles.machineIcon} />
          <View style={styles.machineInfo}>
            <Text style={styles.machineName}>{machine.name}</Text>
            <Text style={styles.machineDetail}>{machine.detail}</Text>
          </View>
          <View style={styles.onlineBadge}>
            <Text style={styles.onlineBadgeText}>Online</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{machine.timerValue}</Text>
            <Text style={styles.statLabel}>{machine.timerLabel}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{machine.activeRepos}</Text>
            <Text style={styles.statLabel}>Active repos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{machine.agents}</Text>
            <Text style={styles.statLabel}>Agents</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.restartButton}>
            <ExpoImage
              source={require("@/assets/images/machines/restart-icon.svg")}
              style={styles.actionIcon}
              contentFit="contain"
            />
            <Text style={styles.restartText}>Restart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeButton}>
            <ExpoImage
              source={require("@/assets/images/machines/remove-icon.svg")}
              style={styles.actionIcon}
              contentFit="contain"
            />
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderOfflineCard(machine: Machine) {
    return (
      <View key={machine.id} style={styles.card}>
        {/* Header row */}
        <View style={styles.cardHeader}>
          <Image source={machine.icon} style={styles.machineIcon} />
          <View style={styles.machineInfo}>
            <Text style={styles.machineName}>{machine.name}</Text>
            <Text style={styles.machineDetail}>{machine.detail}</Text>
          </View>
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineBadgeText}>Offline</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        {/* Offline instruction */}
        <View style={styles.offlineBody}>
          <View style={styles.offlineRow}>
            <Text style={styles.offlineNote}>{"Run "}</Text>
            <View style={styles.grassStartTag}>
              <Text style={styles.grassStartText}>grass start</Text>
            </View>
            <Text style={styles.offlineNote}>{" in your terminal"}</Text>
          </View>
          <Text style={styles.offlineNote}>
            {"to bring this machine online."}
          </Text>
        </View>

        <View style={styles.cardDivider} />

        {/* Reconnect button */}
        <TouchableOpacity
          style={styles.reconnectButton}
          onPress={() => {
            setSheetInitialView("connect-laptop");
            setSheetVisible(true);
          }}
        >
          <ExpoImage
            source={require("@/assets/images/machines/QR-icon.svg")}
            style={styles.actionIcon}
            contentFit="contain"
          />
          <Text style={styles.reconnectText}>Reconnect via QR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      >
        <View style={styles.headerSpacer} />

        {/* Description */}
        <Text style={styles.description}>
          Machines are environments where your agents run. Switch between them
          from the Home screen.
        </Text>

        {/* Machine cards */}
        {MACHINES.map((m) =>
          m.status === "online" ? renderOnlineCard(m) : renderOfflineCard(m),
        )}

        {/* Connect another machine card */}
        <TouchableOpacity
          style={styles.connectCard}
          activeOpacity={0.8}
          onPress={() => {
            setSheetInitialView("home");
            setSheetVisible(true);
          }}
        >
          <View style={styles.plusIconWrapper}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
          <Text style={styles.connectTitle}>Connect another machine</Text>
          <Text style={styles.connectSubtitle}>
            Any Mac, Linux box, or cloud VM running{"\n"}the Grass daemon
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Floating blurred header */}
      <BlurView
        intensity={50}
        tint="light"
        style={[styles.header, { paddingTop: insets.top }]}
        pointerEvents="box-none"
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Image
              source={require("@/assets/images/settings/back-arrow.png")}
              style={styles.backIcon}
              tintColor="#000"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Machines</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setSheetInitialView("home");
                setSheetVisible(true);
              }}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>

      <GetMoreSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        initialView={sheetInitialView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.70)",
    borderBottomWidth: 1,
    borderBottomColor: "#D3D3D3",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSpacer: {
    height: 125,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#CECECE",
    backgroundColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backIcon: {
    // width: 10,
    // height: 12,
    resizeMode: "contain",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  addButton: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#59B26E",
    backgroundColor: "#00FF33",
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },

  // Scroll
  scroll: {
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 15,
    color: "#6E6E6E",
    lineHeight: 22,
    marginBottom: 20,
    marginTop: 8,
    textAlign: "center",
  },

  // Machine card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  machineIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    resizeMode: "contain",
    marginRight: 12,
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  machineDetail: {
    fontSize: 13,
    color: "#6E6E6E",
  },

  // Status badges
  onlineBadge: {
    borderRadius: 30,
    backgroundColor: "#CCFFD0",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  onlineBadgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007A1A",
  },
  offlineBadge: {
    borderRadius: 30,
    backgroundColor: "#FFCCCC",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  offlineBadgeText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#CC0000",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#EBEBEB",
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "#EBEBEB",
    marginVertical: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.50)",
    textAlign: "center",
    fontWeight: 500,
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
    marginRight: 6,
  },
  restartButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    paddingVertical: 11,
  },
  restartText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#004D13",
  },
  removeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#CC0000",
    paddingVertical: 11,
  },
  removeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#CC0000",
  },

  // Offline card specifics
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EBEBEB",
  },
  offlineBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  offlineRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  offlineNote: {
    fontSize: 14,
    color: "#787878",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: 500,
  },
  grassStartTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#BCC600",
    backgroundColor: "#FEFFDA",
    overflow: "hidden",
  },
  grassStartText: {
    fontSize: 12,
    fontFamily: "DM Mono",
    color: "#6E7400",
    fontWeight: 400,
  },
  reconnectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 63,
    borderWidth: 1,
    borderColor: "#00CC33",
    paddingVertical: 13,
  },
  reconnectText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#004D13",
  },

  // Connect another machine card
  connectCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#004D13",
    backgroundColor: "#F5F5F7",
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  plusIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#009F28",
    backgroundColor: "#59B26E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  plusIcon: {
    fontSize: 32,
    color: "#FFFFFF",
    fontWeight: 500,
    lineHeight: 30,
  },
  connectTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0C8B2B",
    marginBottom: 6,
  },
  connectSubtitle: {
    fontSize: 14,
    color: "#787878",
    textAlign: "center",
    lineHeight: 20,
    fontWeight: 500,
  },

  bottomPad: {
    height: 32,
  },
});
