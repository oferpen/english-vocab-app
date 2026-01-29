
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('➕ Adding missing numbers to "Numbers" category...');

    const newWords = [
        { englishWord: 'zero', hebrewTranslation: 'אפס', category: 'Numbers', level: 1, exampleEn: 'Zero cookies', exampleHe: 'אפס עוגיות' },
        { englishWord: 'six', hebrewTranslation: 'שש', category: 'Numbers', level: 1, exampleEn: 'Six balloons', exampleHe: 'שישה בלונים' },
        { englishWord: 'seven', hebrewTranslation: 'שבע', category: 'Numbers', level: 1, exampleEn: 'Seven days', exampleHe: 'שבעה ימים' },
        { englishWord: 'eight', hebrewTranslation: 'שמונה', category: 'Numbers', level: 1, exampleEn: 'Eight legs', exampleHe: 'שמונה רגליים' },
        { englishWord: 'nine', hebrewTranslation: 'תשע', category: 'Numbers', level: 1, exampleEn: 'Nine lives', exampleHe: 'תשע נשמות' },
    ];

    for (const wordData of newWords) {
        await prisma.word.upsert({
            where: {
                id: `word-${wordData.englishWord}`,
            },
            update: {
                ...wordData,
            },
            create: {
                id: `word-${wordData.englishWord}`,
                ...wordData,
            },
        });
        console.log(`Initialized word: ${wordData.englishWord}`);
    }

    console.log(`✅ Added ${newWords.length} new number words.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
