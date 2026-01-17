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
    <header className="bg-white shadow-sm border-b">
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3">
          {childName && (
            <>
              <span className="text-2xl">{avatar || '👶'}</span>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                <p className="text-sm text-gray-600">שלום {childName}!</p>
              </div>
            </>
          )}
          {!childName && <h1 className="text-xl font-bold text-gray-800">{title}</h1>}
        </div>
        {childName && (
          <div className="flex items-center gap-3">
            <Link
              href="/parent"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              🔐 פאנל הורים
            </Link>
            <LogoutButton />
          </div>
        )}
      </div>
      {childName && currentChildId && (
        <div className="px-4 pb-2">
          <ChildSwitcher currentChildId={currentChildId} currentChildName={childName} />
        </div>
      )}
    </header>
  );
}
