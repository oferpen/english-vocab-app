/**
 * Export words from database to JSON file
 * Usage: npx tsx scripts/export-words.ts [output-file] [database-url]
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

const outputFile = process.argv[2] || 'words-export.json';
const dbUrl = process.argv[3] || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ Please provide DATABASE_URL');
  process.exit(1);
}

async function exportWords() {
  console.log(`📊 Exporting words from database...`);
  console.log(`   Output: ${outputFile}`);
  if (dbUrl) {
    console.log(`   Database: ${dbUrl.replace(/:[^:@]+@/, ':****@')}\n`);
  }

  // Temporarily override DATABASE_URL
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = dbUrl;

  const prisma = new PrismaClient();

  try {
    const words = await prisma.word.findMany({
      orderBy: [
        { category: 'asc' },
        { difficulty: 'asc' },
        { englishWord: 'asc' },
      ],
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      total: words.length,
      words: words.map(w => ({
        englishWord: w.englishWord,
        hebrewTranslation: w.hebrewTranslation,
        category: w.category || 'Uncategorized',
        difficulty: w.difficulty,
        active: w.active,
        exampleEn: w.exampleEn,
        exampleHe: w.exampleHe,
      })),
    };

    writeFileSync(outputFile, JSON.stringify(exportData, null, 2));
    console.log(`✅ Exported ${words.length} words to ${outputFile}`);

    // Show summary
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};

    words.forEach(w => {
      const cat = w.category || 'Uncategorized';
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      byDifficulty[w.difficulty] = (byDifficulty[w.difficulty] || 0) + 1;
    });

    console.log('\n📊 Summary:');
    console.log(`   Categories: ${Object.keys(byCategory).length}`);
    console.log(`   Difficulties: ${Object.keys(byDifficulty).join(', ')}`);
    console.log(`\n   Colors category:`);
    const colorsWords = words.filter(w => w.category === 'Colors');
    console.log(`     Total: ${colorsWords.length}`);
    console.log(`     Difficulty 1: ${colorsWords.filter(w => w.difficulty === 1).length}`);
    console.log(`     Difficulty 2+: ${colorsWords.filter(w => w.difficulty >= 2).length}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
  }
}

exportWords();
