/**
 * Custom Metro minifier — runs javascript-obfuscator on the production bundle.
 * Replaces Terser so identifier/string obfuscation applies across the whole bundle.
 * Only invoked by Metro when building in production mode (expo export).
 */
const JavaScriptObfuscator = require('javascript-obfuscator');

module.exports = async function obfuscate({ code, reserved = [] }) {
  const result = JavaScriptObfuscator.obfuscate(code, {
    // Compact output (strip whitespace)
    compact: true,

    // Rename local identifiers to _0xXXXXXX hex strings
    identifierNamesGenerator: 'hexadecimal',

    // Don't touch top-level globals (require, exports, __DEV__, etc.)
    renameGlobals: false,

    // Reserved Metro/RN globals that must never be renamed
    reservedNames: [
      '__d', '__r', '__c', 'require', 'module', 'exports',
      '__DEV__', '__BUNDLE_START_TIME__', '__METRO_GLOBAL_PREFIX__',
      ...reserved,
    ],

    // Collect all string literals into an encoded array → strings can't be grepped
    stringArray: true,
    stringArrayEncoding: ['rc4'],   // rc4 is self-contained, no atob needed
    stringArrayThreshold: 0.8,
    rotateStringArray: true,
    shuffleStringArray: true,
    splitStrings: false,            // keep bundle size reasonable

    // Light control-flow obfuscation (safe, low overhead)
    controlFlowFlattening: false,

    // Don't inject dead code (would bloat the bundle)
    deadCodeInjection: false,

    // Self-defending can break eval-less environments like Hermes
    selfDefending: false,

    // Keep console.* intact (helps debug prod crashes)
    disableConsoleOutput: false,

    // Target browser-no-eval: safe for both web and Hermes/JSC
    target: 'browser-no-eval',

    // Let Metro handle source maps
    sourceMap: false,
  });

  return {
    code: result.getObfuscatedCode(),
    map: '',
  };
};
