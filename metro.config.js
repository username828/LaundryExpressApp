const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Add `.cjs` to the list of source extensions
  config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];

  return config;
})();
