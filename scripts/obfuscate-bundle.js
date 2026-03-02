/**
 * Post-build obfuscation script.
 * Run AFTER `expo export -p web` — obfuscates the already-built JS bundles in dist/.
 *
 * Usage: node scripts/obfuscate-bundle.js
 */
const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '..', 'dist');

function findJsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return findJsFiles(full);
    if (entry.name.endsWith('.js')) return [full];
    return [];
  });
}

const files = findJsFiles(distDir);
if (files.length === 0) {
  console.error('No JS files found in dist/. Run `expo export -p web` first.');
  process.exit(1);
}

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  process.stdout.write(`Obfuscating ${rel} … `);

  const code = fs.readFileSync(file, 'utf8');

  try {
    const result = JavaScriptObfuscator.obfuscate(code, {
      compact: true,
      target: 'browser-no-eval',

      // Rename all local identifiers → _0xXXXXXX
      // renameGlobals:false protects true top-level globals (window, document, etc.)
      identifierNamesGenerator: 'hexadecimal',
      renameGlobals: false,

      // Protect Metro's module-system identifiers (they appear as local params
      // inside __d() wrappers but must never be renamed)
      reservedNames: [
        '^__d$', '^__r$', '^__c$', '^__m$',
        '^require$', '^module$', '^exports$', '^global$',
        '^_\\$\\$_REQUIRE$', '^_\\$\\$_IMPORT_DEFAULT$', '^_\\$\\$_IMPORT_ALL$',
        '^_dependencyMap$',
        '^__DEV__$', '^__BUNDLE_START_TIME__$', '^__METRO_GLOBAL_PREFIX__$',
      ],

      // Move all string literals into a shuffled/encoded array
      // → strings like "score", "checksum", "dropCount" can't be grepped
      stringArray: true,
      stringArrayEncoding: ['none'],
      stringArrayThreshold: 0.75,
      rotateStringArray: true,
      shuffleStringArray: true,
      splitStrings: false,

      // Keep these off — they generate complex helper code that can conflict
      controlFlowFlattening: false,
      deadCodeInjection: false,
      selfDefending: false,
      disableConsoleOutput: false,

      sourceMap: false,
    });

    fs.writeFileSync(file, result.getObfuscatedCode());
    console.log('done');
  } catch (err) {
    console.error(`FAILED: ${err.message}`);
    console.error('  Skipping this file — original kept intact.');
  }
}

console.log('\nObfuscation complete.');
