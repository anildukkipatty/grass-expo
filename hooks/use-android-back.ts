import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

// Wires an Android hardware-back handler. The handler should return `true` to
// indicate the press was consumed (preventing default navigation/exit) or
// `false` to let the platform handle it.
//
// On iOS this is a no-op. Pass `enabled = false` to temporarily disable a
// handler without unmounting its host component.
export function useAndroidBack(handler: () => boolean, enabled: boolean = true): void {
  useEffect(() => {
    if (Platform.OS !== 'android' || !enabled) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    return () => sub.remove();
  }, [handler, enabled]);
}
