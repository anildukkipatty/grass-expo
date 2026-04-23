import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

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
import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;

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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [ownAgentVisible, setOwnAgentVisible] = useState(false);
  const [laptopVisible, setLaptopVisible] = useState(false);
  const [addRepoVisible, setAddRepoVisible] = useState(false);
  const [gitAccessVisible, setGitAccessVisible] = useState(false);

  const open = useCallback(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, backdropOpacity]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [translateY, backdropOpacity, onClose]);

  useEffect(() => {
    if (visible) {
      translateY.setValue(SCREEN_HEIGHT);
      open();
    }
  }, [visible, open, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > CLOSE_THRESHOLD || gs.vy > 0.5) {
          close();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* <LinearGradient
          colors={["#FFF", "rgba(255,255,255,0.90)", "rgba(255,255,255,0.00)"]}
          locations={[0.2862, 0.7975, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        /> */}
        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={close}
            style={styles.closeButton}
            hitSlop={8}
          >
            <CloseIcon />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Get more from grass</Text>
            <Text style={styles.headerSubtitle}>
              All optional. Set up whenever you&#39;re ready.
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
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
        </ScrollView>
      </Animated.View>

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
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.95,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
    // marginBottom: ,
    backgroundColor: "#FFF",
  },
  dragger: {
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
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: "50%",
    backgroundColor: "#f2f2f2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  // closeX: {
  //   fontSize: 13,
  //   color: "#666",
  //   lineHeight: 16,
  // },
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
