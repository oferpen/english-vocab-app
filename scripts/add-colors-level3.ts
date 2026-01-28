import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addColorsLevel3() {
  console.log('🎨 Adding Colors category words with difficulty 2 (Level 3)...');

  const colorsLevel3Words = [
    { englishWord: 'light', hebrewTranslation: 'בהיר', category: 'Colors', difficulty: 2, exampleEn: 'Light blue', exampleHe: 'כחול בהיר' },
    { englishWord: 'dark', hebrewTranslation: 'כהה', category: 'Colors', difficulty: 2, exampleEn: 'Dark green', exampleHe: 'ירוק כהה' },
    { englishWord: 'bright', hebrewTranslation: 'זוהר', category: 'Colors', difficulty: 2, exampleEn: 'Bright yellow', exampleHe: 'צהוב זוהר' },
    { englishWord: 'pale', hebrewTranslation: 'חיוור', category: 'Colors', difficulty: 2, exampleEn: 'Pale pink', exampleHe: 'ורוד חיוור' },
    { englishWord: 'deep', hebrewTranslation: 'עמוק', category: 'Colors', difficulty: 2, exampleEn: 'Deep blue', exampleHe: 'כחול עמוק' },
    { englishWord: 'soft', hebrewTranslation: 'רך', category: 'Colors', difficulty: 2, exampleEn: 'Soft color', exampleHe: 'צבע רך' },
    { englishWord: 'vivid', hebrewTranslation: 'עז', category: 'Colors', difficulty: 2, exampleEn: 'Vivid red', exampleHe: 'אדום עז' },
    { englishWord: 'muted', hebrewTranslation: 'מעומעם', category: 'Colors', difficulty: 2, exampleEn: 'Muted tone', exampleHe: 'גוון מעומעם' },
    { englishWord: 'neon', hebrewTranslation: 'ניאון', category: 'Colors', difficulty: 2, exampleEn: 'Neon green', exampleHe: 'ירוק ניאון' },
    { englishWord: 'pastel', hebrewTranslation: 'פסטל', category: 'Colors', difficulty: 2, exampleEn: 'Pastel blue', exampleHe: 'כחול פסטל' },
    { englishWord: 'shiny', hebrewTranslation: 'מבריק', category: 'Colors', difficulty: 2, exampleEn: 'Shiny gold', exampleHe: 'זהב מבריק' },
    { englishWord: 'matte', hebrewTranslation: 'מט', category: 'Colors', difficulty: 2, exampleEn: 'Matte finish', exampleHe: 'גימור מט' },
    { englishWord: 'glossy', hebrewTranslation: 'מבריק', category: 'Colors', difficulty: 2, exampleEn: 'Glossy surface', exampleHe: 'משטח מבריק' },
    { englishWord: 'dull', hebrewTranslation: 'מעומעם', category: 'Colors', difficulty: 2, exampleEn: 'Dull color', exampleHe: 'צבע מעומעם' },
    { englishWord: 'rich', hebrewTranslation: 'עשיר', category: 'Colors', difficulty: 2, exampleEn: 'Rich purple', exampleHe: 'סגול עשיר' },
    { englishWord: 'faded', hebrewTranslation: 'דהוי', category: 'Colors', difficulty: 2, exampleEn: 'Faded jeans', exampleHe: 'ג\'ינס דהוי' },
    { englishWord: 'vibrant', hebrewTranslation: 'חי', category: 'Colors', difficulty: 2, exampleEn: 'Vibrant orange', exampleHe: 'כתום חי' },
    { englishWord: 'subtle', hebrewTranslation: 'עדין', category: 'Colors', difficulty: 2, exampleEn: 'Subtle shade', exampleHe: 'גוון עדין' },
    { englishWord: 'bold', hebrewTranslation: 'מודגש', category: 'Colors', difficulty: 2, exampleEn: 'Bold color', exampleHe: 'צבע מודגש' },
    { englishWord: 'transparent', hebrewTranslation: 'שקוף', category: 'Colors', difficulty: 2, exampleEn: 'Transparent glass', exampleHe: 'זכוכית שקופה' },
  ];

  let added = 0;
  let skipped = 0;

  for (const wordData of colorsLevel3Words) {
    try {
      // Check if word already exists
      const existing = await prisma.word.findFirst({
        where: {
          englishWord: wordData.englishWord,
          category: wordData.category,
        },
      });

      if (existing) {
        // Update existing word to ensure it has correct difficulty
        if (existing.difficulty !== wordData.difficulty) {
          await prisma.word.update({
            where: { id: existing.id },
            data: { difficulty: wordData.difficulty, active: true },
          });
          console.log(`✅ Updated: ${wordData.englishWord} (difficulty: ${existing.difficulty} → ${wordData.difficulty})`);
          added++;
        } else {
          console.log(`⏭️  Skipped: ${wordData.englishWord} (already exists with correct difficulty)`);
          skipped++;
        }
      } else {
        // Create new word
        await prisma.word.create({
          data: {
            ...wordData,
            active: true,
          },
        });
        console.log(`➕ Added: ${wordData.englishWord} - ${wordData.hebrewTranslation}`);
        added++;
      }
    } catch (error: any) {
      console.error(`❌ Error adding ${wordData.englishWord}:`, error.message);
    }
  }

  console.log(`\n✨ Done! Added/Updated: ${added}, Skipped: ${skipped}`);
  await prisma.$disconnect();
}

addColorsLevel3()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
