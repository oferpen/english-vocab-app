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
    { englishWord: 'orange', hebrewTranslation: 'תפוז', category: 'Food', difficulty: 1, exampleEn: 'The orange is sweet', exampleHe: 'התפוז מתוק' },
    { englishWord: 'tomato', hebrewTranslation: 'עגבניה', category: 'Food', difficulty: 1, exampleEn: 'Red tomato', exampleHe: 'עגבניה אדומה' },
    { englishWord: 'carrot', hebrewTranslation: 'גזר', category: 'Food', difficulty: 1, exampleEn: 'Rabbits eat carrots', exampleHe: 'ארנבים אוכלים גזר' },
    { englishWord: 'chicken', hebrewTranslation: 'עוף', category: 'Food', difficulty: 1, exampleEn: 'I eat chicken', exampleHe: 'אני אוכל עוף' },
    { englishWord: 'rice', hebrewTranslation: 'אורז', category: 'Food', difficulty: 1, exampleEn: 'Rice is white', exampleHe: 'אורז לבן' },
    { englishWord: 'pasta', hebrewTranslation: 'פסטה', category: 'Food', difficulty: 1, exampleEn: 'I love pasta', exampleHe: 'אני אוהב פסטה' },
    { englishWord: 'cake', hebrewTranslation: 'עוגה', category: 'Food', difficulty: 1, exampleEn: 'Happy birthday cake', exampleHe: 'עוגת יום הולדת' },
    { englishWord: 'cookie', hebrewTranslation: 'עוגייה', category: 'Food', difficulty: 1, exampleEn: 'Chocolate cookie', exampleHe: 'עוגיית שוקולד' },
    { englishWord: 'juice', hebrewTranslation: 'מיץ', category: 'Food', difficulty: 1, exampleEn: 'Orange juice', exampleHe: 'מיץ תפוזים' },
    { englishWord: 'sandwich', hebrewTranslation: 'כריך', category: 'Food', difficulty: 1, exampleEn: 'I make a sandwich', exampleHe: 'אני מכין כריך' },
    { englishWord: 'pizza', hebrewTranslation: 'פיצה', category: 'Food', difficulty: 1, exampleEn: 'I like pizza', exampleHe: 'אני אוהב פיצה' },
    { englishWord: 'ice cream', hebrewTranslation: 'גלידה', category: 'Food', difficulty: 1, exampleEn: 'Cold ice cream', exampleHe: 'גלידה קרה' },

    // More Animals
    { englishWord: 'cow', hebrewTranslation: 'פרה', category: 'Animals', difficulty: 1, exampleEn: 'The cow gives milk', exampleHe: 'הפרה נותנת חלב' },
    { englishWord: 'sheep', hebrewTranslation: 'כבשה', category: 'Animals', difficulty: 1, exampleEn: 'White sheep', exampleHe: 'כבשה לבנה' },
    { englishWord: 'pig', hebrewTranslation: 'חזיר', category: 'Animals', difficulty: 1, exampleEn: 'The pig is pink', exampleHe: 'החזיר ורוד' },
    { englishWord: 'duck', hebrewTranslation: 'ברווז', category: 'Animals', difficulty: 1, exampleEn: 'The duck swims', exampleHe: 'הברווז שוחה' },
    { englishWord: 'chicken', hebrewTranslation: 'תרנגולת', category: 'Animals', difficulty: 1, exampleEn: 'The chicken lays eggs', exampleHe: 'התרנגולת מטילה ביצים' },
    { englishWord: 'mouse', hebrewTranslation: 'עכבר', category: 'Animals', difficulty: 1, exampleEn: 'The mouse is small', exampleHe: 'העכבר קטן' },
    { englishWord: 'bear', hebrewTranslation: 'דוב', category: 'Animals', difficulty: 2, exampleEn: 'The bear is big', exampleHe: 'הדוב גדול' },
    { englishWord: 'tiger', hebrewTranslation: 'נמר', category: 'Animals', difficulty: 2, exampleEn: 'The tiger has stripes', exampleHe: 'לנמר יש פסים' },
    { englishWord: 'monkey', hebrewTranslation: 'קוף', category: 'Animals', difficulty: 2, exampleEn: 'The monkey climbs', exampleHe: 'הקוף מטפס' },
    { englishWord: 'giraffe', hebrewTranslation: 'ג\'ירף', category: 'Animals', difficulty: 2, exampleEn: 'The giraffe is tall', exampleHe: 'הג\'ירף גבוה' },

    // More Colors
    { englishWord: 'pink', hebrewTranslation: 'ורוד', category: 'Colors', difficulty: 1, exampleEn: 'Pink flowers', exampleHe: 'פרחים ורודים' },
    { englishWord: 'brown', hebrewTranslation: 'חום', category: 'Colors', difficulty: 1, exampleEn: 'Brown bear', exampleHe: 'דוב חום' },
    { englishWord: 'gray', hebrewTranslation: 'אפור', category: 'Colors', difficulty: 1, exampleEn: 'Gray clouds', exampleHe: 'עננים אפורים' },

    // Body Parts
    { englishWord: 'head', hebrewTranslation: 'ראש', category: 'Body', difficulty: 1, exampleEn: 'My head hurts', exampleHe: 'הראש שלי כואב' },
    { englishWord: 'eye', hebrewTranslation: 'עין', category: 'Body', difficulty: 1, exampleEn: 'I have two eyes', exampleHe: 'יש לי שתי עיניים' },
    { englishWord: 'nose', hebrewTranslation: 'אף', category: 'Body', difficulty: 1, exampleEn: 'I smell with my nose', exampleHe: 'אני מריח עם האף שלי' },
    { englishWord: 'mouth', hebrewTranslation: 'פה', category: 'Body', difficulty: 1, exampleEn: 'Open your mouth', exampleHe: 'פתח את הפה' },
    { englishWord: 'hand', hebrewTranslation: 'יד', category: 'Body', difficulty: 1, exampleEn: 'Raise your hand', exampleHe: 'הרם את היד' },
    { englishWord: 'foot', hebrewTranslation: 'רגל', category: 'Body', difficulty: 1, exampleEn: 'I walk with my feet', exampleHe: 'אני הולך עם הרגליים' },
    { englishWord: 'arm', hebrewTranslation: 'זרוע', category: 'Body', difficulty: 1, exampleEn: 'My arm is strong', exampleHe: 'הזרוע שלי חזקה' },
    { englishWord: 'leg', hebrewTranslation: 'רגל', category: 'Body', difficulty: 1, exampleEn: 'I run with my legs', exampleHe: 'אני רץ עם הרגליים' },
    { englishWord: 'finger', hebrewTranslation: 'אצבע', category: 'Body', difficulty: 1, exampleEn: 'I have ten fingers', exampleHe: 'יש לי עשר אצבעות' },
    { englishWord: 'tooth', hebrewTranslation: 'שן', category: 'Body', difficulty: 1, exampleEn: 'Brush your teeth', exampleHe: 'צחצח שיניים' },

    // Family
    { englishWord: 'mother', hebrewTranslation: 'אמא', category: 'Family', difficulty: 1, exampleEn: 'I love my mother', exampleHe: 'אני אוהב את אמא שלי' },
    { englishWord: 'father', hebrewTranslation: 'אבא', category: 'Family', difficulty: 1, exampleEn: 'My father is tall', exampleHe: 'אבא שלי גבוה' },
    { englishWord: 'sister', hebrewTranslation: 'אחות', category: 'Family', difficulty: 1, exampleEn: 'My sister is nice', exampleHe: 'האחות שלי נחמדה' },
    { englishWord: 'brother', hebrewTranslation: 'אח', category: 'Family', difficulty: 1, exampleEn: 'My brother plays soccer', exampleHe: 'האח שלי משחק כדורגל' },
    { englishWord: 'grandmother', hebrewTranslation: 'סבתא', category: 'Family', difficulty: 1, exampleEn: 'Grandmother bakes cookies', exampleHe: 'סבתא אופה עוגיות' },
    { englishWord: 'grandfather', hebrewTranslation: 'סבא', category: 'Family', difficulty: 1, exampleEn: 'Grandfather tells stories', exampleHe: 'סבא מספר סיפורים' },
    { englishWord: 'baby', hebrewTranslation: 'תינוק', category: 'Family', difficulty: 1, exampleEn: 'The baby is sleeping', exampleHe: 'התינוק ישן' },

    // Actions/Verbs
    { englishWord: 'run', hebrewTranslation: 'לרוץ', category: 'Actions', difficulty: 1, exampleEn: 'I run fast', exampleHe: 'אני רץ מהר' },
    { englishWord: 'jump', hebrewTranslation: 'לקפוץ', category: 'Actions', difficulty: 1, exampleEn: 'Jump high', exampleHe: 'קפוץ גבוה' },
    { englishWord: 'walk', hebrewTranslation: 'ללכת', category: 'Actions', difficulty: 1, exampleEn: 'I walk to school', exampleHe: 'אני הולך לבית ספר' },
    { englishWord: 'sit', hebrewTranslation: 'לשבת', category: 'Actions', difficulty: 1, exampleEn: 'Sit down', exampleHe: 'שב' },
    { englishWord: 'stand', hebrewTranslation: 'לעמוד', category: 'Actions', difficulty: 1, exampleEn: 'Stand up', exampleHe: 'עמוד' },
    { englishWord: 'eat', hebrewTranslation: 'לאכול', category: 'Actions', difficulty: 1, exampleEn: 'I eat breakfast', exampleHe: 'אני אוכל ארוחת בוקר' },
    { englishWord: 'drink', hebrewTranslation: 'לשתות', category: 'Actions', difficulty: 1, exampleEn: 'Drink water', exampleHe: 'שתה מים' },
    { englishWord: 'sleep', hebrewTranslation: 'לישון', category: 'Actions', difficulty: 1, exampleEn: 'I sleep at night', exampleHe: 'אני ישן בלילה' },
    { englishWord: 'play', hebrewTranslation: 'לשחק', category: 'Actions', difficulty: 1, exampleEn: 'I play outside', exampleHe: 'אני משחק בחוץ' },
    { englishWord: 'read', hebrewTranslation: 'לקרוא', category: 'Actions', difficulty: 1, exampleEn: 'I read books', exampleHe: 'אני קורא ספרים' },
    { englishWord: 'write', hebrewTranslation: 'לכתוב', category: 'Actions', difficulty: 1, exampleEn: 'Write your name', exampleHe: 'כתוב את השם שלך' },
    { englishWord: 'draw', hebrewTranslation: 'לצייר', category: 'Actions', difficulty: 1, exampleEn: 'I draw pictures', exampleHe: 'אני מצייר תמונות' },
    { englishWord: 'sing', hebrewTranslation: 'לשיר', category: 'Actions', difficulty: 1, exampleEn: 'Sing a song', exampleHe: 'שיר שיר' },
    { englishWord: 'dance', hebrewTranslation: 'לרקוד', category: 'Actions', difficulty: 1, exampleEn: 'I love to dance', exampleHe: 'אני אוהב לרקוד' },

    // Nature
    { englishWord: 'tree', hebrewTranslation: 'עץ', category: 'Nature', difficulty: 1, exampleEn: 'The tree is tall', exampleHe: 'העץ גבוה' },
    { englishWord: 'flower', hebrewTranslation: 'פרח', category: 'Nature', difficulty: 1, exampleEn: 'Beautiful flower', exampleHe: 'פרח יפה' },
    { englishWord: 'grass', hebrewTranslation: 'דשא', category: 'Nature', difficulty: 1, exampleEn: 'Green grass', exampleHe: 'דשא ירוק' },
    { englishWord: 'sun', hebrewTranslation: 'שמש', category: 'Nature', difficulty: 1, exampleEn: 'The sun is bright', exampleHe: 'השמש בוהקת' },
    { englishWord: 'moon', hebrewTranslation: 'ירח', category: 'Nature', difficulty: 1, exampleEn: 'The moon is round', exampleHe: 'הירח עגול' },
    { englishWord: 'star', hebrewTranslation: 'כוכב', category: 'Nature', difficulty: 1, exampleEn: 'Stars in the sky', exampleHe: 'כוכבים בשמיים' },
    { englishWord: 'cloud', hebrewTranslation: 'ענן', category: 'Nature', difficulty: 1, exampleEn: 'White cloud', exampleHe: 'ענן לבן' },
    { englishWord: 'rain', hebrewTranslation: 'גשם', category: 'Nature', difficulty: 1, exampleEn: 'It is raining', exampleHe: 'יורד גשם' },
    { englishWord: 'snow', hebrewTranslation: 'שלג', category: 'Nature', difficulty: 1, exampleEn: 'White snow', exampleHe: 'שלג לבן' },
    { englishWord: 'wind', hebrewTranslation: 'רוח', category: 'Nature', difficulty: 1, exampleEn: 'Strong wind', exampleHe: 'רוח חזקה' },

    // Numbers
    { englishWord: 'one', hebrewTranslation: 'אחד', category: 'Numbers', difficulty: 1, exampleEn: 'One apple', exampleHe: 'תפוח אחד' },
    { englishWord: 'two', hebrewTranslation: 'שניים', category: 'Numbers', difficulty: 1, exampleEn: 'Two books', exampleHe: 'שני ספרים' },
    { englishWord: 'three', hebrewTranslation: 'שלושה', category: 'Numbers', difficulty: 1, exampleEn: 'Three cats', exampleHe: 'שלושה חתולים' },
    { englishWord: 'four', hebrewTranslation: 'ארבעה', category: 'Numbers', difficulty: 1, exampleEn: 'Four chairs', exampleHe: 'ארבעה כיסאות' },
    { englishWord: 'five', hebrewTranslation: 'חמישה', category: 'Numbers', difficulty: 1, exampleEn: 'Five fingers', exampleHe: 'חמש אצבעות' },
    { englishWord: 'ten', hebrewTranslation: 'עשרה', category: 'Numbers', difficulty: 1, exampleEn: 'Ten students', exampleHe: 'עשרה תלמידים' },

    // Time
    { englishWord: 'morning', hebrewTranslation: 'בוקר', category: 'Time', difficulty: 1, exampleEn: 'Good morning', exampleHe: 'בוקר טוב' },
    { englishWord: 'afternoon', hebrewTranslation: 'צהריים', category: 'Time', difficulty: 1, exampleEn: 'Good afternoon', exampleHe: 'צהריים טובים' },
    { englishWord: 'evening', hebrewTranslation: 'ערב', category: 'Time', difficulty: 1, exampleEn: 'Good evening', exampleHe: 'ערב טוב' },
    { englishWord: 'night', hebrewTranslation: 'לילה', category: 'Time', difficulty: 1, exampleEn: 'Good night', exampleHe: 'לילה טוב' },
    { englishWord: 'today', hebrewTranslation: 'היום', category: 'Time', difficulty: 1, exampleEn: 'Today is Monday', exampleHe: 'היום יום שני' },
    { englishWord: 'tomorrow', hebrewTranslation: 'מחר', category: 'Time', difficulty: 1, exampleEn: 'See you tomorrow', exampleHe: 'נתראה מחר' },
    { englishWord: 'yesterday', hebrewTranslation: 'אתמול', category: 'Time', difficulty: 1, exampleEn: 'Yesterday was fun', exampleHe: 'אתמול היה כיף' },

    // Clothing
    { englishWord: 'shirt', hebrewTranslation: 'חולצה', category: 'Clothing', difficulty: 1, exampleEn: 'Blue shirt', exampleHe: 'חולצה כחולה' },
    { englishWord: 'pants', hebrewTranslation: 'מכנסיים', category: 'Clothing', difficulty: 1, exampleEn: 'Black pants', exampleHe: 'מכנסיים שחורים' },
    { englishWord: 'shoes', hebrewTranslation: 'נעליים', category: 'Clothing', difficulty: 1, exampleEn: 'New shoes', exampleHe: 'נעליים חדשות' },
    { englishWord: 'hat', hebrewTranslation: 'כובע', category: 'Clothing', difficulty: 1, exampleEn: 'Wear a hat', exampleHe: 'חבוש כובע' },
    { englishWord: 'dress', hebrewTranslation: 'שמלה', category: 'Clothing', difficulty: 1, exampleEn: 'Beautiful dress', exampleHe: 'שמלה יפה' },
    { englishWord: 'socks', hebrewTranslation: 'גרביים', category: 'Clothing', difficulty: 1, exampleEn: 'Warm socks', exampleHe: 'גרביים חמות' },

    // Sports
    { englishWord: 'ball', hebrewTranslation: 'כדור', category: 'Sports', difficulty: 1, exampleEn: 'Kick the ball', exampleHe: 'בעוט בכדור' },
    { englishWord: 'soccer', hebrewTranslation: 'כדורגל', category: 'Sports', difficulty: 1, exampleEn: 'I play soccer', exampleHe: 'אני משחק כדורגל' },
    { englishWord: 'basketball', hebrewTranslation: 'כדורסל', category: 'Sports', difficulty: 1, exampleEn: 'Basketball is fun', exampleHe: 'כדורסל זה כיף' },
    { englishWord: 'swim', hebrewTranslation: 'לשחות', category: 'Sports', difficulty: 1, exampleEn: 'I swim in the pool', exampleHe: 'אני שוחה בבריכה' },
    { englishWord: 'bike', hebrewTranslation: 'אופניים', category: 'Sports', difficulty: 1, exampleEn: 'Ride a bike', exampleHe: 'רכב על אופניים' },

    // More Home items
    { englishWord: 'pillow', hebrewTranslation: 'כרית', category: 'Home', difficulty: 1, exampleEn: 'Soft pillow', exampleHe: 'כרית רכה' },
    { englishWord: 'blanket', hebrewTranslation: 'שמיכה', category: 'Home', difficulty: 1, exampleEn: 'Warm blanket', exampleHe: 'שמיכה חמה' },
    { englishWord: 'mirror', hebrewTranslation: 'מראה', category: 'Home', difficulty: 1, exampleEn: 'Look in the mirror', exampleHe: 'הסתכל במראה' },
    { englishWord: 'clock', hebrewTranslation: 'שעון', category: 'Home', difficulty: 1, exampleEn: 'What time is it?', exampleHe: 'מה השעה?' },
    { englishWord: 'key', hebrewTranslation: 'מפתח', category: 'Home', difficulty: 1, exampleEn: 'House key', exampleHe: 'מפתח בית' },
    { englishWord: 'box', hebrewTranslation: 'קופסה', category: 'Home', difficulty: 1, exampleEn: 'Big box', exampleHe: 'קופסה גדולה' },
    { englishWord: 'bag', hebrewTranslation: 'תיק', category: 'Home', difficulty: 1, exampleEn: 'Shopping bag', exampleHe: 'תיק קניות' },
    { englishWord: 'bottle', hebrewTranslation: 'בקבוק', category: 'Home', difficulty: 1, exampleEn: 'Water bottle', exampleHe: 'בקבוק מים' },
    { englishWord: 'knife', hebrewTranslation: 'סכין', category: 'Home', difficulty: 1, exampleEn: 'Sharp knife', exampleHe: 'סכין חדה' },
    { englishWord: 'scissors', hebrewTranslation: 'מספריים', category: 'Home', difficulty: 1, exampleEn: 'Cut with scissors', exampleHe: 'גזור עם מספריים' },
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
