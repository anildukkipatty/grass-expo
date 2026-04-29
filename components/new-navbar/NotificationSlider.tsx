import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import GitBranchIcon from "@/assets/images/new-design/navbar/git-branch-icon.svg";
import CLoseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import RedCircle from "@/assets/images/new-design/notification/red-circle.svg";
import RedFilledCircle from "@/assets/images/new-design/notification/red-fiolled-circle.svg";
import YellowCircle from "@/assets/images/new-design/notification/yellow-circle.svg";
import YellowFilledCircle from "@/assets/images/new-design/notification/yellow-filled-circle.svg";
import RightArrowIcon from "@/assets/images/new-design/onboarding/right-arrow-head.svg";
import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SLIDER_HEIGHT = SCREEN_HEIGHT * 0.85;
const CLOSE_THRESHOLD = 80;

type NotificationType = "red" | "yellow";

type Notification = {
  id: string;
  repo: string;
  branch: string;
  message: string;
  time: string;
  read: boolean;
  type: NotificationType;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    repo: "grass-welcome",
    branch: "main",
    message: "Your auth refactor is done. 847 lines changed across 12 files.",
    time: "23 min ago",
    read: false,
    type: "yellow",
  },
  {
    id: "2",
    repo: "grass-welcome",
    branch: "main",
    message: "Build failed. Fixed 3 errors, 1 unresolved.",
    time: "1h ago",
    read: false,
    type: "red",
  },
  {
    id: "3",
    repo: "myapp",
    branch: "main",
    message: "Build failed. TypeError in api/auth.ts line 42.",
    time: "14m ago",
    read: true,
    type: "red",
  },
  {
    id: "4",
    repo: "myapp",
    branch: "prod",
    message: "Deployed v2.4.1 successfully. Zero downtime.",
    time: "14m ago",
    read: true,
    type: "yellow",
  },
  {
    id: "5",
    repo: "grass-welcome",
    branch: "main",
    message: "Your auth refactor is done. 847 lines changed across 12 files.",
    time: "23 min ago",
    read: false,
    type: "yellow",
  },
  {
    id: "6",
    repo: "grass-welcome",
    branch: "main",
    message: "Build failed. Fixed 3 errors, 1 unresolved.",
    time: "1h ago",
    read: true,
    type: "red",
  },
];

function StatusIcon({ type, read }: { type: NotificationType; read: boolean }) {
  if (type === "red") {
    return read ? (
      <RedCircle width={12} height={12} />
    ) : (
      <RedFilledCircle width={12} height={12} />
    );
  }
  return read ? (
    <YellowCircle width={12} height={12} />
  ) : (
    <YellowFilledCircle width={12} height={12} />
  );
}

function NotificationItem({ item }: { item: Notification }) {
  return (
    <View style={[styles.item, !item.read && styles.itemUnread]}>
      <View style={styles.itemMeta}>
        <StatusIcon type={item.type} read={item.read} />
        <Text style={styles.metaRepo}>{item.repo}</Text>
        <Text style={styles.metaDot}>·</Text>
        <GitBranchIcon width={16} height={16} />
        <Text style={styles.metaBranch}>{item.branch}</Text>
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemMessage} numberOfLines={3}>
          {item.message}
        </Text>
        <RightArrowIcon width={20} height={20} />
      </View>
      <Text style={styles.itemTime}>{item.time}</Text>
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function NotificationSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SLIDER_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [extraNotifs, setExtraNotifs] = useState<Notification[]>([]);

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
        toValue: SLIDER_HEIGHT,
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
      translateY.setValue(SLIDER_HEIGHT);
      open();
      AsyncStorage.getItem("@grass/coming_soon_notifications").then((raw) => {
        if (!raw) return;
        const stored: Array<{ id: string; featureName: string; message: string; time: string }> =
          JSON.parse(raw);
        setExtraNotifs(
          stored.map((n) => ({
            id: `cs_${n.id}`,
            repo: n.featureName,
            branch: "coming soon",
            message: n.message,
            time: n.time,
            read: false,
            type: "yellow" as NotificationType,
          })),
        );
      });
    }
  }, [visible, open, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          translateY.setValue(gs.dy);
        }
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
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
        />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <LinearGradient
          colors={["#FFF", "rgba(255,255,255,0.90)", "rgba(255,255,255,0.00)"]}
          locations={[0.2862, 0.7975, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
          <Text style={styles.title}>Notifications</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={close}>
            <CLoseIcon />
          </TouchableOpacity>
        </View>

        <FlatList
          data={[...extraNotifs, ...MOCK_NOTIFICATIONS]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>
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
    height: SLIDER_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    position: "relative",
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
    marginBottom: 12,
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 22,
    color: "#000",
    letterSpacing: -0.5,
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    top: 12,
    width: 44,
    height: 44,
    borderRadius: 296,
    backgroundColor: "#E5E5EA",
    justifyContent: "center",
    alignItems: "center",
  },

  listContent: {
    paddingBottom: 40,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#DFDFDF",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  itemUnread: {
    backgroundColor: "#F2F2F2",
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaRepo: {
    fontFamily: SFPro.medium,
    fontSize: 15,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  metaDot: {
    fontSize: 25,
    color: "#8E8E93",
  },
  metaBranch: {
    fontFamily: SFPro.regular,
    color: "#808080",
    lineHeight: 20,
    letterSpacing: -0.5,
  },
  itemBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  itemMessage: {
    flex: 1,
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#000",
    lineHeight: 22,
    letterSpacing: -0.5,
  },
  itemTime: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#808080",
  },
});
