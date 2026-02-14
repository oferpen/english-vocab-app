'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ParentNav from './ParentNav';
import SettingsPanel from './SettingsPanel';
import ProgressDashboard from './ProgressDashboard';

interface ParentPanelProps {
  userId: string;
}

export default function ParentPanel({ userId }: ParentPanelProps) {
  const [activeTab, setActiveTab] = useState<'children' | 'dashboard' | 'settings'>('settings');
  const router = useRouter();

  // Check if there's a return path stored
  const handleBack = () => {
    if (typeof window !== 'undefined') {
      const returnTo = sessionStorage.getItem('parentPanelReturnTo');
      if (returnTo) {
        sessionStorage.removeItem('parentPanelReturnTo');
        router.push(returnTo);
      } else {
        router.push('/learn/path');
      }
    } else {
      router.push('/learn/path');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 font-bold transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              חזור
            </button>
            <h1 className="text-2xl font-black text-neutral-800">פאנל הורים</h1>
            <div className="w-20"></div> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ParentNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'settings' && <SettingsPanel />}
        {activeTab === 'dashboard' && <ProgressDashboard userId={userId} />}
        {activeTab === 'children' && (
          <div className="bg-white rounded-[2.5rem] shadow-lg border border-neutral-100 p-12 text-center">
            <p className="text-neutral-500 font-bold text-lg">ניהול ילדים - בקרוב</p>
            <p className="text-neutral-400 text-sm mt-2">פיצ'ר זה יגיע בקרוב</p>
          </div>
        )}
      </div>
    </div>
  );
}
