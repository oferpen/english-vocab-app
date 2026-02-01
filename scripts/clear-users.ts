import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('🗑️ Starting cleanup...');
    try {
        const deleteCount = await prisma.parentAccount.deleteMany();
        console.log(`✅ Deleted ${deleteCount.count} accounts.`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}
main();
