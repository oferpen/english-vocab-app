'use client';

import { useState, useEffect } from 'react';
import { getAllChildren, getActiveChild } from '@/app/actions/children';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getLevelState } from '@/app/actions/levels';

export default function ProgressDashboard() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [progress, setProgress] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [levelState, setLevelState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadProgress();
    }
  }, [selectedChildId]);

  const loadData = async () => {
    setLoading(true);
    const kids = await getAllChildren();
    setChildren(kids);
    if (kids.length > 0) {
      const active = await getActiveChild();
      setSelectedChildId(active?.id || kids[0].id);
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    if (!selectedChildId) return;
    const [prog, str, level] = await Promise.all([
      getAllProgress(selectedChildId),
      getStreak(selectedChildId),
      getLevelState(selectedChildId),
    ]);
    setProgress(prog);
    setStreak(str);
    setLevelState(level);
  };

  if (loading) {
    return <div className="p-4 text-center">טוען...</div>;
  }

  if (children.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">אין ילדים במערכת</p>
      </div>
    );
  }

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  const totalLearned = progress.filter((p) => p.timesSeenInLearn > 0).length;
  const needsReview = progress.filter((p) => p.needsReview).length;
  const totalQuizAttempts = progress.reduce((sum, p) => sum + p.quizAttempts, 0);
  const totalQuizCorrect = progress.reduce((sum, p) => sum + p.quizCorrect, 0);
  const avgMastery = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.masteryScore, 0) / progress.length)
    : 0;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">דשבורד התקדמות</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">בחר ילד</label>
        <select
          value={selectedChildId}
          onChange={(e) => setSelectedChildId(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          {children.map((child) => (
            <option key={child.id} value={child.id}>
              {child.name}
            </option>
          ))}
        </select>
      </div>

      {levelState && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-4">
            <h3 className="text-xl font-bold mb-4">סטטיסטיקות כלליות</h3>
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
                <div className="text-3xl font-bold text-purple-600">{streak}</div>
                <div className="text-sm text-gray-600">רצף ימים</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">{levelState.level}</div>
                <div className="text-sm text-gray-600">רמה</div>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <div className="text-3xl font-bold text-pink-600">{avgMastery}%</div>
                <div className="text-sm text-gray-600">שליטה ממוצעת</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold mb-4">התקדמות לפי מילה</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-right p-2">מילה</th>
                    <th className="text-right p-2">שליטה</th>
                    <th className="text-right p-2">נכונים/ניסיונות</th>
                    <th className="text-right p-2">פעמים שנראה</th>
                    <th className="text-right p-2">צריך חיזוק</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.slice(0, 50).map((p) => (
                    <tr key={p.id} className="border-b">
                      <td className="p-2">
                        {p.word.englishWord} - {p.word.hebrewTranslation}
                      </td>
                      <td className="p-2">{p.masteryScore}%</td>
                      <td className="p-2">
                        {p.quizCorrect}/{p.quizAttempts}
                      </td>
                      <td className="p-2">{p.timesSeenInLearn}</td>
                      <td className="p-2">{p.needsReview ? '✓' : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
