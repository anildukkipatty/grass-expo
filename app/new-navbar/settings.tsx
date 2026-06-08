import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RightArrow from "@/assets/images/new-design/onboarding/right-arrow-head.svg";
import AddMachineIcon from "@/assets/images/new-design/settings/add-machine.svg";
import ContactIcon from "@/assets/images/new-design/settings/contact.svg";
import DeleteIcon from "@/assets/images/new-design/settings/delete.svg";
import DocumentIcon from "@/assets/images/new-design/settings/document.svg";
import EmailIcon from "@/assets/images/new-design/settings/email.svg";
import ExternalLinkIcon from "@/assets/images/new-design/settings/external-link.svg";
import FeatureIcon from "@/assets/images/new-design/settings/feature.svg";
import LicenceIcon from "@/assets/images/new-design/settings/licence.svg";
import MachineIcon from "@/assets/images/new-design/settings/machine.svg";
import PrivacyIcon from "@/assets/images/new-design/settings/privacy.svg";
import RateIcon from "@/assets/images/new-design/settings/rate.svg";
import ReportBugIcon from "@/assets/images/new-design/settings/report-a-bug.svg";
import SignOutIcon from "@/assets/images/new-design/settings/sign-out.svg";
import TOSIcon from "@/assets/images/new-design/settings/TOS.svg";
import XIcon from "@/assets/images/new-design/settings/x.svg";

import { ConnectLaptopSlider } from "@/components/new-navbar/ConnectLaptopSlider";
import { EditMachineSlider } from "@/components/new-navbar/EditMachineSlider";
import { LogoutSlider } from "@/components/new-navbar/LogoutSlider";
import { NotificationPermissionSlider } from "@/components/new-navbar/NotificationPermissionSlider";
import { SFPro } from "@/constants/theme";
import { extractHost, useNavbar } from "@/contexts/navbar-context";
import { getUser } from "@/store/auth-store";
import { getAllVmMetadata, getVmName } from "@/store/vm-metadata-store";

type SectionRowProps = {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  external?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  labelColor?: string;
};

function SectionRow({
  icon,
  label,
  sublabel,
  external,
  showChevron = true,
  isLast,
  onPress,
  labelColor,
}: SectionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        {icon}
        <View style={styles.rowTextWrap}>
          <Text
            style={[
              styles.rowLabel,
              { color: labelColor ?? (sublabel ? "#9F9F9F" : "#000") },
            ]}
          >
            {label}
          </Text>
          {sublabel ? <Text style={styles.rowSublabel}>{sublabel}</Text> : null}
        </View>
      </View>
      {external ? (
        <ExternalLinkIcon width={18} height={18} />
      ) : showChevron ? (
        <RightArrow width={20} height={20} />
      ) : null}
    </TouchableOpacity>
  );
}

function MachineRow({
  icon,
  label,
  sublabel,
  external,
  showChevron = true,
  isLast,
  onPress,
}: SectionRowProps) {
  return (
    <TouchableOpacity
      style={[styles.row, !isLast && styles.rowBorder]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.rowLeft}>
        {icon}
        <View style={styles.rowTextWrap}>
          <Text style={[styles.rowLabel, { color: "#000" }]}>{label}</Text>
          {sublabel ? (
            <Text style={[styles.rowLabel, { marginTop: 2 }]}>{sublabel}</Text>
          ) : null}
        </View>
      </View>
      {external ? (
        <ExternalLinkIcon width={18} height={18} />
      ) : showChevron ? (
        <RightArrow width={20} height={20} />
      ) : null}
    </TouchableOpacity>
  );
}

/**
 * Server image carrying the animated "screen" from the onboarding claim flow:
 * a blinking dot-grid plus the VM name scrolling across the monitor as a marquee.
 */
