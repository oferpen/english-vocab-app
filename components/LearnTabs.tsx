'use client';

import { useState } from 'react';
import LearnToday from './LearnToday';
import LearnExtra from './LearnExtra';

interface LearnTabsProps {
  childId: string;
  todayPlan: any;
}

export default function LearnTabs({ childId, todayPlan }: LearnTabsProps) {
  const [activeTab, setActiveTab] = useState<'today' | 'extra'>('today');

  return (
    <div>
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'today'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          היום
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'extra'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          עוד ללמוד
        </button>
      </div>
      {activeTab === 'today' ? (
        <LearnToday childId={childId} todayPlan={todayPlan} />
      ) : (
        <LearnExtra childId={childId} />
      )}
    </div>
  );
}
