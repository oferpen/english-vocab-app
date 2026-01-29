import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function showLevel2Words() {
  try {
    // Level 2 = difficulty 1
    const words = await prisma.word.findMany({
      where: {
        difficulty: 1,
        active: true,
      },
      orderBy: [
        { category: 'asc' },
        { englishWord: 'asc' },
      ],
    });

    // Group by category
    const byCategory: Record<string, typeof words> = {};
    words.forEach((word) => {
      const category = word.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(word);
    });

    let output = '\n📚 LEVEL 2 WORDS (Difficulty 1)\n';
    output += '='.repeat(70) + '\n';

    // Sort categories and display
    Object.keys(byCategory)
      .sort()
      .forEach((category) => {
        output += '\n' + '='.repeat(70) + '\n';
        output += `📁 ${category}\n`;
        output += '='.repeat(70) + '\n';
        byCategory[category].forEach((word, index) => {
          output += `  ${(index + 1).toString().padStart(2)}. ${word.englishWord.padEnd(25)} - ${word.hebrewTranslation}\n`;
        });
      });

    output += '\n' + '='.repeat(70) + '\n';
    output += `Total: ${words.length} words\n`;
    output += '='.repeat(70) + '\n';

    // Write to file
    fs.writeFileSync('LEVEL2_WORDS.txt', output);
    console.log(output);
    console.log('\n✅ Words list also saved to LEVEL2_WORDS.txt');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showLevel2Words();
