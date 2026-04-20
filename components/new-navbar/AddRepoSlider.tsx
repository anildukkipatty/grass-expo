import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { SFPro } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function AddRepoSlider({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [repoUrl, setRepoUrl] = useState("");

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
    Keyboard.dismiss();
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
      setRepoUrl("");
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

      <KeyboardAvoidingView
        style={styles.kavContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        pointerEvents="box-none"
      >
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <LinearGradient
            colors={["#FFF", "#fff"]}
            locations={[0.2862, 0.7975, 1]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Drag handle */}
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.dragger} />
          </View>

          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <View>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <Text style={styles.headerTitle}>Add a repository</Text>
                  <Text style={styles.headerSubtitle}>
                    Paste a Git clone URL. No login needed for public repos.
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={close}
                  style={styles.closeButton}
                  hitSlop={8}
                >
                  <CloseIcon />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <View style={styles.content}>
                <View style={styles.urlCard}>
                  <Text style={styles.inputLabel}>Repository URL</Text>
                  <TextInput
                    style={styles.input}
                    value={repoUrl}
                    onChangeText={setRepoUrl}
                    placeholder="Paste link here"
                    placeholderTextColor="#B0B0B0"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  <TouchableOpacity
                    style={[
                      styles.button,
                      !repoUrl.trim() && styles.buttonDisabled,
                    ]}
                    activeOpacity={0.85}
                    disabled={!repoUrl.trim()}
                  >
                    <Text style={styles.buttonText}>Clone now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.80)",
  },
  kavContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    width: "100%",
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: "#FFF",
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 28,
    lineHeight: 31,
    color: "#000",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 15,
    lineHeight: 20,
    color: "#808080",
    letterSpacing: -0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 294,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  closeX: {
    fontSize: 13,
    color: "#666",
    lineHeight: 16,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  urlCard: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#FFF",
    padding: 14,
    gap: 8,
  },
  inputLabel: {
    fontFamily: SFPro.bold,
    fontSize: 17,
    color: "#000",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DFDFDF",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "DM Mono",
    fontSize: 15,
    color: "#000",
  },
  button: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 17,
    color: "#fff",
    letterSpacing: -0.5,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerNote: {
    fontFamily: SFPro.regular,
    fontSize: 13,
    color: "#888",
    letterSpacing: -0.2,
    lineHeight: 18,
  },
});
