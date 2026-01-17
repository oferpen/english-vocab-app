import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // Delete all children
    const deletedChildren = await prisma.childProfile.deleteMany({});
    
    // Delete all parent accounts
    const deletedParents = await prisma.parentAccount.deleteMany({});
    
    return NextResponse.json({
      success: true,
      deletedChildren: deletedChildren.count,
      deletedParents: deletedParents.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
