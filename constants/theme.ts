/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const GrassColors = {
  light: {
    bg: '#fafafa',
    text: '#111118',
    barBg: '#f0f0f4',
    border: '#e2e2e8',
    userBubble: '#5b4af7',
    userBubbleText: '#fff',
    assistantBubble: '#ffffff',
    assistantBubbleText: '#111118',
    errorBubble: '#fff0f2',
    errorText: '#d63031',
    accent: '#5b4af7',
    accentSoft: '#ede9fe',
    badgeText: '#9999aa',
    inputBg: '#ffffff',
    shadow: 'rgba(91, 74, 247, 0.12)',
  },
  dark: {
    bg: '#0e0e12',
    text: '#e8e8f0',
    barBg: '#17171f',
    border: '#2a2a38',
    userBubble: '#5b4af7',
    userBubbleText: '#ffffff',
    assistantBubble: '#1c1c27',
    assistantBubbleText: '#e8e8f0',
    errorBubble: '#1f0a0a',
    errorText: '#ff5f57',
    accent: '#7c6eff',
    accentSoft: '#1e1a40',
    badgeText: '#6666aa',
    inputBg: '#17171f',
    shadow: 'rgba(124, 110, 255, 0.15)',
  },
};

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
