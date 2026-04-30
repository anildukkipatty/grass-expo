import { Image } from "expo-image";
import { NationalPark, SFPro } from "@/constants/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
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

const { SKY_TOP, SKY_BOT, TEXT_DARK, GRASS, GRASS_DARK } = questStyles;

export default function QuestVmReady() {
  const router = useRouter();
  return (
    <View style={s.root}>
      <LinearGradient
        colors={[SKY_TOP, SKY_BOT]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        <QuestExitButton />
        <QuestProgress step={3} />

        <View style={s.body}>
          <Text style={s.eyebrow}>★ COMPANION FOUND ★</Text>
          <Text style={s.title}>Choose your{"\n"}starter.</Text>

          <View style={s.creatureCard}>
            <View style={s.creatureImageWrap}>
              <Image
                source={require("@/assets/images/new-design/onboarding/vm-illustration.png")}
                style={s.creatureImage}
                contentFit="contain"
              />
            </View>

            <View style={s.statBlock}>
              <Text style={s.creatureName}>GRASS-V1</Text>
              <Text style={s.creatureSub}>Cloud Companion · Lv. 1</Text>

              <View style={s.statRow}>
                <Stat label="CPU" value={88} color="#5BA3FF" />
                <Stat label="MEM" value={70} color="#B96CFF" />
                <Stat label="NET" value={92} color={GRASS} />
              </View>

              <View style={s.divider} />

              <View style={s.tagRow}>
                <View style={[s.tag, { backgroundColor: "#FFE7B0" }]}>
                  <Text style={s.tagText}>★ ALWAYS-ON</Text>
                </View>
                <View style={[s.tag, { backgroundColor: "#D6F4D0" }]}>
                  <Text style={s.tagText}>✦ HEADLESS</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={s.bottom}>
          <ChunkyButton
            label="THIS ONE!"
            onPress={() => router.push("/onboarding-mockups/quest/vm-name" as any)}
            color={GRASS}
            shadow={GRASS_DARK}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <View style={s.statBarTrack}>
        <View
          style={[s.statBarFill, { width: `${value}%`, backgroundColor: color }]}
        />
      </View>
      <Text style={s.statValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: SKY_BOT },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 6,
  },
  eyebrow: {
    fontFamily: NationalPark.bold,
    fontSize: 13,
    color: "#E54B4B",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  title: {
    fontFamily: NationalPark.bold,
    fontSize: 30,
    color: TEXT_DARK,
    textAlign: "center",
    lineHeight: 34,
    marginBottom: 18,
  },
  creatureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: TEXT_DARK,
    overflow: "hidden",
    shadowColor: TEXT_DARK,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 6 },
  },
  creatureImageWrap: {
    height: 200,
    backgroundColor: "#E5F4FF",
    borderBottomWidth: 3,
    borderBottomColor: TEXT_DARK,
    alignItems: "center",
    justifyContent: "center",
  },
  creatureImage: {
    width: "100%",
    height: "100%",
  },
  statBlock: {
    padding: 18,
  },
  creatureName: {
    fontFamily: NationalPark.bold,
    fontSize: 22,
    color: TEXT_DARK,
    letterSpacing: 1,
    textAlign: "center",
  },
  creatureSub: {
    fontFamily: SFPro.medium,
    fontSize: 13,
    color: TEXT_DARK,
    textAlign: "center",
    marginBottom: 14,
  },
  statRow: {
    gap: 6,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontFamily: NationalPark.bold,
    fontSize: 11,
    color: TEXT_DARK,
    width: 32,
    letterSpacing: 1,
  },
  statBarTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E5F4FF",
    borderWidth: 2,
    borderColor: TEXT_DARK,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
  },
  statValue: {
    fontFamily: NationalPark.bold,
    fontSize: 12,
    color: TEXT_DARK,
    width: 22,
    textAlign: "right",
  },
  divider: {
    height: 2,
    backgroundColor: TEXT_DARK,
    borderStyle: "dashed",
    marginVertical: 14,
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: TEXT_DARK,
  },
  tagText: {
    fontFamily: NationalPark.bold,
    fontSize: 11,
    color: TEXT_DARK,
    letterSpacing: 0.5,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
});
