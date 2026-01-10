'use client';

interface ParentNavProps {
  activeTab: 'children' | 'words' | 'plan' | 'dashboard' | 'settings';
  onTabChange: (tab: 'children' | 'words' | 'plan' | 'dashboard' | 'settings') => void;
}

export default function ParentNav({ activeTab, onTabChange }: ParentNavProps) {
  const tabs = [
    { id: 'children' as const, label: 'ילדים', icon: '👶' },
    { id: 'words' as const, label: 'ניהול מילים', icon: '📚' },
    { id: 'plan' as const, label: 'תוכנית יומית', icon: '📅' },
    { id: 'dashboard' as const, label: 'דשבורד התקדמות', icon: '📊' },
    { id: 'settings' as const, label: 'הגדרות', icon: '⚙️' },
  ];

  return (
    <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
      <div className="flex overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="text-xl ml-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
