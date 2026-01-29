'use client';

import { useState } from 'react';
import { verifyPIN, setPIN } from '@/app/actions/auth';
import { useSession } from 'next-auth/react';

interface PINGateProps {
  onVerified: () => void;
}

export default function PINGate({ onVerified }: PINGateProps) {
  const { data: session } = useSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim();
    if (!cleanPin) return;

    setError('');
    const isValid = await verifyPIN(cleanPin);
    if (isValid) {
      onVerified();
    } else {
      setError('PIN שגוי, נסה שוב');
      setPin('');
    }
  };

  const handlePINReset = async () => {
    if (!session?.user?.email) return;

    if (confirm('האם אתה בטוח שברצונך לאפס את ה-PIN ל-1234?')) {
      setIsResetting(true);
      try {
        await setPIN('1234');
        alert('ה-PIN אופס בהצלחה ל-1234');
        setPin('1234');
        setError('');
      } catch (err) {
        setError('שגיאה באיפוס ה-PIN');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9FF] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-10 md:p-12 max-w-md w-full text-center relative z-10 border border-neutral-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-indigo-100 transform rotate-3">
            <span className="text-4xl transform -rotate-3">🔐</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-[900] text-indigo-600 mb-2 tracking-tight">כניסת הורים</h1>
          <p className="text-lg text-neutral-500 font-bold tracking-tight">אנא הכנס קוד PIN כדי להמשיך</p>
        </div>

        <form onSubmit={handlePINSubmit} className="space-y-8">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              className="w-full px-6 py-6 border-2 border-neutral-100 bg-neutral-50 rounded-3xl text-center text-4xl tracking-[0.5em] font-black focus:border-indigo-500 focus:bg-white focus:outline-none transition-all shadow-inner"
              autoFocus
              maxLength={4}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold animate-shake">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              type="submit"
              disabled={pin.length < 4}
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl text-xl font-black shadow-[0_8px_0_0_#4338ca] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              אישור והמשך
            </button>

            {session?.user?.email && (
              <button
                type="button"
                onClick={handlePINReset}
                disabled={isResetting}
                className="w-full text-sm text-neutral-400 font-bold hover:text-indigo-600 transition-colors py-2 flex items-center justify-center gap-2"
              >
                <span>שכחתי PIN / איפוס ל-1234</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
