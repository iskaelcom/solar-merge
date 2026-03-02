/**
 * Custom Metro minifier:
 *  - node_modules  → standard Terser minification (safe, no obfuscation)
 *  - src/**        → javascript-obfuscator (hides score/checksum logic)
 */
const JavaScriptObfuscator = require('javascript-obfuscator');

// Metro's built-in Terser minifier — used for node_modules
let terserMinify;
try {
  terserMinify = require('metro-minify-terser');
} catch {
  // Fallback if package path differs across Metro versions
  terserMinify = null;
}

module.exports = async function obfuscate(options) {
  const { code, map, filename = '', reserved = [] } = options;

  // ── node_modules: delegate to Terser (obfuscating RN/React internals breaks them) ──
  if (filename.includes('node_modules')) {
    if (terserMinify) return terserMinify(options);
    return { code, map: map || '' }; // last-resort: unminified but correct
  }

  // ── Our source files: obfuscate ──────────────────────────────────────────────
  try {
    const result = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      target: 'browser-no-eval',

      // Rename local identifiers → _0xXXXXXX (hides 'score', 'checksum', 'dropCount' …)
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,
      reservedNames: [
        '^__d$', '^__r$', '^__c$', '^__m$',
        '^require$', '^module$', '^exports$', '^global$',
        '^__DEV__$', '^__BUNDLE_START_TIME__$',
        ...reserved.map((r) => `^${r}$`),
      ],

      // Move string literals into a shuffled array (can't be grepped in devtools)
      stringArray: true,
      stringArrayEncoding: ['none'], // no base64/rc4 to avoid extra helper-code issues
      stringArrayThreshold: 0.8,
      rotateStringArray: true,
      shuffleStringArray: true,
      splitStrings: false,

      // Keep these off — they can corrupt Metro module wrappers
      controlFlowFlattening: false,
      deadCodeInjection: false,
      selfDefending: false,
      disableConsoleOutput: false,

      sourceMap: false,
    });

    return { code: result.getObfuscatedCode(), map: '' };
  } catch {
    // If a source file fails to obfuscate, return it unmodified rather than crash
    return { code, map: '' };
  }
};
