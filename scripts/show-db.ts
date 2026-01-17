import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function showDatabase() {
  try {
    console.log('\n📊 Database Summary\n');
    console.log('═'.repeat(50));

    // Parent Accounts
    const parents = await prisma.parentAccount.findMany({
      include: {
        children: true,
      },
    });
    console.log(`\n👨‍👩‍👧 Parent Accounts: ${parents.length}`);
    parents.forEach((parent, idx) => {
      console.log(`\n  ${idx + 1}. ID: ${parent.id}`);
      console.log(`     Email: ${parent.email || 'none'}`);
      console.log(`     Google ID: ${parent.googleId || 'none'}`);
      console.log(`     Has PIN: ${parent.pinHash ? 'Yes' : 'No'}`);
      console.log(`     Children: ${parent.children.length}`);
      parent.children.forEach((child, cIdx) => {
        console.log(`       ${cIdx + 1}. ${child.name} ${child.avatar || ''} (${child.id})`);
      });
    });

    // Words
    const words = await prisma.word.findMany({
      orderBy: { category: 'asc' },
    });
    console.log(`\n📚 Words: ${words.length}`);
    const byCategory = words.reduce((acc: any, word) => {
      if (!acc[word.category]) acc[word.category] = [];
      acc[word.category].push(word);
      return acc;
    }, {});
    Object.keys(byCategory).forEach(category => {
      console.log(`\n  ${category}: ${byCategory[category].length} words`);
      byCategory[category].slice(0, 5).forEach((word: any) => {
        console.log(`    - ${word.englishWord} → ${word.hebrewTranslation}`);
      });
      if (byCategory[category].length > 5) {
        console.log(`    ... and ${byCategory[category].length - 5} more`);
      }
    });

    // Daily Plans
    const plans = await prisma.dailyPlan.findMany({
      include: {
        words: {
          include: {
            word: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 5,
    });
    console.log(`\n📅 Daily Plans: ${await prisma.dailyPlan.count()} total`);
    plans.forEach((plan, idx) => {
      console.log(`\n  ${idx + 1}. Date: ${plan.date}`);
      console.log(`     Child: ${plan.childId}`);
      console.log(`     Words: ${plan.words.length}`);
      plan.words.slice(0, 3).forEach((pw: any) => {
        console.log(`       - ${pw.word.englishWord}`);
      });
      if (plan.words.length > 3) {
        console.log(`       ... and ${plan.words.length - 3} more`);
      }
    });

    // Progress
    const progressCount = await prisma.progress.count();
    console.log(`\n📈 Progress Records: ${progressCount}`);

    // Quiz Attempts
    const quizAttempts = await prisma.quizAttempt.count();
    console.log(`\n🎯 Quiz Attempts: ${quizAttempts}`);

    // Level States
    const levels = await prisma.levelState.findMany({
      include: {
        child: true,
      },
    });
    console.log(`\n⭐ Level States: ${levels.length}`);
    levels.forEach((level) => {
      console.log(`  - ${level.child.name}: Level ${level.level}, XP: ${level.xp}`);
    });

    console.log('\n' + '═'.repeat(50));
    console.log('\n💡 Tip: Open Prisma Studio at http://localhost:5555 for a visual interface\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showDatabase();
