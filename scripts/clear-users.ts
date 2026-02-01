import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log('🗑️ Starting cleanup (Deleting all users)...');
    try {
        const deleteCount = await prisma.user.deleteMany();
        console.log(`✅ Deleted ${deleteCount.count} users.`);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}
main();
