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
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="flex justify-between items-center p-4 md:p-5">
        <div className="flex items-center gap-3 md:gap-4">
          {childName && (
            <>
              <span className="text-3xl md:text-4xl">{avatar || '👶'}</span>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>
                <p className="text-sm md:text-base text-gray-600 font-medium">שלום {childName}!</p>
              </div>
            </>
          )}
          {!childName && <h1 className="text-xl md:text-2xl font-bold text-gray-800">{title}</h1>}
        </div>
        {childName && (
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              href="/parent"
              className="text-sm md:text-base text-primary-600 hover:text-primary-700 font-semibold transition-colors duration-200"
            >
              🔐 פאנל הורים
            </Link>
            <LogoutButton />
          </div>
        )}
      </div>
      {childName && currentChildId && (
        <div className="px-4 md:px-5 pb-3">
          <ChildSwitcher currentChildId={currentChildId} currentChildName={childName} />
        </div>
      )}
    </header>
  );
}