function ServerScreen({ name }: { name: string }) {
  const label = (name || "").toUpperCase();
  const dotAnims = useRef(
    Array.from({ length: 15 }, () => new Animated.Value(0.15)),
  ).current;
  const marqueeX = useRef(new Animated.Value(0)).current;
  const [trackW, setTrackW] = useState(0);
  const [textW, setTextW] = useState(0);

  // Dot grid blinks to life.
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    dotAnims.forEach((anim, i) => {
      const id = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(anim, { toValue: 0.15, duration: 500, useNativeDriver: true }),
          ]),
        ).start();
      }, (i * 100) % 1000);
      timeouts.push(id);
    });
    return () => {
      timeouts.forEach(clearTimeout);
      dotAnims.forEach((a) => a.stopAnimation());
    };
  }, [dotAnims]);

  // VM name scrolls right-to-left as a looping marquee.
  useEffect(() => {
    if (!trackW || !textW) return;
    const distance = trackW + textW;
    marqueeX.setValue(trackW);
    const loop = Animated.loop(
      Animated.timing(marqueeX, {
        toValue: -textW,
        duration: distance * 35,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [trackW, textW, label, marqueeX]);

  return (
    <View style={styles.serverImageContainer}>
      <Image
        source={require("@/assets/images/new-design/onboarding/server.png")}
        style={styles.serverImage}
        resizeMode="contain"
      />
      <View style={styles.screenRect}>
        <View style={styles.dotGrid}>
          {dotAnims.map((anim, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: anim }]} />
          ))}
        </View>
        <View
          style={styles.marqueeTrack}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        >
          <Animated.Text
            numberOfLines={1}
            onLayout={(e) => setTextW(e.nativeEvent.layout.width)}
            style={[styles.marqueeText, { transform: [{ translateX: marqueeX }] }]}
          >
            {label}
          </Animated.Text>
        </View>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { vmUrls, primaryVmUrl } = useNavbar();
  const [connectLaptopVisible, setConnectLaptopVisible] = useState(false);
  const [notifPermVisible, setNotifPermVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [editMachineUrl, setEditMachineUrl] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [grassVmName, setGrassVmName] = useState<string | null>(null);
  const [vmMetadataMap, setVmMetadataMap] = useState<Record<string, { name: string; iconIndex: number }>>({});

  useEffect(() => {
    getUser().then((u) => setUserEmail(u?.email ?? null));
    getVmName().then(setGrassVmName);
    getAllVmMetadata().then(setVmMetadataMap);
  }, []);

  function vmDisplayName(url: string): string {
    if (url === primaryVmUrl) return grassVmName ?? extractHost(url);
    return vmMetadataMap[url]?.name ?? extractHost(url);
  }

  const handleSignOut = () => {
    setLogoutVisible(true);
  };

  const handleDeleteAccount = () => {
    router.push("/new-navbar/delete-account");
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.paddedContent, { paddingTop: 8 }]}>
          {/* ── Server image with animated screen ── */}
          <ServerScreen name={grassVmName?.trim() || "Son of ana"} />

          {/* ── Referral ── */}
          {/* <Text style={styles.sectionHeader}>Referral</Text>
          <TouchableOpacity
            style={styles.inviteCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: "/new-navbar/coming-soon",
                params: { title: "Invite Friends" },
              })
            }
          >
            <View style={styles.inviteIconWrap}>
              <InviteFriendsIcon width={15} height={18} />
            </View>
            <View style={styles.inviteText}>
              <Text style={styles.inviteTitle}>Invite friends</Text>
              <Text style={styles.inviteSubtitle}>
                You both get +1h of VM time free
              </Text>
            </View>
            <RightArrow width={20} height={20} />
          </TouchableOpacity> */}

          {/* ── Account ── */}
          <Text style={styles.sectionHeader}>Account</Text>
          <View style={styles.card}>
            <SectionRow
              icon={
                <View style={styles.iconBgTeal}>
                  <EmailIcon width={15} height={18} />
                </View>
              }
              label="Email"
              sublabel={userEmail ?? "—"}
            />
            {/* TODO: Temporarily hidden from Account section (VM Time + Notification Settings) */}
            {/*
            <SectionRow
              icon={
                <View style={styles.iconBgTeal}>
                  <VmTimeIcon width={15} height={18} />
                </View>
              }
              label="VM Time"
              sublabel="Free (2 months remaining)"
            />
            <SectionRow
              icon={
                <View style={styles.iconBgTeal}>
                  <NotificationIcon width={15} height={18} />
                </View>
              }
              label="Notification Settings"
              labelColor="#000"
              isLast
              onPress={() => setNotifPermVisible(true)}
            />
            */}
          </View>

          {/* ── Machines ── */}
          <Text style={styles.sectionHeader}>Machines</Text>
          <View style={styles.card}>
            {vmUrls.map((url) => (
              <MachineRow
                key={url}
                icon={<MachineIcon />}
                label={vmDisplayName(url)}
                sublabel={url === primaryVmUrl ? "Your virtual machine" : "Custom machine"}
                showChevron={url !== primaryVmUrl}
                onPress={
                  url !== primaryVmUrl
                    ? () => setEditMachineUrl(url)
                    : undefined
                }
              />
            ))}
            <MachineRow
              icon={
                <View style={styles.iconBgAddMachine}>
                  <AddMachineIcon width={20} height={18} />
                </View>
              }
              label="Add more machines"
              isLast
              onPress={() => setConnectLaptopVisible(true)}
            />
          </View>
          <ConnectLaptopSlider
            visible={connectLaptopVisible}
            onClose={() => setConnectLaptopVisible(false)}
          />
          <EditMachineSlider
            visible={editMachineUrl !== null}
            onClose={() => {
              setEditMachineUrl(null);
              getAllVmMetadata().then(setVmMetadataMap);
            }}
            machineUrl={editMachineUrl ?? ""}
            initialName={
              editMachineUrl
                ? (vmMetadataMap[editMachineUrl]?.name ?? extractHost(editMachineUrl))
                : ""
            }
            initialIconIndex={
              editMachineUrl ? (vmMetadataMap[editMachineUrl]?.iconIndex ?? 0) : 0
            }
          />

          {/* ── Support ── */}
          <Text style={styles.sectionHeader}>Support</Text>
          <View style={styles.card}>
            <MachineRow
              icon={
                <View style={styles.iconBgSupport}>
                  <DocumentIcon width={15} height={18} />
                </View>
              }
              label="Documentation"
              external
            />
            <MachineRow
              icon={
                <View style={styles.iconBgSupport}>
                  <ReportBugIcon width={13} height={18} />
                </View>
              }
              label="Report a bug"
              external
              onPress={() => Linking.openURL("https://forms.gle/me8GxWugXTgASyZR7")}
            />
            <MachineRow
              icon={
                <View style={styles.iconBgSupport}>
                  <FeatureIcon width={13} height={18} />
                </View>
              }
              label="Request a feature"
              external
              onPress={() =>
                Linking.openURL(
                  "mailto:support@codeongrass.com?subject=Feature%20Request%3A%20%5BYour%20idea%20in%20one%20line%5D&body=What's%20the%20feature%3F%0A%0A%0AWhy%20do%20you%20need%20it%3F%20What%20problem%20does%20it%20solve%3F%0A%0A%0AHow%20are%20you%20currently%20working%20around%20it%3F%0A"
                )
              }
            />
            <MachineRow
              icon={
                <View style={styles.iconBgSupport}>
                  <ContactIcon width={15} height={18} />
                </View>
              }
              label="Support"
              isLast
              onPress={() => router.push("/new-navbar/support")}
            />
          </View>

          {/* ── Legal ── */}
          <Text style={styles.sectionHeader}>Legal</Text>
          <View style={styles.card}>
            <MachineRow
              icon={
                <View style={styles.iconBgLegal}>
                  <PrivacyIcon width={15} height={18} />
                </View>
              }
              label="Privacy Policy"
              external
              onPress={() => Linking.openURL("https://codeongrass.com/privacypolicy")}
            />
            <MachineRow
              icon={
                <View style={styles.iconBgLegal}>
                  <TOSIcon width={15} height={18} />
                </View>
              }
              label="Terms of Service"
              external
              onPress={() => Linking.openURL("https://codeongrass.com/terms")}
            />
            <MachineRow
              icon={
                <View style={styles.iconBgLegal}>
                  <LicenceIcon width={15} height={18} />
                </View>
              }
              label="Open Source Licenses"
              external
              isLast
              onPress={() => Linking.openURL("https://github.com/anildukkipatty/grass-expo/blob/main/LICENSES.md")}
            />
          </View>

          {/* ── Rate & Follow ── */}
          <View style={[styles.card, { marginTop: 16 }]}>
            <MachineRow
              icon={
                <View style={styles.iconBgRateAndFollow}>
                  <RateIcon width={20} height={20} />
                </View>
              }
              label="Rate on App Store"
              external
            />
            <MachineRow
              icon={
                <View style={styles.iconBgRateAndFollow}>
                  <XIcon width={20} height={20} />
                </View>
              }
              label="Follow us on X"
              external
              isLast
              onPress={() => Linking.openURL("https://x.com/Grasshq")}
            />
          </View>

          {/* ── Danger Zone ── */}
          <Text style={styles.sectionHeader}>Danger Zone</Text>
          <View style={styles.dangerCard}>
            <SectionRow
              icon={
                <View style={styles.iconBgDanger}>
                  <SignOutIcon width={15} height={18} />
                </View>
              }
              label="Sign Out"
              labelColor="#000"
              onPress={handleSignOut}
            />
            <SectionRow
              icon={
                <View style={styles.iconBgDanger}>
                  <DeleteIcon width={15} height={18} />
                </View>
              }
              label="Delete Account"
              labelColor="#000"
              isLast
              onPress={handleDeleteAccount}
            />
          </View>

          {/* ── Footer ── */}
          {/* <View style={styles.footer}>
            <Text style={styles.footerTagline}>
              The grass is greener on this side.
            </Text>
            <Text style={styles.footerVersion}>Version 1.0.15</Text>
          </View> */}
        </View>

        {/* ── Banner ── */}
        <Image
          source={require("@/assets/images/new-design/settings/banner.png")}
          style={styles.banner}
          resizeMode="stretch"
        />
      </ScrollView>

      <NotificationPermissionSlider
        visible={notifPermVisible}
        onClose={() => setNotifPermVisible(false)}
      />
      <LogoutSlider
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
      />
    </View>
  );
}

