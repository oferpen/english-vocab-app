'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { verifyPIN } from '@/app/actions/auth';
import { getActiveChild } from '@/app/actions/children';
import PINGate from './PINGate';
import ParentNav from './ParentNav';
import ChildrenManagement from './ChildrenManagement';
import ProgressDashboard from './ProgressDashboard';
import SettingsPanel from './SettingsPanel';
import ChildSwitcher from './ChildSwitcher';
import { ArrowRight, LogOut, ShieldCheck } from 'lucide-react';

interface ParentPanelProps {
  session?: any;
}

export default function ParentPanel({ session: initialSession }: ParentPanelProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'children' | 'dashboard' | 'settings'>('children');
  const [pinVerified, setPinVerified] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [activeChild, setActiveChild] = useState<any>(null);

  // Store referrer when component mounts (before PIN gate)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedReturnTo = sessionStorage.getItem('parentPanelReturnTo');
      if (!storedReturnTo) {
        const referrer = document.referrer;
        const currentOrigin = window.location.origin;
        if (referrer && referrer.startsWith(currentOrigin) && !referrer.includes('/parent')) {
          sessionStorage.setItem('parentPanelReturnTo', referrer.replace(currentOrigin, ''));
        } else {
          sessionStorage.setItem('parentPanelReturnTo', '/learn/path');
        }
      }
    }
  }, []);

  useEffect(() => {
    if (pinVerified) {
      loadActiveChild();
    }
  }, [pinVerified]);

  const loadActiveChild = async () => {
    try {
      const child = await getActiveChild();
      setActiveChild(child);
    } catch (error) {
      console.error('Error loading active child:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#F9F9FF] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!pinVerified) {
    return <PINGate onVerified={() => setPinVerified(true)} />;
  }

  if (isExiting) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/?loggedOut=true' });
  };

  const handleExit = () => {
    setIsExiting(true);
    if (typeof window !== 'undefined') {
      const returnTo = sessionStorage.getItem('parentPanelReturnTo');
      sessionStorage.removeItem('parentPanelReturnTo');
      window.location.href = (returnTo && returnTo !== '/parent') ? returnTo : '/';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF]">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-indigo-50 px-4 md:px-8 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all active:scale-95 text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה ללמידה</span>
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5" dir="ltr">
              <span className="text-neutral-900">English</span>
              <span className="text-indigo-600">Path</span>
              <span className="text-neutral-300 mx-1">|</span>
              <span className="text-neutral-400 font-bold text-sm md:text-base rtl">פאנל הורים</span>
            </h1>
            {session?.user?.email && (
              <p className="text-[10px] md:text-xs text-neutral-400 font-bold mt-0.5">
                {session.user.email}
              </p>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-all active:scale-95 text-sm"
            title="התנתק"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">התנתק</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {pinVerified && activeChild && (
          <div className="mb-8 bg-white p-4 rounded-3xl shadow-sm border border-neutral-100 flex items-center justify-center">
            <ChildSwitcher
              currentChildId={activeChild.id}
              currentChildName={activeChild.name}
              onChildSwitched={loadActiveChild}
            />
          </div>
        )}

        <ParentNav activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-8 pb-32">
          {activeTab === 'children' && <ChildrenManagement />}
          {activeTab === 'dashboard' && <ProgressDashboard />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}
