import { Users, BarChart3, Settings } from 'lucide-react';

interface ParentNavProps {
  activeTab: 'children' | 'dashboard' | 'settings';
  onTabChange: (tab: 'children' | 'dashboard' | 'settings') => void;
}

export default function ParentNav({ activeTab, onTabChange }: ParentNavProps) {
  const tabs = [
    { id: 'children' as const, label: 'ניהול ילדים', Icon: Users },
    { id: 'dashboard' as const, label: 'דשבורד התקדמות', Icon: BarChart3 },
    { id: 'settings' as const, label: 'הגדרות', Icon: Settings },
  ];

  return (
    <nav className="flex items-center justify-center p-1.5 bg-white rounded-3xl shadow-sm border border-neutral-100 max-w-fit mx-auto sticky top-24 z-20">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all duration-300
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-105'
                  : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'
                }
              `}
            >
              <tab.Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-300'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
