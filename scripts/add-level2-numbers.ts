
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('➕ Adding Level 2 Numbers to database...');

    const newWords = [
        { englishWord: 'eleven', hebrewTranslation: 'אחת עשרה', category: 'Numbers', level: 2, exampleEn: 'Eleven players', exampleHe: 'אחד עשר שחקנים' },
        { englishWord: 'twelve', hebrewTranslation: 'שתים עשרה', category: 'Numbers', level: 2, exampleEn: 'Twelve months', exampleHe: 'שניים עשר חודשים' },
        { englishWord: 'thirteen', hebrewTranslation: 'שלוש עשרה', category: 'Numbers', level: 2, exampleEn: 'Thirteen candles', exampleHe: 'שלוש עשרה נרות' },
        { englishWord: 'fourteen', hebrewTranslation: 'ארבע עשרה', category: 'Numbers', level: 2, exampleEn: 'Fourteen days', exampleHe: 'ארבעה עשר ימים' },
        { englishWord: 'fifteen', hebrewTranslation: 'חמש עשרה', category: 'Numbers', level: 2, exampleEn: 'Fifteen minutes', exampleHe: 'חמש עשרה דקות' },
        { englishWord: 'sixteen', hebrewTranslation: 'שש עשרה', category: 'Numbers', level: 2, exampleEn: 'Sweet sixteen', exampleHe: 'שש עשרה מתוק' },
        { englishWord: 'seventeen', hebrewTranslation: 'שבע עשרה', category: 'Numbers', level: 2, exampleEn: 'Seventeen years', exampleHe: 'שבע עשרה שנים' },
        { englishWord: 'eighteen', hebrewTranslation: 'שמונה עשרה', category: 'Numbers', level: 2, exampleEn: 'Eighteen holes', exampleHe: 'שמונה עשר חורים' },
        { englishWord: 'nineteen', hebrewTranslation: 'תשע עשרה', category: 'Numbers', level: 2, exampleEn: 'Nineteen ninety', exampleHe: 'אלף תשע מאות תשעים' },
        { englishWord: 'twenty', hebrewTranslation: 'עשרים', category: 'Numbers', level: 2, exampleEn: 'Twenty dollars', exampleHe: 'עשרים דולר' },
        { englishWord: 'thirty', hebrewTranslation: 'שלושים', category: 'Numbers', level: 2, exampleEn: 'Thirty days', exampleHe: 'שלושים ימים' },
        { englishWord: 'forty', hebrewTranslation: 'ארבעים', category: 'Numbers', level: 2, exampleEn: 'Forty thieves', exampleHe: 'ארבעים גנבים' },
        { englishWord: 'fifty', hebrewTranslation: 'חמישים', category: 'Numbers', level: 2, exampleEn: 'Fifty percent', exampleHe: 'חמישים אחוז' },
        { englishWord: 'sixty', hebrewTranslation: 'שישים', category: 'Numbers', level: 2, exampleEn: 'Sixty seconds', exampleHe: 'שישים שניות' },
        { englishWord: 'seventy', hebrewTranslation: 'שבעים', category: 'Numbers', level: 2, exampleEn: 'Seventy years', exampleHe: 'שבעים שנה' },
        { englishWord: 'eighty', hebrewTranslation: 'שמונים', category: 'Numbers', level: 2, exampleEn: 'Eighty days', exampleHe: 'שמונים ימים' },
        { englishWord: 'ninety', hebrewTranslation: 'תשעים', category: 'Numbers', level: 2, exampleEn: 'Ninety degrees', exampleHe: 'תשעים מעלות' },
        { englishWord: 'one hundred', hebrewTranslation: 'מאה', category: 'Numbers', level: 2, exampleEn: 'One hundred percent', exampleHe: 'מאה אחוז' },
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

    console.log(`✅ Added ${newWords.length} new Level 2 number words.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
