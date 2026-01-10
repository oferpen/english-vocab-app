'use client';

import { useState } from 'react';
import { verifyPIN } from '@/app/actions/auth';
import { getAllChildren, setActiveChild } from '@/app/actions/children';
import { useRouter } from 'next/navigation';

export default function ChildSwitchLock() {
  const [showPIN, setShowPIN] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showChildren, setShowChildren] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const router = useRouter();

  const handleLockClick = async () => {
    setShowPIN(true);
    setError('');
    setPin('');
  };

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyPIN(pin);
    if (isValid) {
      const kids = await getAllChildren();
      setChildren(kids);
      setShowPIN(false);
      setShowChildren(true);
    } else {
      setError('PIN שגוי');
    }
  };

  const handleChildSelect = async (childId: string) => {
    const selectedChild = children.find(c => c.id === childId);
    await setActiveChild(childId);
    setShowChildren(false);
    setShowPIN(false);
    // Refresh to update the UI with the new active child
    router.refresh();
  };

  if (showChildren) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4">בחר ילד/ה</h2>
          {children.length === 0 ? (
            <p className="text-gray-600 text-center py-4">אין ילדים במערכת</p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleChildSelect(child.id)}
                  className="w-full text-right p-3 border rounded-lg hover:bg-gray-50"
                >
                  <span className="text-2xl ml-2">{child.avatar || '👶'}</span>
                  {child.name}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => {
              setShowChildren(false);
              setShowPIN(false);
            }}
            className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded-lg"
          >
            ביטול
          </button>
        </div>
      </div>
    );
  }

  if (showPIN) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4">הכנס PIN</h2>
          <form onSubmit={handlePINSubmit}>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4 text-center text-2xl"
              placeholder="PIN"
              autoFocus
            />
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowPIN(false);
                  setPin('');
                  setError('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                אישור
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleLockClick}
      className="p-2 text-gray-600 hover:text-gray-800"
      aria-label="החלף ילד"
    >
      🔒
    </button>
  );
}
