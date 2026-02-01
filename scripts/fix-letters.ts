import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLetters() {
    const updates = [
        { letter: 'G', hebrewName: "ג'י" },
        { letter: 'H', hebrewName: "אייץ'" },
        { letter: 'J', hebrewName: "ג'יי" },
    ];

    console.log('🔄 Updating letter transcriptions...');

    for (const update of updates) {
        const result = await prisma.letter.updateMany({
            where: { letter: update.letter },
            data: { hebrewName: update.hebrewName },
        });
        console.log(`✅ Updated ${update.letter}: ${result.count} record(s)`);
    }

    console.log('✨ All letters updated successfully.');
}

fixLetters()
    .catch((e) => {
        console.error('❌ Error updating letters:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
