'use client';

import { useState } from 'react';
import QuizToday from './QuizToday';
import QuizExtra from './QuizExtra';

interface QuizTabsProps {
  childId: string;
  todayPlan: any;
}

export default function QuizTabs({ childId, todayPlan }: QuizTabsProps) {
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
          <span className="text-base md:text-lg">חידון היום</span>
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`flex-1 py-4 md:py-5 text-center font-semibold transition-all duration-200 ${
            activeTab === 'extra'
              ? 'border-b-3 border-primary-600 text-primary-600 font-bold bg-primary-50/50'
              : 'text-gray-500 hover:text-primary-500 hover:bg-gray-50'
          }`}
        >
          <span className="text-base md:text-lg">תרגול נוסף</span>
        </button>
      </div>
      {activeTab === 'today' ? (
        <QuizToday childId={childId} todayPlan={todayPlan} />
      ) : (
        <QuizExtra childId={childId} />
      )}
    </div>
  );
}
