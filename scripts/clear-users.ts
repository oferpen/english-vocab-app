import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Clearing all users and children...');

  // Delete all children first (due to foreign key constraints)
  const deletedChildren = await prisma.childProfile.deleteMany({});
  console.log(`✅ Deleted ${deletedChildren.count} child profiles`);

  // Delete all parent accounts
  const deletedParents = await prisma.parentAccount.deleteMany({});
  console.log(`✅ Deleted ${deletedParents.count} parent accounts`);

  console.log('✨ Database cleared! You can now test with a fresh account.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
