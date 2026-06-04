// Drop-in replacement for `expo-haptics` that downgrades iOS-flavored
// notification haptics on Android (where they otherwise fire a single generic
// vibration). Import this anywhere we used to import expo-haptics directly:
//
//   import * as Haptics from '@/utils/haptics'
//
// API matches expo-haptics so call sites stay unchanged.

import { Platform } from 'react-native';
import * as ExpoHaptics from 'expo-haptics';

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export const selectionAsync = ExpoHaptics.selectionAsync;
export const impactAsync = ExpoHaptics.impactAsync;

export async function notificationAsync(
  type: ExpoHaptics.NotificationFeedbackType,
): Promise<void> {
  if (Platform.OS === 'android') {
    // Android's notification haptic feels identical regardless of `type`, so
    // remap to varying impact strengths that the system actually differentiates.
    if (type === ExpoHaptics.NotificationFeedbackType.Success) {
      return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Medium);
    }
    if (type === ExpoHaptics.NotificationFeedbackType.Warning) {
      return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    }
    if (type === ExpoHaptics.NotificationFeedbackType.Error) {
      return ExpoHaptics.impactAsync(ExpoHaptics.ImpactFeedbackStyle.Heavy);
    }
  }
  return ExpoHaptics.notificationAsync(type);
}
