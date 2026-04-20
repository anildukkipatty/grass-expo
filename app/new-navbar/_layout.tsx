import React from "react";
import { Stack } from "expo-router";

export default function NewNavbarLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="coming-soon" />
      <Stack.Screen name="chat-list" />
    </Stack>
  );
}
