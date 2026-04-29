import { useIsFocused } from "@react-navigation/native";
import { useEffect, useRef } from "react";
import { Animated } from "react-native";

/**
 * Returns an Animated.Value pre-wired to fade in (0 → 1) with a slight
 * upward translate whenever this tab screen comes into focus, and reset
 * instantly when it leaves focus so the next entry always animates fresh.
 *
 * Usage:
 *   const { opacity, translateY } = useTabFadeIn();
 *   <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
 */
export function useTabFadeIn(duration = 500, slideOffset = 8) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideOffset)).current;

  useEffect(() => {
    if (isFocused) {
      opacity.setValue(0);
      translateY.setValue(slideOffset);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused]);

  return { opacity, translateY };
}
