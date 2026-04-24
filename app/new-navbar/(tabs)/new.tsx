import { useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import { NewChatSlider } from "@/components/new-navbar/NewChatSlider";
import HomeScreen from "./index";

export default function NewTab() {
  const [visible, setVisible] = useState(false);
  const [sliderKey, setSliderKey] = useState(0);
  const navigation = useNavigation();
  const isVisibleRef = useRef(false);

  const openSlider = useCallback(() => {
    if (isVisibleRef.current) return;
    isVisibleRef.current = true;
    setSliderKey((k) => k + 1);
    setVisible(true);
  }, []);

  const closeSlider = useCallback(() => {
    isVisibleRef.current = false;
    setVisible(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      openSlider();
      return () => closeSlider();
    }, [openSlider, closeSlider]),
  );

  // NativeTabs may not reliably propagate focus events after a stack push/pop.
  // tabPress fires on every physical tap, ensuring the slider reopens.
  useEffect(() => {
    return navigation.addListener("tabPress" as any, openSlider);
  }, [navigation, openSlider]);

  return (
    <View style={styles.container}>
      <HomeScreen />
      <NewChatSlider key={sliderKey} visible={visible} onClose={closeSlider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
