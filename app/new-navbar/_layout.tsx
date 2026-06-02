import { NavbarProvider } from "@/contexts/navbar-context";
import { router, Stack } from "expo-router";
import React from "react";

export default function NewNavbarLayout() {
  return (
    <NavbarProvider>
      <Stack
        screenOptions={{ headerShown: false, animation: "slide_from_right" }}
      >
        {/* Header is driven dynamically from (tabs)/_layout via the parent
            navigator — native iOS header with a glass account button + centered logo. */}
        <Stack.Screen name="(tabs)" />
        {/* Settings keeps the native header from the tabs: the glass account
            button morphs into a glass back arrow and the logo into the page
            title. Slides in from the left (account button lives on the left). */}
        <Stack.Screen
          name="settings"
          options={{
            headerShown: true,
            title: "Settings & Profile",
            headerTitleAlign: "center",
            animation: "slide_from_left",
            headerStyle: { backgroundColor: "#FFFFFF" },
            headerShadowVisible: false,
            unstable_headerLeftItems: () => [
              {
                type: "button",
                label: "Back",
                icon: { type: "sfSymbol", name: "chevron.backward" },
                onPress: () => router.back(),
              },
            ],
          }}
        />
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
