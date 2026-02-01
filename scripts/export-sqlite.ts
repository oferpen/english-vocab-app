
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';

async function main() {
    // Use a temporary client for SQLite
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'file:./prisma/prisma/dev.db',
            },
        },
    });

    try {
        const words = await prisma.word.findMany({
            orderBy: [
                { category: 'asc' },
                { difficulty: 'asc' },
                { englishWord: 'asc' },
            ],
        });

        const exportData = {
            exportedAt: new Date().toISOString(),
            total: words.length,
            words: words.map(w => ({
                englishWord: w.englishWord,
                hebrewTranslation: w.hebrewTranslation,
                category: w.category || 'Uncategorized',
                difficulty: w.difficulty,
                active: w.active,
                exampleEn: w.exampleEn,
                exampleHe: w.exampleHe,
            })),
        };

        writeFileSync('words-local.json', JSON.stringify(exportData, null, 2));
        console.log(`✅ Exported ${words.length} words from SQLite to words-local.json`);
    } catch (error) {
        console.error('Error exporting SQLite:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
