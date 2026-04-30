import GiftIcon from "@/assets/images/new-design/onboarding/gift.svg";
import LaptopIcon from "@/assets/images/new-design/onboarding/laptop-window.svg";
import MobileIcon from "@/assets/images/new-design/onboarding/mobile-icon.svg";
import VmIcon from "@/assets/images/new-design/onboarding/vm-icon.svg";
import { NationalPark, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  ChunkyButton,
  questStyles,
  QuestExitButton,
  QuestProgress,
} from "./welcome";

const { SKY_TOP, SKY_BOT, SUN, TEXT_DARK } = questStyles;

const REWARDS = [
  { Icon: VmIcon, label: "Cloud companion", value: "RARE" },
  { Icon: LaptopIcon, label: "Headless quests", value: "EPIC" },
  { Icon: MobileIcon, label: "Mobile control", value: "COMMON" },
];

export default function QuestClaim() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />
        <QuestProgress step={1} />

        <ScrollView contentContainerStyle={s.body}>
          <View style={s.scrollHeader}>
            <View style={s.scrollIcon}>
              <GiftIcon width={28} height={28} />
            </View>
            <Text style={s.eyebrow}>STARTER REWARD</Text>
            <Text style={s.title}>10 Hours of{"\n"}Free Compute</Text>
            <View style={s.coinRow}>
              <View style={s.coin}>
                <Text style={s.coinText}>10h</Text>
              </View>
              <Text style={s.perMonth}>/ month, forever</Text>
            </View>
            <Text style={s.body2}>
              No card. No catch. Refreshes on the first of every moon.
            </Text>
          </View>

          <View style={s.lootBox}>
            <Text style={s.lootHeader}>LOOT INCLUDED</Text>
            {REWARDS.map(({ Icon, label, value }, i) => (
              <View key={i} style={s.lootRow}>
                <View style={s.lootIcon}>
                  <Icon width={22} height={22} />
                </View>
                <Text style={s.lootLabel}>{label}</Text>
                <View
                  style={[
                    s.rarityPill,
                    value === "RARE" && { backgroundColor: "#5BA3FF" },
                    value === "EPIC" && { backgroundColor: "#B96CFF" },
                    value === "COMMON" && { backgroundColor: "#9FB6CC" },
                  ]}
                >
                  <Text style={s.rarityText}>{value}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={s.bottom}>
          <ChunkyButton
            label="CLAIM REWARD"
            onPress={() => router.push("/onboarding-mockups/quest/auth" as any)}
            color={SUN}
            shadow="#B27A00"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_BOT },
  body: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
  },
  scrollHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 22,
    alignItems: "center",
    marginBottom: 18,
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  scrollIcon: {
    width: 56, height: 56,
    borderRadius: 12,
    backgroundColor: SUN,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: NationalPark.bold,
    fontSize: 12,
    color: "#E54B4B",
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  title: {
    fontFamily: NationalPark.bold,
    fontSize: 28,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 14,
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  coin: {
    width: 56, height: 56,
    borderRadius: 28,
    backgroundColor: SUN,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  coinText: {
    fontFamily: NationalPark.bold,
    fontSize: 18,
    color: TEXT_DARK,
  },
  perMonth: {
    fontFamily: NationalPark.bold,
    fontSize: 16,
    color: TEXT_DARK,
  },
  body2: {
    fontFamily: SFPro.medium,
    fontSize: 14,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 20,
  },
  lootBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    padding: 16,
    gap: 12,
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  lootHeader: {
    fontFamily: NationalPark.bold,
    fontSize: 12,
    color: TEXT_DARK,
    letterSpacing: 1.4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: TEXT_DARK,
    borderStyle: "dashed",
  },
  lootRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  lootIcon: {
    width: 38, height: 38,
    borderRadius: 8,
    backgroundColor: "#E5F4FF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  lootLabel: {
    flex: 1,
    fontFamily: NationalPark.bold,
    fontSize: 16,
    color: TEXT_DARK,
  },
  rarityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TEXT_DARK,
  },
  rarityText: {
    fontFamily: NationalPark.bold,
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
});
