import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Linking,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { BlurView } from "expo-blur";

import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import NotifLogo from "@/assets/images/new-design/notification/logo.svg";
import LoopIcon from "@/assets/images/new-design/notification/loop.svg";
import SignalIcon from "@/assets/images/new-design/notification/signal.svg";
import NotificationIcon from "@/assets/images/new-design/settings/notify.svg";
import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;
const LAST_SHOWN_KEY = "notification_reminder_last_shown";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PREVIEW_CARDS = [
  { time: "2h ago", message: "Task complete → Shipped the landing page." },
  { time: "1h ago", message: "Claude needs input → Should I use Tailwind?" },
  {
    time: "Now",
    message:
      "Agent finished task → Refactored auth flow. 12 files changed, all passed",
  },
];

function PreviewCards() {
  const anim0 = useRef(new Animated.Value(40)).current;
  const anim1 = useRef(new Animated.Value(40)).current;
  const anim2 = useRef(new Animated.Value(40)).current;
  const op0 = useRef(new Animated.Value(0)).current;
  const op1 = useRef(new Animated.Value(0)).current;
  const op2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.spring(anim0, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(op0, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(anim1, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(op1, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(anim2, {
          toValue: 0,
          useNativeDriver: true,
          damping: 18,
          stiffness: 180,
        }),
        Animated.timing(op2, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const anims = [
    {
      translateY: anim0,
      opacity: op0,
      scale: 0.84,
      zIndex: 1,
      top: -6,
      isFront: false,
      hasBlur: false,
    },
    {
      translateY: anim1,
      opacity: op1,
      scale: 0.92,
      zIndex: 2,
      top: 30,
      isFront: false,
      hasBlur: true,
    },
    {
      translateY: anim2,
      opacity: op2,
      scale: 1,
      zIndex: 3,
      top: 70,
      isFront: true,
      hasBlur: true,
    },
  ];

  return (
    <View style={previewStyles.container}>
      {PREVIEW_CARDS.map((card, i) => {
        const { translateY, opacity, scale, zIndex, top, isFront, hasBlur } =
          anims[i];
        return (
          <Animated.View
            key={i}
            style={[
              previewStyles.card,
              isFront || hasBlur
                ? previewStyles.cardFront
                : previewStyles.cardBack,
              { transform: [{ translateY }, { scale }], opacity, zIndex, top },
            ]}
          >
            {hasBlur && (
              <BlurView
                intensity={18}
                tint="light"
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={previewStyles.logoWrap}>
              <NotifLogo width={20} height={12} />
            </View>
            <View style={previewStyles.cardText}>
              <View style={previewStyles.cardHeader}>
                <Text style={previewStyles.cardTitle}>Grass</Text>
                <Text style={previewStyles.cardTime}>{card.time}</Text>
              </View>
              <Text style={previewStyles.cardMsg} numberOfLines={2}>
                {card.message}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

const previewStyles = StyleSheet.create({
  container: {
    height: 200,
    marginHorizontal: 16,
    marginTop: 28,
  },
  card: {
    position: "absolute",
    height: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#ECECEC",
    padding: 12,
    gap: 10,
    overflow: "hidden",
  },
  cardBack: {
    backgroundColor: "rgba(0, 0, 0, 0.10)",
  },
  cardFront: {
    backgroundColor: "rgba(0, 0, 0, 0.10)",
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 14,
    color: "#000",
    letterSpacing: -0.3,
  },
  cardTime: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#606060",
  },
  cardMsg: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#3C3C43",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
});

type FeatureRowProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
};

function FeatureRow({ icon, title, subtitle }: FeatureRowProps) {
  return (
    <View style={featureStyles.row}>
      <View style={featureStyles.iconWrap}>{icon}</View>
      <View style={featureStyles.text}>
        <Text style={featureStyles.title}>{title}</Text>
        <Text style={featureStyles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#9EE67F",
    backgroundColor: "#E3FDD7",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontFamily: SFPro.medium,
    fontSize: 17,
    color: "#666",
    lineHeight: 19,
    letterSpacing: -0.2,
  },
});

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationPermissionSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [enabling, setEnabling] = useState(false);
  const [isGranted, setIsGranted] = useState<boolean | null>(null);
  const [isDenied, setIsDenied] = useState(false);
  const [notifToggle, setNotifToggle] = useState(true);

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
      Notifications.getPermissionsAsync().then(({ status }) => {
        const granted = status === "granted";
        setIsGranted(granted);
        setNotifToggle(granted);
        setIsDenied(status === "denied");
      });
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

  const handleEnable = async () => {
    if (enabling) return;

    if (isDenied) {
      Linking.openSettings();
      return;
    }

    setEnabling(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setIsGranted(true);
        setNotifToggle(true);
        setIsDenied(false);
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Grass",
            body: "You're all set! From now on you'll see your agent activity here.",
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
          },
        });
        close();
      } else {
        setIsDenied(status === "denied");
        close();
      }
    } finally {
      setEnabling(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
          <Text style={styles.sheetTitle}>Notifications</Text>
        </View>

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={close} hitSlop={8}>
          <CloseIcon />
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          bounces={false}
        >
          {isGranted ? (
            /* ── Already granted: show toggle ── */
            <View style={styles.toggleSection}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                  <NotificationIcon width={22} height={22} />
                  <Text style={styles.toggleLabel}>Push Notifications</Text>
                </View>
                <Switch
                  value={notifToggle}
                  onValueChange={(val) => {
                    if (!val) {
                      Linking.openSettings();
                    }
                    setNotifToggle(val);
                  }}
                  trackColor={{ false: "#E5E5EA", true: "#3D841E" }}
                  thumbColor="#FFF"
                />
              </View>
              <Text style={styles.toggleSubLabel}>
                Notifications are enabled. To turn them off, use the toggle
                above — it will open your device Settings.
              </Text>
            </View>
          ) : (
            <>
              {/* Preview notification cards */}
              <PreviewCards />

              {/* Intro text */}
              <View style={styles.introSection}>
                <Text style={styles.introducing}>INTRODUCING</Text>
                <Text style={styles.mainTitle}>Notifications</Text>
              </View>

              {/* Feature rows */}
              <View style={styles.features}>
                <FeatureRow
                  icon={<LoopIcon width={28} height={23} />}
                  title="Stay in the loop"
                  subtitle="Know the moment your agent finishes, stalls, or needs you."
                />
                <FeatureRow
                  icon={
                    <Image
                      source={require("@/assets/images/new-design/notification/real-time.png")}
                      style={{ width: 28, height: 28 }}
                      resizeMode="contain"
                    />
                  }
                  title="Real-time"
                  subtitle="Know the moment your agent finishes, stalls, or needs you."
                />
                <FeatureRow
                  icon={<SignalIcon width={28} height={24} />}
                  title="You pick the signal"
                  subtitle="Know the moment your agent finishes, stalls, or needs you."
                />
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[
                    styles.enableBtn,
                    enabling && styles.enableBtnDisabled,
                  ]}
                  onPress={handleEnable}
                  activeOpacity={0.85}
                >
                  <NotificationIcon width={18} height={19} fill="#FFF" />
                  <Text style={styles.enableText}>
                    {isDenied ? "Enable" : "Enable"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={close} activeOpacity={0.7}>
                  <Text style={styles.notNow}>Not now</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.92,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  sheetTitle: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
    marginTop: 15,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  content: {
    paddingBottom: 40,
    gap: 24,
  },
  introSection: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 4,
  },
  introducing: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#808080",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  mainTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    color: "#000",
    letterSpacing: -1,
  },
  features: {
    paddingHorizontal: 24,
    gap: 20,
  },
  actions: {
    paddingHorizontal: 24,
    gap: 16,
    alignItems: "center",
  },
  enableBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3D841E",
    borderRadius: 100,
    paddingVertical: 16,
    width: "100%",
  },
  enableBtnDisabled: {
    opacity: 0.6,
  },
  enableText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },
  notNow: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
  },
  toggleSection: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F9F9F9",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toggleLabel: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
  },
  toggleSubLabel: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
});

export async function shouldShowNotificationReminder(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return false;

  const raw = await AsyncStorage.getItem(LAST_SHOWN_KEY);
  if (!raw) return true;

  const last = new Date(raw).getTime();
  const now = Date.now();
  return now - last > 24 * 60 * 60 * 1000;
  // return now - last > 1000;
}

export async function markNotificationReminderShown(): Promise<void> {
  await AsyncStorage.setItem(LAST_SHOWN_KEY, new Date().toISOString());
}
