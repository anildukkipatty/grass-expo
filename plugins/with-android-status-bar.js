// Expo config plugin: ensures the Android `AppTheme` declares a transparent,
// translucent status bar so the JS-side `<StatusBar>` can drive its color.
// Without this, prebuild regenerates styles.xml with the default opaque bar
// (or, in older snapshots, a hardcoded green that doesn't match the brand).
//
// Registered in app.json's plugins array as "./plugins/with-android-status-bar".

const { withAndroidStyles, AndroidConfig } = require('@expo/config-plugins');

const TRANSPARENT = '@android:color/transparent';

const withAndroidStatusBarTranslucent = (config) => {
  return withAndroidStyles(config, (modConfig) => {
    modConfig.modResults = AndroidConfig.Styles.assignStylesValue(
      modConfig.modResults,
      {
        add: true,
        parent: { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' },
        name: 'android:statusBarColor',
        value: TRANSPARENT,
      },
    );
    modConfig.modResults = AndroidConfig.Styles.assignStylesValue(
      modConfig.modResults,
      {
        add: true,
        parent: { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' },
        name: 'android:windowTranslucentStatus',
        value: 'true',
      },
    );
    return modConfig;
  });
};

module.exports = withAndroidStatusBarTranslucent;
