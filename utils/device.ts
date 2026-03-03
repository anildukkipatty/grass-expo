import { Platform } from 'react-native';

export const isIPad = Platform.OS === 'ios' && Platform.isPad;
export const isIPhone = Platform.OS === 'ios' && !Platform.isPad;
