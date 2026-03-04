const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow matter-js to be resolved correctly (it's a pure JS lib)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Allow wasm files for Skia Web
config.resolver.assetExts.push('wasm');

module.exports = config;
