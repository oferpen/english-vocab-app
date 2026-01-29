/**
 * Compare words between local and production databases
 * 
 * Usage:
 * 1. Set PRODUCTION_DATABASE_URL in .env, OR
 * 2. Pass it as argument: npx tsx scripts/compare-databases-simple.ts "postgresql://..."
 * 
 * Note: You may need to temporarily change schema.prisma provider to "postgresql" 
 * to connect to production, then change it back to "sqlite" for local development.
 */

import { PrismaClient } from '@prisma/client';

const productionUrl = process.env.PRODUCTION_DATABASE_URL || process.argv[2];

if (!productionUrl) {
  console.error('❌ Please provide PRODUCTION_DATABASE_URL');
  console.log('\nOptions:');
  console.log('1. Add to .env: PRODUCTION_DATABASE_URL="postgresql://..."');
  console.log('2. Pass as argument: npx tsx scripts/compare-databases-simple.ts "postgresql://..."');
  console.log('\n⚠️  Note: You may need to change schema.prisma provider to "postgresql" first');
  process.exit(1);
}

async function getWordsFromDatabase(prisma: PrismaClient, label: string) {
  const words = await prisma.word.findMany({
    orderBy: [
      { category: 'asc' },
      { difficulty: 'asc' },
      { englishWord: 'asc' },
    ],
  });

  const stats = {
    total: words.length,
    byCategory: {} as Record<string, number>,
    byDifficulty: {} as Record<number, number>,
    byCategoryAndDifficulty: {} as Record<string, Record<number, number>>,
    words: words.map(w => ({
      englishWord: w.englishWord,
      hebrewTranslation: w.hebrewTranslation,
      category: w.category,
      difficulty: w.difficulty,
      active: w.active,
    })),
  };

  words.forEach(word => {
    const category = word.category || 'Uncategorized';
    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    stats.byDifficulty[word.difficulty] = (stats.byDifficulty[word.difficulty] || 0) + 1;
    if (!stats.byCategoryAndDifficulty[category]) {
      stats.byCategoryAndDifficulty[category] = {};
    }
    stats.byCategoryAndDifficulty[category][word.difficulty] =
      (stats.byCategoryAndDifficulty[category][word.difficulty] || 0) + 1;
  });

  return stats;
}

async function compare() {
  console.log('🔍 Comparing Local vs Production databases...\n');

  // Load local (using current DATABASE_URL)
  console.log('📊 Loading LOCAL database...');
  const localPrisma = new PrismaClient();
  const localStats = await getWordsFromDatabase(localPrisma, 'Local');
  await localPrisma.$disconnect();

  // Load production
  console.log('📊 Loading PRODUCTION database...');
  console.log('⚠️  Make sure schema.prisma provider is set to "postgresql" for production connection\n');

  // Temporarily override DATABASE_URL for production
  const originalUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = productionUrl;

  // Regenerate Prisma Client if needed, or use a workaround
  // For now, we'll assume the user has changed the schema provider
  const productionPrisma = new PrismaClient();

  let productionStats;
  try {
    productionStats = await getWordsFromDatabase(productionPrisma, 'Production');
  } catch (error: any) {
    console.error('❌ Error connecting to production:', error.message);
    console.log('\n💡 Solution:');
    console.log('1. Change schema.prisma provider to "postgresql"');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run this script again');
    console.log('4. Change schema.prisma provider back to "sqlite"');
    console.log('5. Run: npx prisma generate');
    await productionPrisma.$disconnect();
    process.env.DATABASE_URL = originalUrl;
    process.exit(1);
  }

  await productionPrisma.$disconnect();
  process.env.DATABASE_URL = originalUrl;

  // Compare
  console.log('\n' + '='.repeat(80));
  console.log('📈 COMPARISON RESULTS');
  console.log('='.repeat(80));

  console.log(`\nTotal words:`);
  console.log(`  Local:      ${localStats.total}`);
  console.log(`  Production: ${productionStats.total}`);
  console.log(`  Difference: ${productionStats.total - localStats.total}`);

  // Colors Level 3 specifically
  const localColorsLevel3 = localStats.words.filter(w => w.category === 'Colors' && w.difficulty >= 2);
  const prodColorsLevel3 = productionStats.words.filter(w => w.category === 'Colors' && w.difficulty >= 2);

  console.log(`\n🎨 Colors Category - Level 3 (Difficulty 2+):`);
  console.log(`  Local:      ${localColorsLevel3.length} words`);
  console.log(`  Production: ${prodColorsLevel3.length} words`);
  console.log(`  Difference: ${prodColorsLevel3.length - localColorsLevel3.length}`);

  if (prodColorsLevel3.length > localColorsLevel3.length) {
    console.log(`\n✅ Production has ${prodColorsLevel3.length - localColorsLevel3.length} more Colors Level 3 words:`);
    prodColorsLevel3.forEach(word => {
      if (!localColorsLevel3.find(w => w.englishWord === word.englishWord)) {
        console.log(`   - ${word.englishWord} (${word.hebrewTranslation})`);
      }
    });
  } else if (localColorsLevel3.length > prodColorsLevel3.length) {
    console.log(`\n⚠️  Local has ${localColorsLevel3.length - prodColorsLevel3.length} more Colors Level 3 words:`);
    localColorsLevel3.forEach(word => {
      if (!prodColorsLevel3.find(w => w.englishWord === word.englishWord)) {
        console.log(`   - ${word.englishWord} (${word.hebrewTranslation})`);
      }
    });
  } else {
    console.log(`\n✓ Colors Level 3 words match!`);
  }

  // All categories comparison
  console.log(`\n📁 By Category:`);
  const allCategories = new Set([
    ...Object.keys(localStats.byCategory),
    ...Object.keys(productionStats.byCategory),
  ]);

  for (const category of Array.from(allCategories).sort()) {
    const localCount = localStats.byCategory[category] || 0;
    const prodCount = productionStats.byCategory[category] || 0;
    if (localCount !== prodCount) {
      console.log(`  ${category}: Local=${localCount}, Production=${prodCount}, Diff=${prodCount - localCount}`);
    }
  }

  // Category + Difficulty breakdown
  console.log(`\n📊 Colors Category Breakdown:`);
  const colorsLocal = localStats.byCategoryAndDifficulty['Colors'] || {};
  const colorsProd = productionStats.byCategoryAndDifficulty['Colors'] || {};
  const difficulties = new Set([...Object.keys(colorsLocal), ...Object.keys(colorsProd)]);

  for (const diff of Array.from(difficulties).sort()) {
    const d = Number(diff);
    const localCount = colorsLocal[d] || 0;
    const prodCount = colorsProd[d] || 0;
    console.log(`  Difficulty ${d}: Local=${localCount}, Production=${prodCount}, Diff=${prodCount - localCount}`);
  }
}

compare().catch(console.error);
