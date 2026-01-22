import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function showWords() {
  const categories = ['Starter', 'Home', 'School', 'Animals', 'Colors', 'Food', 'Body', 'Family', 'Clothes', 'Nature', 'Transportation', 'Sports', 'Weather', 'Feelings', 'Numbers', 'Actions'];
  
  let output = '\n📚 ALL WORDS IN THE DATABASE\n';
  output += '='.repeat(70) + '\n';
  
  for (const category of categories) {
    output += '\n' + '='.repeat(70) + '\n';
    output += `📁 ${category}\n`;
    output += '='.repeat(70) + '\n';
    
    const level1Words = await prisma.word.findMany({
      where: { category, difficulty: 1 },
      select: { englishWord: true, hebrewTranslation: true },
      orderBy: { englishWord: 'asc' }
    });
    
    const level2Words = await prisma.word.findMany({
      where: { category, difficulty: 2 },
      select: { englishWord: true, hebrewTranslation: true },
      orderBy: { englishWord: 'asc' }
    });
    
    output += `\nLevel 2 (Basic - ${level1Words.length} words):\n`;
    level1Words.forEach((w, i) => {
      output += `  ${(i+1).toString().padStart(2)}. ${w.englishWord.padEnd(25)} - ${w.hebrewTranslation}\n`;
    });
    
    output += `\nLevel 3 (Advanced - ${level2Words.length} words):\n`;
    level2Words.forEach((w, i) => {
      output += `  ${(i+1).toString().padStart(2)}. ${w.englishWord.padEnd(25)} - ${w.hebrewTranslation}\n`;
    });
  }
  
  const total = await prisma.word.count();
  output += '\n' + '='.repeat(70) + '\n';
  output += `Total: ${total} words\n`;
  output += '='.repeat(70) + '\n';
  
  // Write to file
  fs.writeFileSync('WORDS_LIST.txt', output);
  console.log(output);
  console.log('\n✅ Words list also saved to WORDS_LIST.txt');
  
  await prisma.$disconnect();
}

showWords().catch(console.error);
