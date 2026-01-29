import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all progress data...');

  // Delete in order to respect foreign key constraints
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

  console.log('✨ All progress data cleared! Users and words remain intact.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
