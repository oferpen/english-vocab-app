import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all users
    // Note: Due to cascade delete, this should clear derived data (Progress, QuizAttempts, etc.) if schema is set up right.
    const deletedUsers = await prisma.user.deleteMany({});

    return NextResponse.json({
      success: true,
      deletedUsers: deletedUsers.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
