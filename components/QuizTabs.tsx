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
          חידון היום
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`flex-1 py-3 text-center font-medium ${
            activeTab === 'extra'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600'
          }`}
        >
          תרגול נוסף
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
