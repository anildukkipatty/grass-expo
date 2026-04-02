import { NationalPark } from "@/constants/theme";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const REPO = {
  name: "Grass/\ndemo-app",
  stars: 243,
  contributors: 322,
};

export default function PushCommitScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={["#FFFFFF", "#CCFFD9"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.inner}>
          {/* Header */}
          <Text style={styles.heading}>
            Make your first{"\n"}commit with Grass.
          </Text>
          <Text style={styles.subheading}>
            We&#39;ve loaded a live repo below. Ask the agent to make any
            change, it&#39;ll push a commit with your name on it.
          </Text>

          {/* Repo card */}
          <View style={styles.cardShadow}>
            <View style={styles.card}>
              {/* SVG card background */}
              <Image
                source={require("@/assets/images/push-commit/card-background.svg")}
                style={StyleSheet.absoluteFill}
                contentFit="fill"
              />

              {/* Top half — repo name + thumbnail */}
              <View style={styles.cardTopSection}>
                <View style={styles.repoRow}>
                  <View style={styles.repoInfo}>
                    <Text style={styles.repoName}>{REPO.name}</Text>
                  </View>
                  <Image
                    source={require("@/assets/images/push-commit/repo-image.png")}
                    style={styles.repoThumb}
                    contentFit="cover"
                    priority="high"
                  />
                </View>
              </View>

              {/* Horizontal divider */}
              <View style={styles.cardHDivider} />

              {/* Bottom half — stats */}
              <View style={styles.cardBottomSection}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Image
                      source={require("@/assets/images/push-commit/git-stars.svg")}
                      style={styles.statIcon}
                      contentFit="contain"
                    />
                    <View style={styles.statTextCol}>
                      <Text style={styles.statNumber}>{REPO.stars}</Text>
                      <Text style={styles.statLabel}>Stars</Text>
                    </View>
                  </View>
                  {/* <View style={styles.statDivider} /> */}
                  <View style={styles.statItem}>
                    <Image
                      source={require("@/assets/images/push-commit/git-contributers.svg")}
                      style={styles.statIcon}
                      contentFit="contain"
                    />
                    <View style={styles.statTextCol}>
                      <Text style={styles.statNumber}>{REPO.contributors}</Text>
                      <Text style={styles.statLabel}>Contributors</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Image
                    source={require("@/assets/images/push-commit/git.png")}
                    style={styles.gitIcon}
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          {/* Heads-up note */}
          <View style={styles.openCodeRow}>
            <Image
              source={require("@/assets/images/push-commit/open-code.svg")}
              contentFit="cover"
              style={styles.OpenCodeThumb}
            />
            <Text style={styles.note}>
              Heads up, we&#39;re running this on Open {"\n"}Code free tier.
              Connect your own Claude {"\n"}or OpenCode for the optimal
              experience.
            </Text>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push("/navbar")}
          >
            <LinearGradient
              colors={["#00FF40", "#E0FF47"]}
              locations={[0.2806, 1]}
              start={{ x: 0.17, y: 0.12 }}
              end={{ x: 0.83, y: 0.88 }}
              style={styles.commitButton}
            >
              <Text style={styles.commitButtonText}>
                Push your first commit →
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            activeOpacity={0.6}
            onPress={() => router.push("/navbar")}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },

  // Header
  heading: {
    fontFamily: NationalPark.extraBold,
    fontSize: 36,
    fontWeight: 700,
    color: "#004410",
    letterSpacing: -1,
    lineHeight: 42,
    marginBottom: 20,
  },
  subheading: {
    fontFamily: NationalPark.regular,
    fontSize: 16,
    color: "#59B26E",
    lineHeight: 21,
    marginBottom: 30,
    fontWeight: 500,
  },

  // Card
  cardShadow: {
    width: "100%",
    aspectRatio: 1.55,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    borderRadius: 16,
  },
  card: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  cardTopSection: {
    flex: 1,
    justifyContent: "center",
  },
  cardHDivider: {
    height: 1,
    backgroundColor: "#EFE5E5",
    marginHorizontal: -20,
  },
  cardBottomSection: {
    flex: 1,
    justifyContent: "center",
  },
  repoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  repoInfo: {
    flex: 1,
    paddingRight: 12,
  },
  repoName: {
    fontFamily: NationalPark.bold,
    fontSize: 24,
    fontWeight: "600",
    color: "#0D2600",
    lineHeight: 30,
  },
  repoThumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statItem: {
    flexDirection: "row",
    // alignItems: "center",
    gap: 6,
  },
  statTextCol: {
    flexDirection: "column",
  },
  statIcon: {
    width: 16,
    height: 16,
  },
  gitIcon: {
    width: 32,
    height: 32,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    fontFamily: NationalPark.bold,
  },
  statLabel: {
    fontSize: 14,
    color: "#767676",
    fontFamily: NationalPark.bold,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(13,38,0,0.12)",
  },

  openCodeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },

  OpenCodeThumb: {
    width: 44,
    height: 44,
  },
  // Note
  note: {
    fontSize: 14,
    color: "#1E9E39",
    fontFamily: NationalPark.regular,
  },

  // Buttons
  commitButton: {
    borderRadius: 63,
    borderColor: "#0C3",
    borderWidth: 1,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  commitButtonText: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "#004D13",
    fontFamily: NationalPark.bold,
  },
  skipButton: {
    borderRadius: 63,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.30)",
    borderColor: "#A8E9B8",
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#004D13",
    fontFamily: NationalPark.bold,
    paddingVertical: 10,
  },
});
