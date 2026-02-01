import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Resetting everything - clearing all progress and deleting all users...');

  // Delete everything related to users
  // Due to onDelete: Cascade in schema.prisma, deleting Users will delete:
  // - progress
  // - quiz_attempts
  // - mission_states
  // - letter_progress

  console.log('Deleting all users and their related data...');
  const deletedUsers = await prisma.user.deleteMany({});
  console.log(`✅ Deleted ${deletedUsers.count} users and all associated progress.`);

  console.log('\n✨ Everything has been reset! The user database is now empty.');
  console.log('Words and Letters remain intact.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
