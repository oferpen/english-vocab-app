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
      // Check if we already have a stored return path (set before navigation)
      const storedReturnTo = sessionStorage.getItem('parentPanelReturnTo');
      
      // If we don't have a stored path, try to use referrer
      if (!storedReturnTo) {
        const referrer = document.referrer;
        const currentOrigin = window.location.origin;
        
        // Only store if referrer is from our app and not the parent panel itself
        if (referrer && referrer.startsWith(currentOrigin) && !referrer.includes('/parent')) {
          sessionStorage.setItem('parentPanelReturnTo', referrer.replace(currentOrigin, ''));
        } else {
          // Fallback: if no referrer, default to learn path
          sessionStorage.setItem('parentPanelReturnTo', '/learn/path');
        }
      }
    }
  }, []);

  // Load active child when PIN is verified
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
        // Error loading active child
      }
  };

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

  // Hide content immediately when exiting
  if (isExiting) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleExit = () => {
    // Hide content immediately for instant feedback
    setIsExiting(true);
    
    // Get stored return path or fallback to home
    if (typeof window !== 'undefined') {
      const returnTo = sessionStorage.getItem('parentPanelReturnTo');
      sessionStorage.removeItem('parentPanelReturnTo'); // Clean up
      
      if (returnTo && returnTo !== '/parent') {
        window.location.href = returnTo;
      } else {
        window.location.href = '/';
      }
    }
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
      {pinVerified && activeChild && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <ChildSwitcher 
            currentChildId={activeChild.id} 
            currentChildName={activeChild.name}
            onChildSwitched={loadActiveChild}
          />
        </div>
      )}
      <ParentNav activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="pb-20">
        {activeTab === 'children' && <ChildrenManagement />}
        {activeTab === 'dashboard' && <ProgressDashboard />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}
