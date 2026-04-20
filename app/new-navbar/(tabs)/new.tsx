import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { NewChatSlider } from "@/components/new-navbar/NewChatSlider";

export default function NewTab() {
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => setVisible(false);
    }, []),
  );

  const handleClose = () => {
    setVisible(false);
    router.navigate("/new-navbar/");
  };

  return (
    <View style={styles.container}>
      <NewChatSlider visible={visible} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
