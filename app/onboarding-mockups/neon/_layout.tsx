import { Stack } from "expo-router";

export default function NeonLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "fade" }}
    />
  );
}
