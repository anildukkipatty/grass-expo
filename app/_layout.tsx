import { ErrorUtils } from "react-native";

// Catch unhandled JS exceptions before they propagate to native and cause SIGABRT.
// This fires for both fatal and non-fatal errors; log them so Crashlytics / Metro
// dev tools can surface the actual message and stack.
if (ErrorUtils) {
  const _originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error(`[GlobalError] fatal=${isFatal}`, error);
    try {
      const { posthog: ph } = require("@/constants/posthog");
      ph.capture("$exception", {
        $exception_type: error?.name ?? "Error",
        $exception_message: error?.message ?? String(error),
        $exception_source: "GlobalErrorHandler",
        $exception_stack_trace_raw: error?.stack,
        is_fatal: isFatal,
      });
    } catch (_) {}
    _originalHandler(error, isFatal);
  });
}

import { GrassColors, NationalPark, DMMono } from "@/constants/theme";
import { posthog } from "@/constants/posthog";
import { PostHogProvider } from "posthog-react-native";
import { useTheme } from "@/store/theme-store";
import { getUser, setAuthErrorHandler, clearAuth } from "@/store/auth-store";
import { useFonts } from "expo-font";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";

SplashScreen.preventAutoHideAsync();

// Apply National Park as the default font for all Text and TextInput components
const DefaultText = Text as any;
if (DefaultText.defaultProps == null) DefaultText.defaultProps = {};
DefaultText.defaultProps.style = { fontFamily: NationalPark.regular };

const DefaultTextInput = TextInput as any;
if (DefaultTextInput.defaultProps == null) DefaultTextInput.defaultProps = {};
DefaultTextInput.defaultProps.style = { fontFamily: NationalPark.regular };

// Track screen views for PostHog analytics using Expo Router's pathname.
function useScreenTracking() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (pathname && pathname !== prevPathname.current) {
      posthog.screen(pathname, {
        previous_screen: prevPathname.current,
      });
      prevPathname.current = pathname;
    }
  }, [pathname]);
}

export default function RootLayout() {
  useScreenTracking();
  const router = useRouter();

  // Sign out automatically when any API call returns 401 Unauthorized.
  useEffect(() => {
    setAuthErrorHandler(async () => {
      await clearAuth();
      router.dismissAll();
      router.replace("/welcome");
    });
    return () => setAuthErrorHandler(() => {});
  }, [router]);

  // Re-identify the user on app load so PostHog links sessions correctly.
  useEffect(() => {
    getUser().then((user) => {
      if (user) {
        posthog.identify(user.id, { $set: { email: user.email } });
      }
    });
  }, []);

  const [theme] = useTheme();
  const c = GrassColors[theme];
  const [fontsLoaded] = useFonts({
    [NationalPark.extraLight]: require("../assets/fonts/National_Park/static/NationalPark-ExtraLight.ttf"),
    [NationalPark.light]: require("../assets/fonts/National_Park/static/NationalPark-Light.ttf"),
    [NationalPark.regular]: require("../assets/fonts/National_Park/static/NationalPark-Regular.ttf"),
    [NationalPark.medium]: require("../assets/fonts/National_Park/static/NationalPark-Medium.ttf"),
    [NationalPark.semiBold]: require("../assets/fonts/National_Park/static/NationalPark-SemiBold.ttf"),
    [NationalPark.bold]: require("../assets/fonts/National_Park/static/NationalPark-Bold.ttf"),
    [NationalPark.extraBold]: require("../assets/fonts/National_Park/static/NationalPark-ExtraBold.ttf"),
    [DMMono.light]: require("@expo-google-fonts/dm-mono/300Light/DMMono_300Light.ttf"),
    [DMMono.regular]: require("@expo-google-fonts/dm-mono/400Regular/DMMono_400Regular.ttf"),
    [DMMono.medium]: require("@expo-google-fonts/dm-mono/500Medium/DMMono_500Medium.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    if (Platform.OS === "web") {
      return (
        <View style={{ flex: 1, backgroundColor: "#a8d97f", justifyContent: "center", alignItems: "center" }}>
          <Image source={require("../assets/images/logo.png")} style={{ width: 170, height: 170 }} />
        </View>
      );
    }
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
      <PostHogProvider
        client={posthog}
        autocapture={{
          captureScreens: false,
          captureTouches: true,
          propsToCapture: ["testID"],
        }}
        debug={__DEV__}
      >
      <Stack
        screenOptions={{
          animation: "slide_from_right",
          headerStyle: { backgroundColor: c.barBg },
          headerTintColor: c.text,
          headerTitleStyle: { color: c.text },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: "none" }}
        />
        <Stack.Screen name="machines" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="folders" options={{ headerShown: false }} />
        <Stack.Screen name="agent-picker" options={{ headerShown: false }} />
        <Stack.Screen name="project" options={{ headerShown: false }} />
        <Stack.Screen name="sessions" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="container-setup" options={{ headerShown: false }} />
        <Stack.Screen name="push-commit" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen
          name="diffs"
          options={{
            title: "Diffs",
            animation: "fade_from_bottom",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="get-more"
          options={{
            headerShown: false,
            animation: "fade",
          }}
        />
      </Stack>
      </PostHogProvider>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
