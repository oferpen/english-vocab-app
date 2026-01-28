import { PrismaClient } from '@prisma/client';

// Get database URLs
const localUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
const productionUrl = process.env.PRODUCTION_DATABASE_URL || process.argv[2];

if (!productionUrl) {
  console.error('❌ Please provide PRODUCTION_DATABASE_URL in .env or as command line argument');
  console.log('\nUsage:');
  console.log('  Option 1: Set PRODUCTION_DATABASE_URL in .env file');
  console.log('  Option 2: npx tsx scripts/compare-databases.ts "postgresql://user:pass@host:port/db"');
  console.log('\nExample:');
  console.log('  npx tsx scripts/compare-databases.ts "postgresql://user:password@host:5432/dbname"');
  process.exit(1);
}

console.log('📊 Local DB URL:', localUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('📊 Production DB URL:', productionUrl.replace(/:[^:@]+@/, ':****@')); // Hide password
console.log('');

// Create Prisma clients with different connection strings
// Note: We need to handle the provider mismatch (SQLite vs PostgreSQL)
// We'll use Prisma's ability to override the connection at runtime

// For local (SQLite)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: localUrl,
    },
  },
});

// For production (PostgreSQL) - we'll need to temporarily change the schema provider
// or use a different approach
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: productionUrl,
    },
  },
});

interface WordStats {
  total: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<number, number>;
  byCategoryAndDifficulty: Record<string, Record<number, number>>;
  words: Array<{
    englishWord: string;
    hebrewTranslation: string;
    category: string;
    difficulty: number;
    active: boolean;
  }>;
}

async function getWordStats(prisma: PrismaClient, label: string): Promise<WordStats> {
  const words = await prisma.word.findMany({
    orderBy: [
      { category: 'asc' },
      { difficulty: 'asc' },
      { englishWord: 'asc' },
    ],
  });

  const byCategory: Record<string, number> = {};
  const byDifficulty: Record<number, number> = {};
  const byCategoryAndDifficulty: Record<string, Record<number, number>> = {};

  words.forEach((word) => {
    // Count by category
    byCategory[word.category] = (byCategory[word.category] || 0) + 1;

    // Count by difficulty
    byDifficulty[word.difficulty] = (byDifficulty[word.difficulty] || 0) + 1;

    // Count by category and difficulty
    if (!byCategoryAndDifficulty[word.category]) {
      byCategoryAndDifficulty[word.category] = {};
    }
    byCategoryAndDifficulty[word.category][word.difficulty] =
      (byCategoryAndDifficulty[word.category][word.difficulty] || 0) + 1;
  });

  return {
    total: words.length,
    byCategory,
    byDifficulty,
    byCategoryAndDifficulty,
    words: words.map((w) => ({
      englishWord: w.englishWord,
      hebrewTranslation: w.hebrewTranslation,
      category: w.category,
      difficulty: w.difficulty,
      active: w.active,
    })),
  };
}

function createWordKey(word: { englishWord: string; category: string }): string {
  return `${word.category}:${word.englishWord}`;
}

