const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Expo 55 omits 'web' from platforms by default, which prevents .web.js
// extension resolution (e.g. ExponentImagePicker.web.js).
if (!config.resolver.platforms.includes("web")) {
  config.resolver.platforms = [...config.resolver.platforms, "web"];
}

// Use react-native-svg-transformer so SVGs become React components
config.transformer.babelTransformerPath = require.resolve(
  "react-native-svg-transformer/expo"
);
config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== "svg"
);
config.resolver.sourceExts = [...config.resolver.sourceExts, "svg"];

module.exports = config;
