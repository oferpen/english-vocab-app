import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testPIN() {
  try {
    // Get all parent accounts
    const accounts = await prisma.parentAccount.findMany();
    console.log(`Found ${accounts.length} parent accounts`);
    
    if (accounts.length === 0) {
      console.log('❌ No parent accounts found! Run: npm run db:seed');
      return;
    }
    
    // Test PIN "1234" against all accounts
    const testPIN = '1234';
    console.log(`\nTesting PIN: ${testPIN}\n`);
    
    for (const account of accounts) {
      console.log(`Account ID: ${account.id}`);
      console.log(`  Email: ${account.email || 'none'}`);
      console.log(`  Has PIN hash: ${!!account.pinHash}`);
      
      if (account.pinHash) {
        const match = await bcrypt.compare(testPIN, account.pinHash);
        console.log(`  PIN match: ${match ? '✅ YES' : '❌ NO'}`);
        
        if (match) {
          console.log(`\n✅ PIN "${testPIN}" works for account ${account.id}!`);
        }
      } else {
        console.log(`  ⚠️  No PIN hash set`);
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPIN();
