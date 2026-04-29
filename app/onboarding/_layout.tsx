import { Stack } from "expo-router";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="claim" />
      <Stack.Screen name="vm-ready" />
      <Stack.Screen name="vm-name" />
      <Stack.Screen name="vm-final" />
      <Stack.Screen name="vm-first-task" />
    </Stack>
  );
}
