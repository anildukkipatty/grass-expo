import { Image } from "expo-image";
import React, { useCallback, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from "@gorhom/bottom-sheet";
import { Easing } from "react-native-reanimated";

import { AddRepoSlider } from "./AddRepoSlider";
import { ConfigureGitAccessSlider } from "./ConfigureGitAccessSlider";
import { ConnectLaptopSlider } from "./ConnectLaptopSlider";
import { ConnectOwnAgentSlider } from "./ConnectOwnAgentSlider";

import AppleIcon from "@/assets/images/new-design/connect-more/apple.svg";
import BulbIcon from "@/assets/images/new-design/connect-more/bulb.svg";
import ClaudeIcon from "@/assets/images/new-design/connect-more/claude.svg";
import GitLabIcon from "@/assets/images/new-design/connect-more/gitLab.svg";
import GithubIcon from "@/assets/images/new-design/connect-more/github.svg";
import LinuxIcon from "@/assets/images/new-design/connect-more/linux.svg";
import OpenCodeIcon from "@/assets/images/new-design/connect-more/open-code.svg";
import WindowsIcon from "@/assets/images/new-design/connect-more/windows.svg";
import { SFPro } from "@/constants/theme";

type CardProps = {
  title: string;
  subtitle: string;
  footerText?: string;
  footerIcons: React.ReactNode;
  image?: ReturnType<typeof require>;
  style?: object;
};

function ConnectCard({
  title,
  subtitle,
  footerText,
  footerIcons,
  image,
  style,
}: CardProps) {
  return (
    <View style={[styles.card, style]}>
      {image ? (
        <View style={styles.cardTopWithImage}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.cardTitle}>{title}</Text>
            <View style={styles.subtitleRow}>
              <BulbIcon width={18} height={18} />
              <Text style={styles.subtitleText}>{subtitle}</Text>
            </View>
          </View>
          <Image
            source={image}
            style={styles.cardImage}
            contentFit="cover"
            contentPosition={{ right: 0 }}
          />
        </View>
      ) : (
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle}>{title}</Text>
          <View style={styles.subtitleRow}>
            <BulbIcon width={18} height={18} />
            <Text style={styles.subtitleText}>{subtitle}</Text>
          </View>
        </View>
      )}
      <View style={styles.cardBottom}>
        <View style={styles.footerIcons}>{footerIcons}</View>
        <Text style={styles.footerText}>{footerText}</Text>
      </View>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function ConnectMoreSlider({ visible, onClose }: Props) {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [ownAgentVisible, setOwnAgentVisible] = useState(false);
  const [laptopVisible, setLaptopVisible] = useState(false);
  const [addRepoVisible, setAddRepoVisible] = useState(false);
  const [gitAccessVisible, setGitAccessVisible] = useState(false);

  const snapPoints = ["90%"];
  const animationConfigs = useBottomSheetTimingConfigs({
    duration: 300,
    easing: Easing.out(Easing.cubic),
  });
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  return (
    <>
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        animationConfigs={animationConfigs}
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.dragHandle}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Get more from grass</Text>
            <Text style={styles.headerSubtitle}>
              All optional. Set up whenever you&#39;re ready.
            </Text>
          </View>
        </View>

        <BottomSheetScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <TouchableOpacity
            onPress={() => setOwnAgentVisible(true)}
            activeOpacity={0.85}
          >
            <ConnectCard
              title={"Connect your\nown agent"}
              subtitle={"Used by 95%\nGrass users"}
              footerText={"We are working on\nsupporting more agents"}
              image={require("@/assets/images/new-design/connect-more/own-agent.png")}
              footerIcons={
                <>
                  <ClaudeIcon
                    width={16}
                    height={16}
                    style={{ marginRight: -8, marginTop: -10 }}
                  />
                  <OpenCodeIcon width={30} height={30} />
                </>
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLaptopVisible(true)}
            activeOpacity={0.85}
          >
            <ConnectCard
              title={"Connect your\nLaptop"}
              subtitle={"Your machine,\nyour rules"}
              footerText={"Your code never leaves\nyour machine."}
              image={require("@/assets/images/new-design/connect-more/laptop.png")}
              footerIcons={
                <>
                  <AppleIcon
                    width={30}
                    height={30}
                    style={{ marginRight: -14 }}
                  />
                  <WindowsIcon
                    width={30}
                    height={30}
                    style={{ marginRight: -14 }}
                  />
                  <LinuxIcon width={30} height={30} />
                </>
              }
            />
          </TouchableOpacity>

          <View style={styles.halfRow}>
            <TouchableOpacity
              style={styles.halfCardWrapper}
              onPress={() => setAddRepoVisible(true)}
              activeOpacity={0.85}
            >
              <ConnectCard
                title={"Add a\nrepository"}
                subtitle={"Agents need a\nrepo to work on"}
                // footerText={"GitHub and GitLab\nsupported"}
                style={{ flex: 1 }}
                footerIcons={
                  <>
                    <GithubIcon
                      width={30}
                      height={30}
                      style={{ marginRight: -14 }}
                    />
                    <GitLabIcon width={30} height={30} />
                  </>
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.halfCardWrapper}
              onPress={() => setGitAccessVisible(true)}
              activeOpacity={0.85}
            >
              <ConnectCard
                title={"Configure\nGit Access"}
                subtitle={"GitHub OAuth\nfor your VM"}
                style={{ flex: 1 }}
                footerIcons={<GithubIcon width={30} height={30} />}
              />
            </TouchableOpacity>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>

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
    </>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFF",
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  headerText: {
    gap: 8,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 32,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    lineHeight: 20,
    color: "#808080",
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    overflow: "hidden",
    justifyContent: "space-between",
  },
  cardTop: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#FFF",
    gap: 8,
  },
  cardTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    lineHeight: 26,
    color: "#000",
    letterSpacing: -0.4,
  },
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subtitleText: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  cardBottom: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    // paddingVertical: 12,
    backgroundColor: "#f2f2f2",
  },
  footerIcons: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  halfRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfCardWrapper: {
    flex: 1,
  },
  cardTopWithImage: {
    flexDirection: "row",
    paddingLeft: 16,
    // paddingTop: 18,
    // paddingBottom: 14,
    backgroundColor: "#FFF",
    gap: 8,
    height: 140,
    overflow: "hidden",
  },
  cardTopLeft: {
    paddingVertical: 16,
    flex: 1,
    justifyContent: "space-between",
  },
  cardImage: {
    flex: 1,
    height: "100%",
  },
  footerText: {
    fontFamily: SFPro.semiBold,
    fontSize: 12,
    color: "#b2b2b2",
    textAlign: "right",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
});
