'use client';

import Link from 'next/link';
import LogoutButton from './LogoutButton';
import ChildSwitcher from './ChildSwitcher';

interface PageHeaderProps {
  title: string;
  childName?: string;
  avatar?: string | null;
  currentChildId?: string;
}

export default function PageHeader({ title, childName, avatar, currentChildId }: PageHeaderProps) {
  return (
    <header className="bg-white shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {childName && (
            <div className="mt-1">
              <p className="text-sm text-gray-600">
                שלום {childName}! {avatar || '👶'}
              </p>
              <ChildSwitcher currentChildId={currentChildId} currentChildName={childName} />
            </div>
          )}
        </div>
        {childName && (
          <div className="flex flex-col gap-2 items-end">
            <Link
              href="/parent"
              className="text-xs text-green-600 hover:text-green-800 underline"
            >
              🔐 פאנל הורים
            </Link>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
