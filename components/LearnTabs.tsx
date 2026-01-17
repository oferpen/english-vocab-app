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
      <div className="flex border-b-2 border-gray-200">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex-1 py-4 md:py-5 text-center font-semibold transition-all duration-200 ${
            activeTab === 'today'
              ? 'border-b-3 border-primary-600 text-primary-600 font-bold bg-primary-50/50'
              : 'text-gray-500 hover:text-primary-500 hover:bg-gray-50'
          }`}
        >
          <span className="text-base md:text-lg">היום</span>
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`flex-1 py-4 md:py-5 text-center font-semibold transition-all duration-200 ${
            activeTab === 'extra'
              ? 'border-b-3 border-primary-600 text-primary-600 font-bold bg-primary-50/50'
              : 'text-gray-500 hover:text-primary-500 hover:bg-gray-50'
          }`}
        >
          <span className="text-base md:text-lg">עוד ללמוד</span>
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
