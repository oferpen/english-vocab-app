/**
 * Compare two word export JSON files
 * Usage: npx tsx scripts/compare-exports.ts local-words.json production-words.json
 */

import { readFileSync } from 'fs';

const localFile = process.argv[2] || 'words-local.json';
const productionFile = process.argv[3] || 'words-production.json';

function loadWords(file: string) {
  try {
    const data = JSON.parse(readFileSync(file, 'utf-8'));
    return data.words || [];
  } catch (error: any) {
    console.error(`❌ Error reading ${file}:`, error.message);
    process.exit(1);
  }
}

function createWordKey(word: { englishWord: string; category: string }): string {
  return `${word.category}:${word.englishWord}`;
}

const localWords = loadWords(localFile);
const productionWords = loadWords(productionFile);

console.log('🔍 Comparing word exports...\n');
console.log(`Local:      ${localWords.length} words`);
console.log(`Production: ${productionWords.length} words`);
console.log(`Difference: ${productionWords.length - localWords.length} words\n`);

// Create maps
const localMap = new Map(localWords.map((w: any) => [createWordKey(w), w]));
const productionMap = new Map(productionWords.map((w: any) => [createWordKey(w), w]));

// Find differences
const missingInLocal = productionWords.filter((w: any) => !localMap.has(createWordKey(w)));
const missingInProduction = localWords.filter((w: any) => !productionMap.has(createWordKey(w)));

// Colors Level 3
const localColorsLevel3 = localWords.filter((w: any) => w.category === 'Colors' && w.difficulty >= 2);
const prodColorsLevel3 = productionWords.filter((w: any) => w.category === 'Colors' && w.difficulty >= 2);

console.log('='.repeat(80));
console.log('🎨 COLORS CATEGORY - LEVEL 3 (Difficulty 2+)');
console.log('='.repeat(80));
console.log(`Local:      ${localColorsLevel3.length} words`);
console.log(`Production: ${prodColorsLevel3.length} words`);
console.log(`Difference: ${prodColorsLevel3.length - localColorsLevel3.length}`);

if (prodColorsLevel3.length > localColorsLevel3.length) {
  console.log(`\n✅ Production has ${prodColorsLevel3.length - localColorsLevel3.length} more words:`);
  prodColorsLevel3.forEach((word: any) => {
    if (!localColorsLevel3.find((w: any) => w.englishWord === word.englishWord)) {
      console.log(`   + ${word.englishWord.padEnd(20)} (${word.hebrewTranslation})`);
    }
  });
} else if (localColorsLevel3.length > prodColorsLevel3.length) {
  console.log(`\n⚠️  Local has ${localColorsLevel3.length - prodColorsLevel3.length} more words:`);
  localColorsLevel3.forEach((word: any) => {
    if (!prodColorsLevel3.find((w: any) => w.englishWord === word.englishWord)) {
      console.log(`   - ${word.englishWord.padEnd(20)} (${word.hebrewTranslation})`);
    }
  });
} else {
  console.log(`\n✓ Colors Level 3 words match!`);
}

if (missingInLocal.length > 0) {
  console.log(`\n❌ Missing in LOCAL (${missingInLocal.length} words):`);
  missingInLocal.slice(0, 20).forEach((word: any) => {
    console.log(`   - ${word.englishWord.padEnd(20)} (${word.hebrewTranslation}) | ${word.category} | Difficulty ${word.difficulty}`);
  });
  if (missingInLocal.length > 20) {
    console.log(`   ... and ${missingInLocal.length - 20} more`);
  }
}

if (missingInProduction.length > 0) {
  console.log(`\n❌ Missing in PRODUCTION (${missingInProduction.length} words):`);
  missingInProduction.slice(0, 20).forEach((word: any) => {
    console.log(`   - ${word.englishWord.padEnd(20)} (${word.hebrewTranslation}) | ${word.category} | Difficulty ${word.difficulty}`);
  });
  if (missingInProduction.length > 20) {
    console.log(`   ... and ${missingInProduction.length - 20} more`);
  }
}

if (missingInLocal.length === 0 && missingInProduction.length === 0) {
  console.log('\n✓ All words match!');
}
