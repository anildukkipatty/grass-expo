// import InviteFriendsBackgroundSvg from "@/assets/images/settings/invite-friends-background.svg";
// import InviteFriendsSvg from "@/assets/images/settings/invite-friends.svg";
// import MachineIcon from "@/assets/images/settings/machine-icon.svg";
import BackIcon from "@/assets/images/settings/back-arrow.svg";
import ProfileIconSvg from "@/assets/images/settings/profile-icon.svg";
import { posthog } from "@/constants/posthog";
import { clearAuth, getUser } from "@/store/auth-store";
import { closeConnection, getConnectedUrls } from "@/store/connection-store";
import { clearAllThreads } from "@/store/thread-store";
import { clearUrls } from "@/store/url-store";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const USER = {
  name: "Donald Trump",
  email: "maga@america.com",
  plan: "Free plan",
  vmRemaining: "10 VM remaining",
};

const MACHINES = [
  { id: "1", name: "Grass VM", status: "Online. Ubuntu 24.04" },
];

function ChevronIcon() {
  return <View style={styles.chevronIcon} />;
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [userEmail, setUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    getUser().then((u) => setUserEmail(u?.email ?? null));
  }, []);

  const handleDeleteAccount = () => {
    const email = userEmail ?? "unknown";
    const to = "deleteacc@codeongrass.com";
    const subject = encodeURIComponent("Account Deletion Request");
    const body = encodeURIComponent(
      `Hi Grass team,\n\nI would like to request the deletion of my account.\n\nAccount email: ${email}\n\nPlease confirm once the account has been removed.\n\nThank you.`,
    );
    Linking.openURL(`mailto:${to}?subject=${subject}&body=${body}`);
  };

  const handleClearLocalStorage = () => {
    Alert.alert(
      "Clear Local Storage",
      "This will remove all recent threads for all servers. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await clearAllThreads();
            Alert.alert("Done", "Recent threads cleared.");
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          posthog.capture("user_logged_out");
          posthog.reset();
          const connectedUrls = getConnectedUrls();
          connectedUrls.forEach((url) => closeConnection(url));
          await clearUrls();
          await clearAuth();
          router.dismissAll();
          router.replace("/welcome");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer to push content below the absolute header */}
        <View style={{ height: insets.top + 60 }} />

        {/* Profile Section */}
        <View style={styles.profileSection}>
          {/* <View style={styles.avatarWrapper}> */}
          <ProfileIconSvg style={styles.avatar} />
          {/* </View> */}
          {/* <Text style={styles.userName}>{USER.name}</Text> */}
          <Text style={styles.userEmail}>{userEmail}</Text>
          {/* <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>
              {USER.plan} • {USER.vmRemaining}
            </Text>
          </View> */}
        </View>

        {/* Account Section */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <View style={styles.cardRowColumn}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue}>{userEmail}</Text>
          </View>
          {/* <View style={styles.divider} />
          <View style={styles.cardRow}>
            <View>
              <Text style={styles.rowLabel}>Plan</Text>
              <Text style={styles.rowValue}>Free</Text>
            </View>
            <TouchableOpacity style={styles.upgradeButton}>
              <Text>
                <Text style={styles.upgradeText}>Upgrade</Text>
                <Text>→</Text>
              </Text>
            </TouchableOpacity>
          </View> */}
        </View>

        {/* Machines Section */}
        {/* <Text style={styles.sectionLabel}>MACHINES</Text>
        <View style={styles.card}>
          {MACHINES.map((machine, index) => (
            <View key={machine.id}>
              <TouchableOpacity
                style={styles.machineRow}
                onPress={() => router.push("/machines")}
              >
                <MachineIcon style={styles.machineIcon} />
                <View style={styles.machineInfo}>
                  <Text style={styles.machineName}>{machine.name}</Text>
                  <Text style={styles.machineStatus}>{machine.status}</Text>
                </View>
                <ChevronIcon />
              </TouchableOpacity>
              {index < MACHINES.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
          <View style={styles.divider} />
          <TouchableOpacity style={styles.addMachineRow}>
            <Text style={styles.addMachineText}>+ Add machine</Text>
          </TouchableOpacity>
        </View> */}

        {/* Referral Section */}
        {/* <Text style={styles.sectionLabel}>REFERRAL</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.machineRow}>
            <View style={styles.inviteIconContainer}>
              <InviteFriendsBackgroundSvg
                style={StyleSheet.absoluteFillObject}
                width="100%"
                height="100%"
              />
              <InviteFriendsSvg style={styles.inviteIcon} />
            </View>
            <View style={styles.machineInfo}>
              <Text style={styles.machineName}>Invite friends</Text>
              <Text style={styles.machineStatus}>
                You both get +1h of VM time free
              </Text>
            </View>
            <ChevronIcon />
          </TouchableOpacity>
        </View> */}

        {/* Danger Zone */}
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleClearLocalStorage}
          >
            <Text style={styles.clearStorageText}>Clear local storage</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.dangerRow}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.deleteText}>Delete account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Floating blurred header — covers full top including status bar */}
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
            {/* <Image
              source={require("@/assets/images/settings/back-arrow.png")}
              style={styles.backIcon}
              tintColor="#000"
            /> */}
            <BackIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings &amp; Profile</Text>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F7",
  },
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
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 30,
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
  },
  scroll: {
    paddingHorizontal: 16,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatarWrapper: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#737373",
    marginBottom: 12,
    fontWeight: 500,
  },
  planBadge: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#00B20F",
    backgroundColor: "#CCFFD0",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  planBadgeText: {
    fontSize: 14,
    color: "#00B20F",
    fontWeight: "600",
  },

  // Section label
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8F8F8F",
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardRowColumn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLabel: {
    fontSize: 16,
    color: "rgba(0, 0, 0, 0.50)",
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 16,
    fontWeight: 600,
    color: "rgba(0, 0, 0)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#EBEBEB",
    marginHorizontal: 16,
  },
  upgradeButton: {
    paddingVertical: 4,
  },
  upgradeText: {
    fontSize: 16,
    color: "#59B26E",
    fontWeight: 600,
    marginRight: 5,
  },

  // Machines
  machineRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  machineIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    resizeMode: "contain",
    marginRight: 12,
    textAlign: "center",
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 2,
  },
  machineStatus: {
    fontSize: 13,
    color: "#8F8F8F",
  },
  chevronIcon: {
    width: 7,
    height: 7,
    borderRightWidth: 2,
    borderTopWidth: 2,
    borderColor: "#8F8F8F",
    borderTopRightRadius: 1,
    transform: [{ rotate: "45deg" }],
  },
  addMachineRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  addMachineText: {
    fontSize: 15,
    color: "#59B26E",
    fontWeight: "500",
  },

  // Invite friends
  inviteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  inviteIcon: {
    width: 24,
    height: 24,
  },

  // Danger zone
  dangerRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  clearStorageText: {
    fontSize: 15,
    color: "#E50000",
    fontWeight: "500",
  },
  signOutText: {
    fontSize: 15,
    color: "#E50000",
    fontWeight: "500",
  },
  deleteText: {
    fontSize: 15,
    color: "#E50000",
    fontWeight: "500",
  },

  bottomPad: {
    height: 32,
  },
});
