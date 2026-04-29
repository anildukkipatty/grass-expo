import { NavbarProvider } from "@/contexts/navbar-context";
import { Stack } from "expo-router";
import React from "react";

export default function NewNavbarLayout() {
  return (
    <NavbarProvider>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="coming-soon" options={{ headerShown: false }} />
        <Stack.Screen name="chat-list" options={{ headerShown: false }} />
        <Stack.Screen name="support" options={{ headerShown: false }} />
        <Stack.Screen name="delete-account" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="diffs" options={{ headerShown: false }} />
      </Stack>
    </NavbarProvider>
  );
}
