import { useTheme } from '@/store/theme-store';
import { GrassColors } from '@/constants/theme';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [theme] = useTheme();
  const c = GrassColors[theme];

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          headerStyle: { backgroundColor: c.barBg },
          headerTintColor: c.text,
          headerTitleStyle: { color: c.text },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen
          name="sessions"
          options={{ title: 'Previous threads' }}
        />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen
          name="diffs"
          options={{
            title: 'Diffs',
            animation: 'fade_from_bottom',
            presentation: 'modal',
          }}
        />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}
