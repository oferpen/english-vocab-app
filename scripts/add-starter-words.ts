import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const starterWords = [
  { englishWord: 'Big', hebrewTranslation: 'גדול', category: 'Starter', difficulty: 1, exampleEn: 'Big house', exampleHe: 'בית גדול' },
  { englishWord: 'Come', hebrewTranslation: 'לבוא', category: 'Starter', difficulty: 1, exampleEn: 'Come here', exampleHe: 'בוא לכאן' },
  { englishWord: 'Drink', hebrewTranslation: 'לשתות', category: 'Starter', difficulty: 1, exampleEn: 'Drink water', exampleHe: 'שתה מים' },
  { englishWord: 'Eat', hebrewTranslation: 'לאכול', category: 'Starter', difficulty: 1, exampleEn: 'Eat food', exampleHe: 'אכול אוכל' },
  { englishWord: 'Go', hebrewTranslation: 'ללכת', category: 'Starter', difficulty: 1, exampleEn: 'Go home', exampleHe: 'לך הביתה' },
  { englishWord: 'Happy', hebrewTranslation: 'שמח', category: 'Starter', difficulty: 1, exampleEn: 'I am happy', exampleHe: 'אני שמח' },
  { englishWord: 'I', hebrewTranslation: 'אני', category: 'Starter', difficulty: 1, exampleEn: 'I am here', exampleHe: 'אני כאן' },
  { englishWord: 'Me', hebrewTranslation: 'אותי', category: 'Starter', difficulty: 1, exampleEn: 'Look at me', exampleHe: 'תסתכל עליי' },
  { englishWord: 'No', hebrewTranslation: 'לא', category: 'Starter', difficulty: 1, exampleEn: 'No, thank you', exampleHe: 'לא, תודה' },
  { englishWord: 'Play', hebrewTranslation: 'לשחק', category: 'Starter', difficulty: 1, exampleEn: 'Play with me', exampleHe: 'שחק איתי' },
  { englishWord: 'Sad', hebrewTranslation: 'עצוב', category: 'Starter', difficulty: 1, exampleEn: 'I am sad', exampleHe: 'אני עצוב' },
  { englishWord: 'Small', hebrewTranslation: 'קטן', category: 'Starter', difficulty: 1, exampleEn: 'Small cat', exampleHe: 'חתול קטן' },
  { englishWord: 'Yes', hebrewTranslation: 'כן', category: 'Starter', difficulty: 1, exampleEn: 'Yes, please', exampleHe: 'כן, בבקשה' },
  { englishWord: 'You', hebrewTranslation: 'אתה', category: 'Starter', difficulty: 1, exampleEn: 'You are nice', exampleHe: 'אתה נחמד' },
];

async function addStarterWords() {
  console.log('🌱 Adding Starter words to database...');
  
  let added = 0;
  let updated = 0;
  
  for (const wordData of starterWords) {
    const existing = await prisma.word.findUnique({
      where: { id: `word-${wordData.englishWord}` },
    });
    
    if (existing) {
      await prisma.word.update({
        where: { id: `word-${wordData.englishWord}` },
        data: {
          ...wordData,
          active: true,
        },
      });
      updated++;
    } else {
      await prisma.word.create({
        data: {
          id: `word-${wordData.englishWord}`,
          ...wordData,
          active: true,
        },
      });
      added++;
    }
  }
  
  console.log(`✅ Added ${added} new Starter words`);
  console.log(`✅ Updated ${updated} existing Starter words`);
  console.log(`📊 Total Starter words: ${starterWords.length}`);
  
  // Verify
  const starterCount = await prisma.word.count({
    where: {
      category: 'Starter',
      difficulty: 1,
      active: true,
    },
  });
  console.log(`✅ Verified: ${starterCount} Starter words in database`);
  
  await prisma.$disconnect();
}

addStarterWords()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
