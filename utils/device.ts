import { Dimensions, Platform } from 'react-native';

export const isIPad = Platform.OS === 'ios' && Platform.isPad;
export const isIPhone = Platform.OS === 'ios' && !Platform.isPad;

const { width, height } = Dimensions.get('window');
const shortestSide = Math.min(width, height);

// Android tablets follow the sw600dp convention (shortest side >= 600dp).
export const isAndroidTablet = Platform.OS === 'android' && shortestSide >= 600;

// Single source of truth for screens that should branch into a multi-pane /
// roomy layout regardless of platform.
export const isLargeScreen = isIPad || isAndroidTablet;