const ICON_BG_SIZE = 36;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {},
  paddedContent: {
    paddingHorizontal: 16,
  },

  // Profile
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 10,
  },
  profileText: {
    flex: 1,
    paddingRight: 16,
  },
  profileName: {
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    color: "#000",
    lineHeight: 25,
    letterSpacing: -0.5,
    marginBottom: 5,
  },
  profileEmail: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#737373",
  },
  profileImage: {
    width: 82,
    height: 82,
    borderRadius: 71,
    borderWidth: 3,
    // borderColor: "red",
    borderColor: "#b0aeae7e",
  },

  // Server image
  serverImageContainer: {
    width: "100%",
    aspectRatio: 1499 / 521,
    marginTop: 32,
    marginBottom: 16,
    alignSelf: "center",
  },
  serverImage: {
    width: "100%",
    height: "100%",
  },
  // Animated monitor screen overlaid on the server image (positioned to sit on
  // the illustration's screen — same relative box used on the claim screen).
  screenRect: {
    position: "absolute",
    top: "23%",
    left: "25.5%",
    width: "22.3%",
    height: "30%",
    backgroundColor: "#000",
    borderRadius: 3,
    padding: 3,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  dotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#4FA825",
  },
  marqueeTrack: {
    width: "100%",
    height: 12,
    overflow: "hidden",
  },
  marqueeText: {
    position: "absolute",
    top: 0,
    fontFamily: "Courier New",
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#4FA825",
  },

  // Section header
  sectionHeader: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#000",
    // textTransform: "uppercase",
    letterSpacing: -0.5,
    marginBottom: 8,
    marginTop: 16,
  },

  // Invite card
  inviteCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#E3FDD7",
    padding: 14,
    gap: 10,
  },
  inviteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#9EE67F",
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#72C44E",
    borderWidth: 1,
  },
  inviteText: {
    flex: 1,
  },
  inviteTitle: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#000",
    marginBottom: 2,
  },
  inviteSubtitle: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#3D841E",
  },

  // Card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F2",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#9F9F9F",
  },
  rowSublabel: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#000",
    marginTop: 2,
  },

  // Icon backgrounds
  iconBgTeal: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#85B7EB",
    backgroundColor: "#E6F1FB",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBgAddMachine: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBgSupport: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#5DCAA5",
    backgroundColor: "#E1F5EE",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBgLegal: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#B4B2A9",
    backgroundColor: "#F1EFE8",
    justifyContent: "center",
    alignItems: "center",
  },
  iconBgRateAndFollow: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#72C44E",
    backgroundColor: "#E3FDD7",
    justifyContent: "center",
    alignItems: "center",
  },
  machineIcon: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    objectFit: "cover",
  },
  dangerCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#transparent",
    overflow: "hidden",
  },
  iconBgDanger: {
    width: ICON_BG_SIZE,
    height: ICON_BG_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C20000",
    backgroundColor: "#FFDCDC",
    justifyContent: "center",
    alignItems: "center",
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  footerTagline: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#000",
  },
  footerVersion: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    letterSpacing: -0.5,
    color: "#808080",
  },

  // Banner
  banner: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").width * (610 / 804),
  },
});
