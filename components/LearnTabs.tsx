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
    <div className="bg-white">
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'today'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          היום
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === 'extra'
              ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
              : 'text-gray-500 hover:text-gray-700'
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
