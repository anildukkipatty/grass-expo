/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const GrassColors = {
  light: {
    bg: '#f5f5f5',
    text: '#1a1a1a',
    barBg: '#e8e8e8',
    border: '#d0d0d0',
    userBubble: '#0066cc',
    userBubbleText: '#fff',
    assistantBubble: '#fff',
    assistantBubbleText: '#1a1a1a',
    errorBubble: '#fff0f0',
    errorText: '#cc0000',
    accent: '#0066cc',
    badgeText: '#888',
    inputBg: '#fff',
  },
  dark: {
    bg: '#1a1a2e',
    text: '#e0e0e0',
    barBg: '#16213e',
    border: '#0f3460',
    userBubble: '#0f3460',
    userBubbleText: '#e0e0e0',
    assistantBubble: '#16213e',
    assistantBubbleText: '#e0e0e0',
    errorBubble: '#3c1414',
    errorText: '#e74c3c',
    accent: '#533483',
    badgeText: '#888',
    inputBg: '#1a1a2e',
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
