import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Push schema to database
    const { execSync } = require('child_process');
    execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
    return NextResponse.json({ success: true, message: 'Database setup complete' });
  } catch (error: any) {
    // Database setup error
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
