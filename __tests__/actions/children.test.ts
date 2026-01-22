import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllChildren, createChild, setActiveChild, getActiveChild } from '@/app/actions/children';
import { prisma } from '@/__mocks__/prisma';

vi.mock('@/lib/auth-nextauth', () => ({
  getCurrentParentAccount: vi.fn(() => Promise.resolve({ id: 'parent-1' })),
}));

vi.mock('@/lib/auth-helper', () => ({
  getAuthSession: vi.fn(() => Promise.resolve({ user: { email: 'test@example.com' } })),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Children Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllChildren', () => {
    it('should return all children for parent', async () => {
      const mockChildren = [
        { id: 'child-1', name: 'ילד א', avatar: '👶', parentAccountId: 'parent-1' },
        { id: 'child-2', name: 'ילד ב', avatar: '👧', parentAccountId: 'parent-1' },
      ];

      (prisma.parentAccount.findFirst as any).mockResolvedValue({
        id: 'parent-1',
      });
      (prisma.childProfile.findMany as any).mockResolvedValue(mockChildren);

      const children = await getAllChildren();
      expect(children).toEqual(mockChildren);
    });

    it('should return empty array when no parent found', async () => {
      (prisma.parentAccount.findFirst as any).mockResolvedValue(null);
      (prisma.childProfile.findMany as any).mockResolvedValue([]);

      const children = await getAllChildren();
      expect(children).toEqual([]);
    });
  });

  describe('createChild', () => {
    it('should create a new child', async () => {
      const childData = {
        name: 'ילד חדש',
        avatar: '👶',
        age: 10,
        grade: 'ד',
      };

      (prisma.parentAccount.findFirst as any).mockResolvedValue({
        id: 'parent-1',
      });
      (prisma.childProfile.create as any).mockResolvedValue({
        id: 'child-new',
        ...childData,
        parentAccountId: 'parent-1',
      });

      // Mock revalidatePath to avoid Next.js errors
      vi.mock('next/cache', () => ({
        revalidatePath: vi.fn(),
      }));

      const child = await createChild(childData);
      expect(child).toBeDefined();
      expect(prisma.childProfile.create).toHaveBeenCalled();
    });
  });

  describe('setActiveChild', () => {
    it('should set active child', async () => {
      (prisma.childProfile.findUnique as any).mockResolvedValue({
        id: 'child-1',
        parentAccountId: 'parent-1',
      });
      (prisma.parentAccount.update as any).mockResolvedValue({
        id: 'parent-1',
        lastActiveChildId: 'child-1',
      });

      await setActiveChild('child-1');
      expect(prisma.parentAccount.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: { lastActiveChildId: 'child-1' },
      });
    });
  });
});
