'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getLevelState, getXPForNextLevel, getXPForLevel } from '@/app/actions/levels';
import CircularProgress from './CircularProgress';

interface ProgressSidePanelProps {
  userId: string;
  levelState?: any; // Optional - if provided, don't fetch it again
  progress?: any[]; // Optional - if provided, don't fetch it again
  streak?: number; // Optional - if provided, don't fetch it again
}

export default function ProgressSidePanel({
  userId,
  levelState: propLevelState,
  progress: propProgress,
  streak: propStreak,
}: ProgressSidePanelProps) {
  const [progress, setProgress] = useState<any[]>(propProgress || []);
  const [streak, setStreak] = useState(propStreak || 0);
  const [levelState, setLevelState] = useState<any>(propLevelState || null);
  const [loading, setLoading] = useState(!propProgress || !propLevelState); // Only loading if data not provided
  const [isOpen, setIsOpen] = useState(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (propLevelState) {
      setLevelState(propLevelState);
    }
    if (propProgress) {
      setProgress(propProgress);
    }
    if (propStreak !== undefined) {
      setStreak(propStreak);
    }

    // Only fetch if data not provided as props
    if ((!propProgress || !propLevelState || propStreak === undefined) && !isLoadingRef.current) {
      loadProgress();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, propProgress, propLevelState, propStreak]); // Depend on props to update when they change

  const loadProgress = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setLoading(true);

      // Only fetch what's missing
      const promises: Promise<any>[] = [];

      if (!propProgress) {
        promises.push(getAllProgress(userId).then(setProgress));
      }

      if (propStreak === undefined) {
        promises.push(getStreak(userId).then(setStreak));
      }

      if (!propLevelState) {
        promises.push(getLevelState(userId).then(setLevelState));
      }

      await Promise.all(promises);
    } catch (error) {
      // Error loading progress
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const calculateXPProgress = () => {
    if (!levelState || levelState.level >= 10) return 100;
    // Calculate XP progress synchronously
    const LEVEL_XP_REQUIREMENTS = [0, 50, 150];
    const xpForCurrent = LEVEL_XP_REQUIREMENTS[levelState.level - 1] || 0;
    const xpForNext = LEVEL_XP_REQUIREMENTS[levelState.level] || 300;
    if (xpForNext === xpForCurrent) return 100;
    return Math.max(0, Math.min(100, ((levelState.xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100));
  };

  if (loading || !levelState) {
    return null;
  }

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  const totalLearned = progress.filter((p) => p.timesSeenInLearn > 0).length;
  const needsReview = progress.filter((p) => p.needsReview).length;

  // Daily plans removed - track words learned today by lastSeenAt date
  const todayTotal = 0;
  const todayLearned = progress.filter((p) => {
    return p.lastSeenAt &&
      new Date(p.lastSeenAt).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
  }).length;

  const xpProgress = calculateXPProgress();

  return (
    <>
      {/* Toggle Buttons */}
      <div className="fixed left-4 top-24 z-40 flex flex-col gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-all"
          aria-label="הצג התקדמות"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <Link
          href="/parent"
          prefetch={false}
          onClick={() => {
            // Store current path before navigating to parent panel
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('parentPanelReturnTo', window.location.pathname);
            }
          }}
          className="bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all"
          aria-label="פאנל הורים"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </Link>
        <button
          onClick={async () => {
            const { signOut } = await import('next-auth/react');
            await signOut({ callbackUrl: '/?loggedOut=true' });
          }}
          className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 transition-all"
          aria-label="התנתק"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-6">
          {/* App Name */}
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">לומדים אנגלית</h1>
          </div>
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">התקדמות</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
              aria-label="סגור"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Level & XP */}
          <div className="bg-gradient-to-br from-white to-primary-50 rounded-xl shadow-md p-4 mb-4 border-2 border-primary-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-primary-600">רמה {levelState.level}</h3>
                <p className="text-base text-gray-700 font-semibold mt-1">{levelState.xp} נקודות נסיון</p>
              </div>
              <div className="text-4xl">⭐</div>
            </div>
            {levelState.level < 10 && (
              <div className="flex items-center gap-4">
                <CircularProgress
                  percentage={xpProgress}
                  size={70}
                  strokeWidth={8}
                  color="#f59e0b"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{Math.round(xpProgress)}%</div>
                  </div>
                </CircularProgress>
                <div className="flex-1">
                  <div className="text-xs text-gray-700 mb-1 font-medium">
                    התקדמות לרמה {levelState.level + 1}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${xpProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Streak */}
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-md p-4 mb-4 border-2 border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-orange-700">רצף ימים</h3>
                <p className="text-sm text-gray-700 mt-1">ימים רצופים</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{streak}</div>
                <div className="text-3xl">🔥</div>
              </div>
            </div>
          </div>

          {/* Today's Progress */}
          <div className="bg-gradient-to-br from-success-50 to-green-50 rounded-xl shadow-md p-4 mb-4 border-2 border-success-200">
            <h3 className="text-xl font-bold mb-3 text-success-700">התקדמות היום</h3>
            <div className="flex items-center gap-4">
              <CircularProgress
                percentage={todayTotal > 0 ? (todayLearned / todayTotal) * 100 : 0}
                size={80}
                strokeWidth={10}
                color="#10b981"
              >
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{todayLearned}</div>
                  <div className="text-xs text-gray-600">מתוך {todayTotal}</div>
                </div>
              </CircularProgress>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  מילים שנלמדו היום
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-success-400 to-success-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${todayTotal > 0 ? (todayLearned / todayTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="bg-white rounded-xl shadow-md p-4 border-2 border-gray-100">
            <h3 className="text-xl font-bold mb-3 text-gray-800">סטטיסטיקות</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                <div className="text-3xl font-bold text-primary-600 mb-1">{masteredWords}</div>
                <div className="text-xs text-gray-700 font-semibold">מילים שולטות</div>
                <div className="text-xl mt-1">🎯</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-success-50 to-green-50 rounded-lg border border-success-200">
                <div className="text-3xl font-bold text-success-600 mb-1">{totalLearned}</div>
                <div className="text-xs text-gray-700 font-semibold">מילים שנלמדו</div>
                <div className="text-xl mt-1">📚</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600 mb-1">{needsReview}</div>
                <div className="text-xs text-gray-700 font-semibold">צריך חיזוק</div>
                <div className="text-xl mt-1">💪</div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-1">{progress.length}</div>
                <div className="text-xs text-gray-700 font-semibold">סה"כ מילים</div>
                <div className="text-xl mt-1">📖</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
