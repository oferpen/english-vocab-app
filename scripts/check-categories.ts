
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.word.groupBy({
        by: ['category'],
        _count: {
            category: true,
        },
        orderBy: {
            category: 'asc',
        },
    });

    console.log('Categories found:');
    categories.forEach((c) => {
        console.log(`- ${c.category || 'Uncategorized'}: ${c._count.category} words`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
