'use client';

import { useState, useEffect } from 'react';
import { verifyPIN } from '@/app/actions/auth';
import PINGate from './PINGate';
import ParentNav from './ParentNav';
import ChildrenManagement from './ChildrenManagement';
import WordsManagement from './WordsManagement';
import DailyPlanManagement from './DailyPlanManagement';
import ProgressDashboard from './ProgressDashboard';
import SettingsPanel from './SettingsPanel';

export default function ParentPanel() {
  const [verified, setVerified] = useState(false);
  const [activeTab, setActiveTab] = useState<'children' | 'words' | 'plan' | 'dashboard' | 'settings'>('children');

  if (!verified) {
    return <PINGate onVerified={() => setVerified(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4">
        <h1 className="text-2xl font-bold text-center">פאנל הורים</h1>
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
