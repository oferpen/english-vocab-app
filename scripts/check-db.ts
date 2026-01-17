import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parents = await prisma.parentAccount.findMany({
    include: {
      children: true,
    },
  });

  console.log(`\n📊 Database Status:`);
  console.log(`   Parent accounts: ${parents.length}`);
  
  parents.forEach((parent, idx) => {
    console.log(`\n   Parent ${idx + 1}:`);
    console.log(`     Email: ${parent.email || 'N/A'}`);
    console.log(`     Name: ${parent.name || 'N/A'}`);
    console.log(`     Children: ${parent.children.length}`);
    parent.children.forEach((child, cIdx) => {
      console.log(`       Child ${cIdx + 1}: ${child.name} (${child.avatar || 'no avatar'})`);
    });
  });

  if (parents.length === 0) {
    console.log('   ✅ Database is empty - ready for testing!');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
