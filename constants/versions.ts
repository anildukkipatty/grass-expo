import Constants from 'expo-constants';

// Version of this app binary, sourced from app.json → expo.version at build time.
export const APP_VERSION: string = Constants.expoConfig?.version ?? '0.0.0';

// Minimum server CLI version this app requires.
// Raise the floor when the app starts depending on a new server feature.
export const APP_MIN_SERVER_RANGE = '>=1.6.0';
