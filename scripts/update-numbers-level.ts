
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Moving "Numbers" category to Level 1...');

    const result = await prisma.word.updateMany({
        where: {
            category: 'Numbers',
        },
        data: {
            level: 1,
        },
    });

    console.log(`✅ Updated ${result.count} words in "Numbers" category to Level 1.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
