import fs from 'fs';
const content = fs.readFileSync('src/components/QuranScreen.tsx', 'utf-8');
const lines = content.split('\n');

const startIndex = lines.findIndex(l => l.startsWith('function ImageOverlay'));
const endIndex = lines.findIndex(l => l.startsWith('export function QuranScreen'));

if (startIndex !== -1 && endIndex !== -1) {
  const before = lines.slice(0, startIndex).join('\n');
  const after = lines.slice(endIndex).join('\n');
  
  const importsToAdd = `import { ImageOverlay } from './quran/ImageOverlay';\nimport { Chapter, Verse } from './quran/types';\n`;
  
  const modifiedContent = before + '\n' + importsToAdd + '\n' + after;
  fs.writeFileSync('src/components/QuranScreen.tsx', modifiedContent, 'utf-8');
  console.log('Successfully patched QuranScreen.tsx');
} else {
  console.log('Could not find boundaries: ', startIndex, endIndex);
}
