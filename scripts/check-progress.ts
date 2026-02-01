
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Diagnostic: Checking Progress ---');

    const user = await prisma.user.findFirst({
        orderBy: { updatedAt: 'desc' }
    });

    if (!user) {
        console.log('No user found');
        return;
    }

    console.log(`User: ${user.name} (${user.id})`);

    const categories = ['Starter A', 'Starter B', 'Home', 'School'];

    for (const cat of categories) {
        const words = await prisma.word.findMany({
            where: { category: cat }
        });

        if (words.length === 0) {
            console.log(`Category ${cat}: No words found.`);
            continue;
        }

        const wordIds = words.map(w => w.id);
        const progress = await prisma.progress.findMany({
            where: {
                userId: user.id,
                wordId: { in: wordIds }
            }
        });

        const masteredCount = progress.filter(p => p.masteryScore >= 80).length;
        const percentage = words.length > 0 ? (masteredCount / words.length) * 100 : 0;

        console.log(`Category: ${cat}`);
        console.log(`- Words in DB: ${words.length}`);
        console.log(`- Progress records: ${progress.length}`);
        console.log(`- Mastered (>= 80%): ${masteredCount}`);
        console.log(`- Completion %: ${percentage.toFixed(1)}%`);

        if (progress.length > 0) {
            console.log('- Sample progress:', progress[0]);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
