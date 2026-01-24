'use client';

import CircularProgress from './CircularProgress';

interface ProgressDisplayProps {
  child: any;
  progress: any[];
  streak: number;
  levelState: any;
  missions: any[];
  masteredWords: number;
  totalLearned: number;
  needsReview: number;
  todayLearned: number;
  todayTotal: number;
  xpProgress: number;
  xpForNext: number;
}

export default function ProgressDisplay({
  child,
  progress,
  streak,
  levelState,
  missions,
  masteredWords,
  totalLearned,
  needsReview,
  todayLearned,
  todayTotal,
  xpProgress,
}: ProgressDisplayProps) {
  const dailyMissions = missions.filter((m) => m.periodType === 'DAILY');
  const weeklyMissions = missions.filter((m) => m.periodType === 'WEEKLY');

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Level & XP - Duolingo Style */}
      <div className="bg-gradient-to-br from-white to-primary-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-primary-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-primary-600">רמה {levelState.level}</h2>
            <p className="text-lg md:text-xl text-gray-700 font-semibold mt-1">{levelState.xp} נקודות נסיון</p>
          </div>
          <div className="text-5xl md:text-6xl animate-pulse-slow">⭐</div>
        </div>
        {levelState.level < 10 && (
          <div className="flex items-center gap-6">
            <CircularProgress
              percentage={xpProgress}
              size={100}
              strokeWidth={10}
              color="#f59e0b"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{Math.round(xpProgress)}%</div>
              </div>
            </CircularProgress>
            <div className="flex-1">
              <div className="flex justify-between text-sm md:text-base text-gray-700 mb-2 font-medium">
                <span>התקדמות לרמה {levelState.level + 1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Streak - Duolingo Style */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-orange-700">רצף ימים</h3>
            <p className="text-base md:text-lg text-gray-700 mt-1">ימים רצופים של פעילות</p>
          </div>
          <div className="text-center">
            <div className="text-5xl md:text-6xl font-bold text-orange-600 animate-pulse-slow">{streak}</div>
            <div className="text-4xl md:text-5xl">🔥</div>
          </div>
        </div>
      </div>

      {/* Today's Progress - Duolingo Daily Goal Style */}
      <div className="bg-gradient-to-br from-success-50 to-green-50 rounded-2xl shadow-xl p-6 md:p-8 border-2 border-success-200">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-success-700">התקדמות היום</h3>
        <div className="flex items-center gap-6">
          <CircularProgress
            percentage={todayTotal > 0 ? (todayLearned / todayTotal) * 100 : 0}
            size={120}
            strokeWidth={12}
            color="#10b981"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-success-600">{todayLearned}</div>
              <div className="text-sm text-gray-600">מתוך {todayTotal}</div>
            </div>
          </CircularProgress>
          <div className="flex-1">
            <div className="text-lg md:text-xl font-semibold text-gray-700 mb-3">
              מילים שנלמדו היום
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-success-400 to-success-600 h-4 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${todayTotal > 0 ? (todayLearned / todayTotal) * 100 : 0}%` }}
              />
            </div>
            {todayLearned >= todayTotal && todayTotal > 0 && (
              <div className="mt-3 text-success-700 font-bold text-lg animate-pulse">
                🎯 הושג היעד היומי!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics - Enhanced Cards */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-gray-100">
        <h3 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">סטטיסטיקות</h3>
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="text-center p-5 md:p-6 bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border-2 border-primary-200 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-primary-600 mb-2">{masteredWords}</div>
            <div className="text-sm md:text-base text-gray-700 font-semibold">מילים שולטות</div>
            <div className="text-2xl mt-2">🎯</div>
          </div>
          <div className="text-center p-5 md:p-6 bg-gradient-to-br from-success-50 to-green-50 rounded-xl border-2 border-success-200 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-success-600 mb-2">{totalLearned}</div>
            <div className="text-sm md:text-base text-gray-700 font-semibold">מילים שנלמדו</div>
            <div className="text-2xl mt-2">📚</div>
          </div>
          <div className="text-center p-5 md:p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-yellow-600 mb-2">{needsReview}</div>
            <div className="text-sm md:text-base text-gray-700 font-semibold">צריך חיזוק</div>
            <div className="text-2xl mt-2">💪</div>
          </div>
          <div className="text-center p-5 md:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">{progress.length}</div>
            <div className="text-sm md:text-base text-gray-700 font-semibold">סה"כ מילים</div>
            <div className="text-2xl mt-2">📖</div>
          </div>
        </div>
      </div>

      {/* Missions */}
      {(dailyMissions.length > 0 || weeklyMissions.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">משימות</h3>
          <div className="space-y-3">
            {dailyMissions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded-lg border-2 ${
                  mission.completed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{getMissionLabel(mission.missionKey)}</span>
                  <span className="text-sm">
                    {mission.progress} / {mission.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      mission.completed ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{
                      width: `${Math.min((mission.progress / mission.target) * 100, 100)}%`,
                    }}
                  />
                </div>
                {mission.completed && (
                  <div className="text-green-600 text-sm mt-1">✓ הושלם!</div>
                )}
              </div>
            ))}
            {weeklyMissions.map((mission) => (
              <div
                key={mission.id}
                className={`p-3 rounded-lg border-2 ${
                  mission.completed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{getMissionLabel(mission.missionKey)} (שבועי)</span>
                  <span className="text-sm">
                    {mission.progress} / {mission.target}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      mission.completed ? 'bg-green-500' : 'bg-purple-500'
                    }`}
                    style={{
                      width: `${Math.min((mission.progress / mission.target) * 100, 100)}%`,
                    }}
                  />
                </div>
                {mission.completed && (
                  <div className="text-green-600 text-sm mt-1">✓ הושלם!</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function getMissionLabel(key: string): string {
  const labels: Record<string, string> = {
    learn_words: 'למד מילים היום',
    complete_quiz: 'השלם חידון',
    learn_5_words: 'למד 5 מילים',
    quiz_4_days: 'השלם חידון 4 ימים',
  };
  return labels[key] || key;
}
