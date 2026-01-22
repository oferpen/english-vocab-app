import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Resetting everything - clearing all progress and deleting all profiles...');

  // Delete in order to respect foreign key constraints
  console.log('Deleting progress data...');
  const deletedQuizAttempts = await prisma.quizAttempt.deleteMany({});
  console.log(`✅ Deleted ${deletedQuizAttempts.count} quiz attempts`);

  const deletedProgress = await prisma.progress.deleteMany({});
  console.log(`✅ Deleted ${deletedProgress.count} progress records`);

  const deletedLetterProgress = await prisma.letterProgress.deleteMany({});
  console.log(`✅ Deleted ${deletedLetterProgress.count} letter progress records`);

  const deletedMissionStates = await prisma.missionState.deleteMany({});
  console.log(`✅ Deleted ${deletedMissionStates.count} mission states`);

  const deletedLevelStates = await prisma.levelState.deleteMany({});
  console.log(`✅ Deleted ${deletedLevelStates.count} level states`);

  const deletedDailyPlanWords = await prisma.dailyPlanWord.deleteMany({});
  console.log(`✅ Deleted ${deletedDailyPlanWords.count} daily plan words`);

  const deletedDailyPlans = await prisma.dailyPlan.deleteMany({});
  console.log(`✅ Deleted ${deletedDailyPlans.count} daily plans`);

  console.log('\nDeleting user profiles...');
  // Delete all children first (due to foreign key constraints)
  const deletedChildren = await prisma.childProfile.deleteMany({});
  console.log(`✅ Deleted ${deletedChildren.count} child profiles`);

  // Delete all parent accounts
  const deletedParents = await prisma.parentAccount.deleteMany({});
  console.log(`✅ Deleted ${deletedParents.count} parent accounts`);

  console.log('\n✨ Everything has been reset! Database is now empty.');
  console.log('You can now create new accounts and start fresh.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
