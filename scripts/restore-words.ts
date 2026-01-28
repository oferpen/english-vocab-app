/**
 * Restore words from JSON export file
 * Usage: npx tsx scripts/restore-words.ts words-local.json
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';

const backupFile = process.argv[2] || 'words-local.json';

if (!backupFile) {
  console.error('❌ Please provide backup file path');
  process.exit(1);
}

const prisma = new PrismaClient();

async function restoreWords() {
  console.log(`📥 Restoring words from ${backupFile}...\n`);

  try {
    // Read backup file
    const backupData = JSON.parse(readFileSync(backupFile, 'utf-8'));
    const words = backupData.words || [];

    console.log(`Found ${words.length} words in backup file`);

    // Delete all existing words
    console.log('Deleting all existing words...');
    const deleted = await prisma.word.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} existing words\n`);

    // Restore words from backup
    console.log('Restoring words...');
    let restored = 0;
    let skipped = 0;

    for (const wordData of words) {
      try {
        await prisma.word.create({
          data: {
            englishWord: wordData.englishWord,
            hebrewTranslation: wordData.hebrewTranslation,
            category: wordData.category,
            difficulty: wordData.difficulty,
            active: wordData.active !== false, // Default to true if not specified
            imageUrl: wordData.imageUrl || null,
            audioUrl: wordData.audioUrl || null,
            exampleEn: wordData.exampleEn || null,
            exampleHe: wordData.exampleHe || null,
          },
        });
        restored++;
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation - word already exists
          skipped++;
        } else {
          console.error(`Error restoring ${wordData.englishWord}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Restored ${restored} words`);
    if (skipped > 0) {
      console.log(`⏭️  Skipped ${skipped} duplicate words`);
    }

    // Show summary
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<number, number> = {};
    
    words.forEach((w: any) => {
      byCategory[w.category] = (byCategory[w.category] || 0) + 1;
      byDifficulty[w.difficulty] = (byDifficulty[w.difficulty] || 0) + 1;
    });

    console.log('\n📊 Summary:');
    console.log(`   Categories: ${Object.keys(byCategory).length}`);
    console.log(`   Difficulties: ${Object.keys(byDifficulty).join(', ')}`);
    console.log(`\n   Colors category:`);
    const colorsWords = words.filter((w: any) => w.category === 'Colors');
    console.log(`     Total: ${colorsWords.length}`);
    console.log(`     Difficulty 1: ${colorsWords.filter((w: any) => w.difficulty === 1).length}`);
    console.log(`     Difficulty 2+: ${colorsWords.filter((w: any) => w.difficulty >= 2).length}`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreWords();
