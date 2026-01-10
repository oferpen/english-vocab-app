'use client';

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
    <div className="p-4 space-y-6">
      {/* Level & XP */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">רמה {levelState.level}</h2>
            <p className="text-gray-600">{levelState.xp} נקודות XP</p>
          </div>
          <div className="text-4xl">⭐</div>
        </div>
        {levelState.level < 10 && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>התקדמות לרמה {levelState.level + 1}</span>
              <span>{Math.round(xpProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-yellow-500 h-3 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Streak */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">רצף ימים</h3>
            <p className="text-gray-600">ימים רצופים של פעילות</p>
          </div>
          <div className="text-4xl font-bold text-orange-600">{streak} 🔥</div>
        </div>
      </div>

      {/* Today's Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">התקדמות היום</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>מילים שנלמדו</span>
              <span>{todayLearned} מתוך {todayTotal}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${todayTotal > 0 ? (todayLearned / todayTotal) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-bold mb-4">סטטיסטיקות</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl font-bold text-blue-600">{masteredWords}</div>
            <div className="text-sm text-gray-600">מילים שולטות</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl font-bold text-green-600">{totalLearned}</div>
            <div className="text-sm text-gray-600">מילים שנלמדו</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-3xl font-bold text-yellow-600">{needsReview}</div>
            <div className="text-sm text-gray-600">צריך חיזוק</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-3xl font-bold text-purple-600">{progress.length}</div>
            <div className="text-sm text-gray-600">סה"כ מילים</div>
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
