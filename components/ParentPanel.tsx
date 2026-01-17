'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { verifyPIN } from '@/app/actions/auth';
import PINGate from './PINGate';
import ParentNav from './ParentNav';
import ChildrenManagement from './ChildrenManagement';
import WordsManagement from './WordsManagement';
import DailyPlanManagement from './DailyPlanManagement';
import ProgressDashboard from './ProgressDashboard';
import SettingsPanel from './SettingsPanel';

interface ParentPanelProps {
  session?: any;
}

export default function ParentPanel({ session: initialSession }: ParentPanelProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'children' | 'words' | 'plan' | 'dashboard' | 'settings'>('children');
  const [pinVerified, setPinVerified] = useState(false);

  // Always require PIN verification, regardless of Google session
  // Wait for session to load before showing PINGate
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // Always show PIN gate until PIN is verified
  if (!pinVerified) {
    return <PINGate onVerified={() => setPinVerified(true)} />;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleExit = () => {
    // Navigate immediately without resetting state to avoid flash
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <div className="flex justify-between items-center">
          <button
            onClick={handleExit}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← יציאה
          </button>
          <h1 className="text-2xl font-bold text-center flex-1">פאנל הורים</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
        {(session || initialSession || pinVerified) && (
          <div className="flex flex-col items-center mt-2">
            {session?.user?.email && (
              <p className="text-sm text-gray-600 text-center">
                מחובר כ: {session.user.email}
              </p>
            )}
            {pinVerified && !session && (
              <p className="text-sm text-gray-600 text-center">
                מחובר עם PIN
              </p>
            )}
            {(session || initialSession) && (
              <button
                onClick={handleSignOut}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                התנתק
              </button>
            )}
          </div>
        )}
      </header>
      <ParentNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="pb-20">
        {activeTab === 'children' && <ChildrenManagement />}
        {activeTab === 'words' && <WordsManagement />}
        {activeTab === 'plan' && <DailyPlanManagement />}
        {activeTab === 'dashboard' && <ProgressDashboard />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}
