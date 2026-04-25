import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import CloseIcon from "@/assets/images/new-design/notification/close-icon.svg";
import { SFPro } from "@/constants/theme";
import { VM_ICONS } from "@/constants/vm-icons";
import { orderVmUrls, useNavbar } from "@/contexts/navbar-context";
import { removeUrl } from "@/store/url-store";
import { removeVmMetadata, setVmMetadata } from "@/store/vm-metadata-store";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.88;
const CLOSE_THRESHOLD = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
  machineUrl: string;
  initialName: string;
  initialIconIndex: number;
};

export function EditMachineSlider({
  visible,
  onClose,
  machineUrl,
  initialName,
  initialIconIndex,
}: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const [machineName, setMachineName] = useState(initialName);
  const [selectedIconIndex, setSelectedIconIndex] = useState(initialIconIndex);

  const { vmUrls, setVmUrls, primaryVmUrl } = useNavbar();

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
      setMachineName(initialName);
      setSelectedIconIndex(initialIconIndex);
      open();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

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

  const handleSave = useCallback(async () => {
    if (!machineName.trim()) return;
    Keyboard.dismiss();
    await setVmMetadata(machineUrl, {
      name: machineName.trim(),
      iconIndex: selectedIconIndex,
    });
    close();
  }, [machineName, machineUrl, selectedIconIndex, close]);

  const handleDelete = useCallback(async () => {
    await removeUrl(machineUrl);
    await removeVmMetadata(machineUrl);
    setVmUrls(orderVmUrls(vmUrls.filter((u) => u !== machineUrl), primaryVmUrl));
    close();
  }, [machineUrl, vmUrls, primaryVmUrl, setVmUrls, close]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Close button */}
        <TouchableOpacity onPress={close} style={styles.closeButton} hitSlop={8}>
          <CloseIcon />
        </TouchableOpacity>

        {/* Drag handle */}
        <View style={styles.dragArea} {...panResponder.panHandlers}>
          <View style={styles.dragger} />
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }}>
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Edit this machine</Text>
                <Text style={styles.headerSubtitle}>Change the icon or rename</Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.iconSelectorContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {VM_ICONS.map((IconComp, index) => {
                    const isSelected = selectedIconIndex === index;
                    return (
                      <View key={index} style={styles.iconWrapper}>
                        <TouchableOpacity
                          style={[styles.iconItem, isSelected && styles.iconItemSelected]}
                          onPress={() => {
                            Keyboard.dismiss();
                            setSelectedIconIndex(index);
                          }}
                          activeOpacity={0.8}
                        >
                          {isSelected ? (
                            <View style={styles.iconInnerCircle}>
                              <IconComp width={60} height={60} />
                            </View>
                          ) : (
                            <IconComp width={44} height={44} />
                          )}
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>

                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={styles.nameInput}
                    value={machineName}
                    onChangeText={setMachineName}
                    textAlign="center"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <Text style={styles.nameLabel}>NAME</Text>
                </View>
              </ScrollView>

              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.saveButton,
                    machineName.trim() ? styles.saveButtonActive : styles.saveButtonInactive,
                  ]}
                  onPress={handleSave}
                  activeOpacity={machineName.trim() ? 0.85 : 1}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
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
    height: SHEET_HEIGHT,
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
    borderRadius: 296,
    backgroundColor: "#EBEBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragger: {
    width: 36,
    height: 5,
    borderRadius: 100,
    backgroundColor: "#CCC",
    mixBlendMode: "plus-darker" as any,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: SFPro.bold,
    fontSize: 22,
    lineHeight: 27,
    color: "#000",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: SFPro.regular,
    fontSize: 14,
    lineHeight: 20,
    color: "#888",
    letterSpacing: -0.2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 28,
  },
  iconSelectorContent: {
    paddingVertical: 8,
    gap: 4,
  },
  iconWrapper: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  iconItem: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "transparent",
    backgroundColor: "#E3FDD7",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  iconItemSelected: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: "#3D841E",
    backgroundColor: "#FFF",
  },
  iconInnerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E3FDD7",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  nameInputContainer: {
    gap: 6,
  },
  nameInput: {
    fontFamily: SFPro.semiBold,
    fontSize: 20,
    color: "#000",
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#C7C7C7",
    paddingVertical: 8,
    letterSpacing: -0.1,
  },
  nameLabel: {
    fontFamily: SFPro.medium,
    fontSize: 11,
    color: "#888",
    textAlign: "center",
    letterSpacing: 0.8,
  },
  buttonGroup: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 36,
  },
  deleteButton: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "#C44E4E",
    backgroundColor: "#841E1E",
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },
  saveButton: {
    borderRadius: 50,
    borderWidth: 2,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonActive: {
    borderColor: "#72C44E",
    backgroundColor: "#3D841E",
  },
  saveButtonInactive: {
    borderColor: "#808080",
    backgroundColor: "#9F9F9F",
  },
  saveButtonText: {
    fontFamily: SFPro.semiBold,
    fontSize: 16,
    color: "#FFF",
    letterSpacing: -0.3,
  },
});
