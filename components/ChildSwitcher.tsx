'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllChildren, setActiveChild } from '@/app/actions/children';

interface ChildSwitcherProps {
  currentChildId?: string;
  currentChildName?: string;
  onChildSwitched?: () => void;
}

export default function ChildSwitcher({ currentChildId, currentChildName, onChildSwitched }: ChildSwitcherProps) {
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMultipleChildren, setHasMultipleChildren] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load children on mount to check if switcher should be shown
    loadChildren();
  }, []);

  useEffect(() => {
    if (showSwitcher) {
      loadChildren();
    }
  }, [showSwitcher]);

  const loadChildren = async () => {
    setLoading(true);
    try {
      const kids = await getAllChildren();
      setChildren(kids);
      setHasMultipleChildren(kids.length > 1);
      } catch (error) {
        // Error loading children
      } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (childId: string) => {
    if (childId === currentChildId) {
      setShowSwitcher(false);
      return;
    }

    try {
      await setActiveChild(childId);
      setShowSwitcher(false);
      if (onChildSwitched) {
        onChildSwitched();
      }
      router.refresh();
      } catch (error) {
        // Error switching child
      }
  };

  // Don't show switcher if there's only one child or no children
  if (!hasMultipleChildren && !showSwitcher) {
    return null;
  }

  if (showSwitcher) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowSwitcher(false)}>
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">בחר ילד</h2>
            <button
              onClick={() => setShowSwitcher(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">טוען...</p>
            </div>
          ) : children.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">אין ילדים במערכת</p>
            </div>
          ) : (
            <div className="space-y-3">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleSwitch(child.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-right ${
                    child.id === currentChildId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{child.avatar || '👶'}</span>
                      <div>
                        <div className="font-bold text-lg">{child.name}</div>
                        {child.id === currentChildId && (
                          <div className="text-sm text-blue-600">פעיל</div>
                        )}
                      </div>
                    </div>
                    {child.id === currentChildId && (
                      <span className="text-blue-600 text-xl">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowSwitcher(true)}
      className="text-sm text-blue-600 hover:text-blue-800 underline"
    >
      🔄 החלף ילד
    </button>
  );
}
