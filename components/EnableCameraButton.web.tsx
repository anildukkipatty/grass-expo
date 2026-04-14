import React from "react";
import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

type Props = {
  onPress: () => void;
  label?: string;
  style: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
};

/**
 * Real HTML <button> so iOS Safari / PWA treat the tap as a trusted user activation for
 * getUserMedia. React Native touchables inside bottom sheets often do not.
 */
export function EnableCameraButton({
  onPress,
  label = "Enable Camera",
  style,
  textStyle,
}: Props) {
  const merged = StyleSheet.flatten([style, textStyle]) as React.CSSProperties;
  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        ...merged,
      }}
    >
      {label}
    </button>
  );
}
