const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow matter-js to be resolved correctly (it's a pure JS lib)
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
};

// Use custom obfuscating minifier for production builds.
// Only runs when Metro is in minification mode (expo export), not during dev server.
config.transformer.minifierPath = path.resolve(__dirname, 'metro-obfuscator.js');

module.exports = config;
