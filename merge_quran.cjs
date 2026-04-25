const fs = require('fs');
const files = [
  'src/context/QuranContext.tsx',
  'src/components/QuranVerseLive.tsx',
  'src/components/test-native/NativeQuranBlock.tsx'
];
let out = '';
for (const f of files) {
  out += '\n// ============================================================================\n';
  out += '// FILE: ' + f + '\n';
  out += '// ============================================================================\n\n';
  out += fs.readFileSync(f, 'utf8');
}
fs.writeFileSync('QuranFlowCombined.txt', out, 'utf8');
console.log('Merged successfully.');
