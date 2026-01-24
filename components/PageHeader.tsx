'use client';

import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  childName?: string;
  avatar?: string | null;
  currentChildId?: string;
  showParentPanel?: boolean;
  backHref?: string;
}

export default function PageHeader({ title, childName, avatar, currentChildId, showParentPanel = false, backHref }: PageHeaderProps) {
  return (
    <header className="bg-gradient-to-r from-primary-50 to-white border-b border-primary-100 sticky top-0 z-30">
      <div className="flex items-center justify-between p-3 md:p-4">
        {childName ? (
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            {/* Avatar with subtle shadow */}
            <div className="relative">
              <div className="absolute inset-0 bg-primary-200 rounded-full blur-sm opacity-50"></div>
              <span className="relative text-4xl md:text-5xl block transform hover:scale-105 transition-transform">
                {avatar || '👶'}
              </span>
            </div>
            
            {/* Child info */}
            <div className="flex-1 min-w-0">
              <p className="text-base md:text-lg font-bold text-gray-800 truncate">
                שלום {childName}!
              </p>
              {title && (
                <p className="text-xs md:text-sm text-primary-600 font-medium mt-0.5">
                  {title}
                </p>
              )}
            </div>
          </div>
        ) : title ? (
          <div className="flex-1">
            <h1 className="text-lg md:text-xl font-bold text-gray-800">{title}</h1>
          </div>
        ) : (
          <div className="flex-1"></div>
        )}
        
        {/* Back button on the right */}
        {backHref && (
          <Link
            href={backHref}
            prefetch={false}
            className="inline-flex items-center justify-center text-primary-600 hover:text-primary-700 font-semibold transition-colors ml-3"
            aria-label="חזור לנתיב"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