async function compareDatabases() {
  console.log('🔍 Comparing databases...\n');

  try {
    console.log('📊 Loading local database...');
    const localStats = await getWordStats(localPrisma, 'Local');

    console.log('📊 Loading production database...');
    const productionStats = await getWordStats(productionPrisma, 'Production');

    console.log('\n' + '='.repeat(80));
    console.log('📈 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Local:      ${localStats.total} words`);
    console.log(`Production: ${productionStats.total} words`);
    console.log(`Difference: ${productionStats.total - localStats.total} words\n`);

    // Compare by category
    console.log('📁 BY CATEGORY:');
    console.log('-'.repeat(80));
    const allCategories = new Set([
      ...Object.keys(localStats.byCategory),
      ...Object.keys(productionStats.byCategory),
    ]);

    for (const category of Array.from(allCategories).sort()) {
      const localCount = localStats.byCategory[category] || 0;
      const prodCount = productionStats.byCategory[category] || 0;
      const diff = prodCount - localCount;
      const symbol = diff === 0 ? '✓' : diff > 0 ? '+' : '-';
      console.log(
        `${symbol} ${category.padEnd(20)} Local: ${String(localCount).padStart(3)} | Production: ${String(prodCount).padStart(3)} | Diff: ${String(diff).padStart(4)}`
      );
    }

    // Compare by difficulty
    console.log('\n📊 BY DIFFICULTY:');
    console.log('-'.repeat(80));
    const allDifficulties = new Set([
      ...Object.keys(localStats.byDifficulty).map(Number),
      ...Object.keys(productionStats.byDifficulty).map(Number),
    ]);

    for (const difficulty of Array.from(allDifficulties).sort()) {
      const localCount = localStats.byDifficulty[difficulty] || 0;
      const prodCount = productionStats.byDifficulty[difficulty] || 0;
      const diff = prodCount - localCount;
      const symbol = diff === 0 ? '✓' : diff > 0 ? '+' : '-';
      console.log(
        `${symbol} Difficulty ${difficulty}: Local: ${String(localCount).padStart(3)} | Production: ${String(prodCount).padStart(3)} | Diff: ${String(diff).padStart(4)}`
      );
    }

    // Compare by category and difficulty
    console.log('\n📋 BY CATEGORY AND DIFFICULTY:');
    console.log('-'.repeat(80));
    for (const category of Array.from(allCategories).sort()) {
      const localCatDiff = localStats.byCategoryAndDifficulty[category] || {};
      const prodCatDiff = productionStats.byCategoryAndDifficulty[category] || {};
      const allDiffLevels = new Set([
        ...Object.keys(localCatDiff).map(Number),
        ...Object.keys(prodCatDiff).map(Number),
      ]);

      for (const difficulty of Array.from(allDiffLevels).sort()) {
        const localCount = localCatDiff[difficulty] || 0;
        const prodCount = prodCatDiff[difficulty] || 0;
        if (localCount !== prodCount) {
          const diff = prodCount - localCount;
          console.log(
            `  ${category.padEnd(20)} Difficulty ${difficulty}: Local: ${String(localCount).padStart(2)} | Production: ${String(prodCount).padStart(2)} | Diff: ${String(diff).padStart(3)}`
          );
        }
      }
    }

    // Find missing words
    console.log('\n🔍 MISSING WORDS:');
    console.log('-'.repeat(80));

    const localWordMap = new Map(
      localStats.words.map((w) => [createWordKey(w), w])
    );
    const productionWordMap = new Map(
      productionStats.words.map((w) => [createWordKey(w), w])
    );

    // Words in production but not in local
    const missingInLocal: typeof localStats.words = [];
    for (const [key, word] of productionWordMap) {
      if (!localWordMap.has(key)) {
        missingInLocal.push(word);
      }
    }

    // Words in local but not in production
    const missingInProduction: typeof localStats.words = [];
    for (const [key, word] of localWordMap) {
      if (!productionWordMap.has(key)) {
        missingInProduction.push(word);
      }
    }

    if (missingInLocal.length > 0) {
      console.log(`\n❌ Missing in LOCAL (${missingInLocal.length} words):`);
      missingInLocal.forEach((word) => {
        console.log(
          `   - ${word.englishWord.padEnd(20)} (${word.hebrewTranslation}) | ${word.category} | Difficulty ${word.difficulty}`
        );
      });
    }

    if (missingInProduction.length > 0) {
      console.log(`\n❌ Missing in PRODUCTION (${missingInProduction.length} words):`);
      missingInProduction.forEach((word) => {
        console.log(
          `   - ${word.englishWord.padEnd(20)} (${word.hebrewTranslation}) | ${word.category} | Difficulty ${word.difficulty}`
        );
      });
    }

    if (missingInLocal.length === 0 && missingInProduction.length === 0) {
      console.log('✓ All words match!');
    }

    // Show specific example: Colors category Level 3
    console.log('\n🎨 COLORS CATEGORY - LEVEL 3 (Difficulty 2+):');
    console.log('-'.repeat(80));
    const localColorsLevel3 = localStats.words.filter(
      (w) => w.category === 'Colors' && w.difficulty >= 2
    );
    const prodColorsLevel3 = productionStats.words.filter(
      (w) => w.category === 'Colors' && w.difficulty >= 2
    );

    console.log(`Local:      ${localColorsLevel3.length} words`);
    console.log(`Production: ${prodColorsLevel3.length} words`);

    if (prodColorsLevel3.length > localColorsLevel3.length) {
      console.log('\nWords in Production but not in Local:');
      prodColorsLevel3.forEach((word) => {
        if (!localColorsLevel3.find((w) => w.englishWord === word.englishWord)) {
          console.log(`   - ${word.englishWord} (${word.hebrewTranslation})`);
        }
      });
    }

    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('postgresql://') || error.message.includes('postgres://')) {
      console.error('\n💡 Make sure PRODUCTION_DATABASE_URL is set correctly in .env');
      console.error('   Or pass it as an argument: npx tsx scripts/compare-databases.ts "postgresql://..."');
    }
    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
    process.exit(1);
  }
}

compareDatabases();
