/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const GrassColors = {
  light: {
    bg: 'rgb(245, 245, 247)',
    text: '#111118',
    barBg: '#f7f7f7',
    border: '#e2e2e8',
    userBubble: '#DCF8C6',
    userBubbleText: '#1a3a1a',
    userBubbleBorder: '#8CBB67',
    assistantBubble: '#ffffff',
    assistantBubbleText: '#111118',
    errorBubble: '#fff0f2',
    errorText: '#d63031',
    accent: '#5b4af7',
    accentSoft: '#ede9fe',
    badgeText: '#9999aa',
    inputBg: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.06)',
  },
  dark: {
    bg: '#0e0e12',
    text: '#e8e8f0',
    barBg: '#17171f',
    border: '#2a2a38',
    userBubble: '#5b4af7',
    userBubbleText: '#ffffff',
    userBubbleBorder: 'transparent',
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

export const DMMono = {
  light:   'DMMono_300Light',
  regular: 'DMMono_400Regular',
  medium:  'DMMono_500Medium',
} as const;

export const NationalPark = {
  extraLight: 'NationalPark-ExtraLight',
  light:      'NationalPark-Light',
  regular:    'NationalPark-Regular',
  medium:     'NationalPark-Medium',
  semiBold:   'NationalPark-SemiBold',
  bold:       'NationalPark-Bold',
  extraBold:  'NationalPark-ExtraBold',
} as const;

// SF Mono is Apple-proprietary; on Android we fall back to the system monospace
// alias (Droid Sans Mono / Roboto Mono on newer devices).
export const SFMono = Platform.select({
  ios: {
    regular:  'SFMono-Regular',
    medium:   'SFMono-Medium',
    semiBold: 'SFMono-Semibold',
    bold:     'SFMono-Bold',
  },
  default: {
    regular:  'monospace',
    medium:   'monospace',
    semiBold: 'monospace',
    bold:     'monospace',
  },
}) as { regular: string; medium: string; semiBold: string; bold: string };

// SF Pro is Apple-proprietary. On Android we map to the system Roboto aliases
// so no extra font files need to ship. Weight collapses: Roboto has no native
// semibold, so semiBold → medium; bold → black (closest heavy weight).
// Revisit (open question) with screenshots if any specific screen looks off.
export const SFPro = Platform.select({
  ios: {
    regular:        'SFProText-Regular',
    medium:         'SFProText-Medium',
    semiBold:       'SFProText-Semibold',
    bold:           'SFProText-Bold',
    condensedBold:  'SFProText-CondensedBold',
    displayRegular: 'SFProDisplay-Regular',
    displayMedium:  'SFProDisplay-Medium',
    displaySemiBold:'SFProDisplay-Semibold',
    displayBold:    'SFProDisplay-Bold',
  },
  default: {
    regular:        'sans-serif',
    medium:         'sans-serif-medium',
    semiBold:       'sans-serif-medium',
    bold:           'sans-serif-black',
    condensedBold:  'sans-serif-condensed',
    displayRegular: 'sans-serif',
    displayMedium:  'sans-serif-medium',
    displaySemiBold:'sans-serif-medium',
    displayBold:    'sans-serif-black',
  },
}) as {
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  condensedBold: string;
  displayRegular: string;
  displayMedium: string;
  displaySemiBold: string;
  displayBold: string;
};

export const Fonts = Platform.select({
  ios: {
    sans:    NationalPark.regular,
    serif:   'ui-serif',
    rounded: 'ui-rounded',
    mono:    'ui-monospace',
  },
  default: {
    sans:    NationalPark.regular,
    serif:   'serif',
    rounded: NationalPark.regular,
    mono:    'monospace',
  },
  web: {
    sans:    `'NationalPark-Regular', system-ui, -apple-system, sans-serif`,
    serif:   "Georgia, 'Times New Roman', serif",
    rounded: `'NationalPark-Regular', system-ui, sans-serif`,
    mono:    "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
