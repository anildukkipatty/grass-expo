import { Stack } from "expo-router";

export default function OnboardingMockupsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  );
}
