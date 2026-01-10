import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create parent account with default PIN "1234"
  const pinHash = await bcrypt.hash('1234', 10);
  const parentAccount = await prisma.parentAccount.upsert({
    where: { id: 'default-parent' },
    update: {},
    create: {
      id: 'default-parent',
      pinHash,
      settingsJson: JSON.stringify({
        questionTypes: {
          enToHe: true,
          heToEn: true,
          audioToEn: true,
        },
        quizLength: 10,
        extraLearningStrategy: 'unseen',
        streakRule: 'either',
        rewardIntensity: 'normal',
      }),
    },
  });

  console.log('✅ Parent account created');

  // Create default child
  const child = await prisma.childProfile.upsert({
    where: { id: 'default-child' },
    update: {},
    create: {
      id: 'default-child',
      parentAccountId: parentAccount.id,
      name: 'ילד/ה',
      avatar: '👶',
      age: 10,
      grade: 'ד',
    },
  });

  // Update parent's lastActiveChildId
  await prisma.parentAccount.update({
    where: { id: parentAccount.id },
    data: { lastActiveChildId: child.id },
  });

  console.log('✅ Default child created');

  // Seed words - at least 60 beginner words
  const words = [
    // Home category (20+ words)
    { englishWord: 'house', hebrewTranslation: 'בית', category: 'Home', difficulty: 1, exampleEn: 'This is my house', exampleHe: 'זה הבית שלי' },
    { englishWord: 'room', hebrewTranslation: 'חדר', category: 'Home', difficulty: 1, exampleEn: 'My room is big', exampleHe: 'החדר שלי גדול' },
    { englishWord: 'bed', hebrewTranslation: 'מיטה', category: 'Home', difficulty: 1, exampleEn: 'I sleep in my bed', exampleHe: 'אני ישן במיטה שלי' },
    { englishWord: 'chair', hebrewTranslation: 'כיסא', category: 'Home', difficulty: 1, exampleEn: 'Sit on the chair', exampleHe: 'שב על הכיסא' },
    { englishWord: 'table', hebrewTranslation: 'שולחן', category: 'Home', difficulty: 1, exampleEn: 'The table is round', exampleHe: 'השולחן עגול' },
    { englishWord: 'door', hebrewTranslation: 'דלת', category: 'Home', difficulty: 1, exampleEn: 'Close the door', exampleHe: 'סגור את הדלת' },
    { englishWord: 'window', hebrewTranslation: 'חלון', category: 'Home', difficulty: 1, exampleEn: 'Open the window', exampleHe: 'פתח את החלון' },
    { englishWord: 'kitchen', hebrewTranslation: 'מטבח', category: 'Home', difficulty: 1, exampleEn: 'Mom is in the kitchen', exampleHe: 'אמא במטבח' },
    { englishWord: 'bathroom', hebrewTranslation: 'שירותים', category: 'Home', difficulty: 1, exampleEn: 'Where is the bathroom?', exampleHe: 'איפה השירותים?' },
    { englishWord: 'garden', hebrewTranslation: 'גן', category: 'Home', difficulty: 1, exampleEn: 'We play in the garden', exampleHe: 'אנחנו משחקים בגן' },
    { englishWord: 'sofa', hebrewTranslation: 'ספה', category: 'Home', difficulty: 1, exampleEn: 'The sofa is comfortable', exampleHe: 'הספה נוחה' },
    { englishWord: 'lamp', hebrewTranslation: 'מנורה', category: 'Home', difficulty: 1, exampleEn: 'Turn on the lamp', exampleHe: 'הדלק את המנורה' },
    { englishWord: 'book', hebrewTranslation: 'ספר', category: 'Home', difficulty: 1, exampleEn: 'I read a book', exampleHe: 'אני קורא ספר' },
    { englishWord: 'toy', hebrewTranslation: 'צעצוע', category: 'Home', difficulty: 1, exampleEn: 'This is my favorite toy', exampleHe: 'זה הצעצוע האהוב עליי' },
    { englishWord: 'computer', hebrewTranslation: 'מחשב', category: 'Home', difficulty: 1, exampleEn: 'I use the computer', exampleHe: 'אני משתמש במחשב' },
    { englishWord: 'phone', hebrewTranslation: 'טלפון', category: 'Home', difficulty: 1, exampleEn: 'My phone is new', exampleHe: 'הטלפון שלי חדש' },
    { englishWord: 'television', hebrewTranslation: 'טלוויזיה', category: 'Home', difficulty: 1, exampleEn: 'Watch television', exampleHe: 'צפה בטלוויזיה' },
    { englishWord: 'refrigerator', hebrewTranslation: 'מקרר', category: 'Home', difficulty: 1, exampleEn: 'The food is in the refrigerator', exampleHe: 'האוכל במקרר' },
    { englishWord: 'cup', hebrewTranslation: 'כוס', category: 'Home', difficulty: 1, exampleEn: 'Drink from the cup', exampleHe: 'שתה מהכוס' },
    { englishWord: 'plate', hebrewTranslation: 'צלחת', category: 'Home', difficulty: 1, exampleEn: 'Put food on the plate', exampleHe: 'שים אוכל על הצלחת' },
    { englishWord: 'spoon', hebrewTranslation: 'כף', category: 'Home', difficulty: 1, exampleEn: 'Use a spoon', exampleHe: 'השתמש בכף' },
    { englishWord: 'fork', hebrewTranslation: 'מזלג', category: 'Home', difficulty: 1, exampleEn: 'Eat with a fork', exampleHe: 'אכול עם מזלג' },

    // School category (20+ words)
    { englishWord: 'school', hebrewTranslation: 'בית ספר', category: 'School', difficulty: 1, exampleEn: 'I go to school', exampleHe: 'אני הולך לבית ספר' },
    { englishWord: 'teacher', hebrewTranslation: 'מורה', category: 'School', difficulty: 1, exampleEn: 'The teacher is nice', exampleHe: 'המורה נחמדה' },
    { englishWord: 'student', hebrewTranslation: 'תלמיד', category: 'School', difficulty: 1, exampleEn: 'I am a student', exampleHe: 'אני תלמיד' },
    { englishWord: 'classroom', hebrewTranslation: 'כיתה', category: 'School', difficulty: 1, exampleEn: 'Our classroom is big', exampleHe: 'הכיתה שלנו גדולה' },
    { englishWord: 'desk', hebrewTranslation: 'שולחן כתיבה', category: 'School', difficulty: 1, exampleEn: 'Sit at your desk', exampleHe: 'שב בשולחן הכתיבה שלך' },
    { englishWord: 'pencil', hebrewTranslation: 'עיפרון', category: 'School', difficulty: 1, exampleEn: 'Write with a pencil', exampleHe: 'כתוב בעיפרון' },
    { englishWord: 'pen', hebrewTranslation: 'עט', category: 'School', difficulty: 1, exampleEn: 'I need a pen', exampleHe: 'אני צריך עט' },
    { englishWord: 'notebook', hebrewTranslation: 'מחברת', category: 'School', difficulty: 1, exampleEn: 'Write in your notebook', exampleHe: 'כתוב במחברת שלך' },
    { englishWord: 'backpack', hebrewTranslation: 'תיק', category: 'School', difficulty: 1, exampleEn: 'Put books in your backpack', exampleHe: 'שים ספרים בתיק שלך' },
    { englishWord: 'homework', hebrewTranslation: 'שיעורי בית', category: 'School', difficulty: 1, exampleEn: 'Do your homework', exampleHe: 'עשה את שיעורי הבית שלך' },
    { englishWord: 'test', hebrewTranslation: 'מבחן', category: 'School', difficulty: 1, exampleEn: 'I have a test tomorrow', exampleHe: 'יש לי מבחן מחר' },
    { englishWord: 'lesson', hebrewTranslation: 'שיעור', category: 'School', difficulty: 1, exampleEn: 'The lesson is interesting', exampleHe: 'השיעור מעניין' },
    { englishWord: 'blackboard', hebrewTranslation: 'לוח', category: 'School', difficulty: 1, exampleEn: 'Look at the blackboard', exampleHe: 'הסתכל על הלוח' },
    { englishWord: 'eraser', hebrewTranslation: 'מחק', category: 'School', difficulty: 1, exampleEn: 'Use the eraser', exampleHe: 'השתמש במחק' },
    { englishWord: 'ruler', hebrewTranslation: 'סרגל', category: 'School', difficulty: 1, exampleEn: 'Measure with a ruler', exampleHe: 'מדוד עם סרגל' },
    { englishWord: 'calculator', hebrewTranslation: 'מחשבון', category: 'School', difficulty: 1, exampleEn: 'Use a calculator', exampleHe: 'השתמש במחשבון' },
    { englishWord: 'library', hebrewTranslation: 'ספרייה', category: 'School', difficulty: 1, exampleEn: 'Borrow books from the library', exampleHe: 'השאל ספרים מהספרייה' },
    { englishWord: 'playground', hebrewTranslation: 'מגרש משחקים', category: 'School', difficulty: 1, exampleEn: 'Play in the playground', exampleHe: 'שחק במגרש המשחקים' },
    { englishWord: 'lunch', hebrewTranslation: 'ארוחת צהריים', category: 'School', difficulty: 1, exampleEn: 'Eat lunch at school', exampleHe: 'אכול ארוחת צהריים בבית ספר' },
    { englishWord: 'friend', hebrewTranslation: 'חבר', category: 'School', difficulty: 1, exampleEn: 'My friend is kind', exampleHe: 'החבר שלי נחמד' },
    { englishWord: 'recess', hebrewTranslation: 'הפסקה', category: 'School', difficulty: 1, exampleEn: 'We play during recess', exampleHe: 'אנחנו משחקים בהפסקה' },
    { englishWord: 'grade', hebrewTranslation: 'ציון', category: 'School', difficulty: 1, exampleEn: 'I got a good grade', exampleHe: 'קיבלתי ציון טוב' },

    // Animals category
    { englishWord: 'cat', hebrewTranslation: 'חתול', category: 'Animals', difficulty: 1, exampleEn: 'The cat is sleeping', exampleHe: 'החתול ישן' },
    { englishWord: 'dog', hebrewTranslation: 'כלב', category: 'Animals', difficulty: 1, exampleEn: 'The dog is friendly', exampleHe: 'הכלב ידידותי' },
    { englishWord: 'bird', hebrewTranslation: 'ציפור', category: 'Animals', difficulty: 1, exampleEn: 'The bird is flying', exampleHe: 'הציפור עפה' },
    { englishWord: 'fish', hebrewTranslation: 'דג', category: 'Animals', difficulty: 1, exampleEn: 'Fish live in water', exampleHe: 'דגים חיים במים' },
    { englishWord: 'rabbit', hebrewTranslation: 'ארנב', category: 'Animals', difficulty: 1, exampleEn: 'The rabbit is cute', exampleHe: 'הארנב חמוד' },
    { englishWord: 'horse', hebrewTranslation: 'סוס', category: 'Animals', difficulty: 1, exampleEn: 'I ride a horse', exampleHe: 'אני רוכב על סוס' },
    { englishWord: 'elephant', hebrewTranslation: 'פיל', category: 'Animals', difficulty: 2, exampleEn: 'The elephant is big', exampleHe: 'הפיל גדול' },
    { englishWord: 'lion', hebrewTranslation: 'אריה', category: 'Animals', difficulty: 2, exampleEn: 'The lion is the king', exampleHe: 'האריה הוא המלך' },

    // Colors category
    { englishWord: 'red', hebrewTranslation: 'אדום', category: 'Colors', difficulty: 1, exampleEn: 'The apple is red', exampleHe: 'התפוח אדום' },
    { englishWord: 'blue', hebrewTranslation: 'כחול', category: 'Colors', difficulty: 1, exampleEn: 'The sky is blue', exampleHe: 'השמיים כחולים' },
    { englishWord: 'green', hebrewTranslation: 'ירוק', category: 'Colors', difficulty: 1, exampleEn: 'The grass is green', exampleHe: 'הדשא ירוק' },
    { englishWord: 'yellow', hebrewTranslation: 'צהוב', category: 'Colors', difficulty: 1, exampleEn: 'The sun is yellow', exampleHe: 'השמש צהובה' },
    { englishWord: 'orange', hebrewTranslation: 'כתום', category: 'Colors', difficulty: 1, exampleEn: 'The orange is orange', exampleHe: 'התפוז כתום' },
    { englishWord: 'purple', hebrewTranslation: 'סגול', category: 'Colors', difficulty: 1, exampleEn: 'I like purple', exampleHe: 'אני אוהב סגול' },
    { englishWord: 'black', hebrewTranslation: 'שחור', category: 'Colors', difficulty: 1, exampleEn: 'The night is black', exampleHe: 'הלילה שחור' },
    { englishWord: 'white', hebrewTranslation: 'לבן', category: 'Colors', difficulty: 1, exampleEn: 'Snow is white', exampleHe: 'השלג לבן' },

    // Food category
    { englishWord: 'apple', hebrewTranslation: 'תפוח', category: 'Food', difficulty: 1, exampleEn: 'I eat an apple', exampleHe: 'אני אוכל תפוח' },
    { englishWord: 'banana', hebrewTranslation: 'בננה', category: 'Food', difficulty: 1, exampleEn: 'Bananas are yellow', exampleHe: 'בננות צהובות' },
    { englishWord: 'bread', hebrewTranslation: 'לחם', category: 'Food', difficulty: 1, exampleEn: 'Buy bread', exampleHe: 'קנה לחם' },
    { englishWord: 'milk', hebrewTranslation: 'חלב', category: 'Food', difficulty: 1, exampleEn: 'Drink milk', exampleHe: 'שתה חלב' },
    { englishWord: 'water', hebrewTranslation: 'מים', category: 'Food', difficulty: 1, exampleEn: 'I drink water', exampleHe: 'אני שותה מים' },
    { englishWord: 'egg', hebrewTranslation: 'ביצה', category: 'Food', difficulty: 1, exampleEn: 'Eat an egg', exampleHe: 'אכול ביצה' },
    { englishWord: 'cheese', hebrewTranslation: 'גבינה', category: 'Food', difficulty: 1, exampleEn: 'I like cheese', exampleHe: 'אני אוהב גבינה' },
  ];

  for (const wordData of words) {
    await prisma.word.upsert({
      where: {
        id: `word-${wordData.englishWord}`,
      },
      update: {},
      create: {
        id: `word-${wordData.englishWord}`,
        ...wordData,
      },
    });
  }

  console.log(`✅ Created ${words.length} words`);

  // Create level state for child
  await prisma.levelState.upsert({
    where: { childId: child.id },
    update: {},
    create: {
      childId: child.id,
      level: 1,
      xp: 0,
    },
  });

  console.log('✅ Level state created');

  console.log('🎉 Seed completed!');
  console.log('📌 Default PIN: 1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
