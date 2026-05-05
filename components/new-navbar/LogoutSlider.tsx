import { router } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { posthog } from "@/constants/posthog";
import { SFPro } from "@/constants/theme";
import { clearAuth } from "@/store/auth-store";
import { unregisterPushTokenOnLogout } from "@/hooks/use-push-notifications";
import { closeConnection, getConnectedUrls } from "@/store/connection-store";
import { clearUrls } from "@/store/url-store";
import { clearAllVmMetadata } from "@/store/vm-metadata-store";

import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import LogoutIcon from "@/assets/images/new-design/settings/logout.svg";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LogoutSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

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

  const handleLogout = async () => {
    posthog.capture("user_logged_out");
    posthog.reset();
    const connectedUrls = getConnectedUrls();
    connectedUrls.forEach((url) => closeConnection(url));
    await clearUrls();
    await clearAllVmMetadata();
    await unregisterPushTokenOnLogout();
    await clearAuth();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      router.dismissAll();
      router.replace("/onboarding");
    });
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
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
        </View>

        <TouchableOpacity
          onPress={close}
          style={styles.closeButton}
          hitSlop={8}
        >
          <CloseIcon />
        </TouchableOpacity>

        <View style={styles.content}>
          <View style={styles.iconOuter}>
            <View style={styles.iconInner}>
              <LogoutIcon
                width={34}
                height={34}
                fill="#FFF"
                // stroke="#B25959"
                strokeWidth={2}
              />
            </View>
          </View>

          <Text style={styles.title}>Log out?</Text>
          <Text style={styles.description}>
            You&#39;ll need to sign in again to access your{"\n"}machines and
            sessions.
          </Text>
          <View style={styles.notePill}>
            <Text style={styles.noteText}>
              Running agents will keep going in the background.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={close}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.80)",
    backdropFilter: "blur(5px)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 294,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 4,
    marginBottom: 50,
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
    // mix-blend-mode not supported in RN; approximated with opacity on dark bg
    opacity: 0.9,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 12,
    gap: 14,
  },
  iconOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFF",
    borderWidth: 4,
    borderColor: "#B25959",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#630D0D",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 18,
    marginBottom: 4,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    // backgroundColor: "#FFF5F5",
    // borderWidth: 3,
    // borderColor: "#B25959",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontFamily: SFPro.bold,
    fontSize: 34,
    color: "#000",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  description: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#606060",
    textAlign: "center",
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  notePill: {
    backgroundColor: "#f2f2f2",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderColor: "#dfdfdf",
    borderWidth: 1,
  },
  noteText: {
    fontFamily: SFPro.semiBold,
    fontSize: 13,
    color: "#808080",
    textAlign: "center",
  },
  logoutBtn: {
    width: "100%",
    borderRadius: 50,
    backgroundColor: "#FF3B30",
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 47,
  },
  logoutBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#FFF",
    letterSpacing: -0.3,
  },
  cancelBtn: {
    width: "100%",
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#3D841E",
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#3D841E",
    letterSpacing: -0.3,
  },
});
