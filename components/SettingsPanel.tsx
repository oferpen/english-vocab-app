'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { useRouter } from 'next/navigation';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await getSettings();
    setSettings(s);
    setLoading(false);
  };

  const handleUpdate = async (updates: any) => {
    const updated = { ...settings, ...updates };
    await updateSettings(updates);
    setSettings(updated);
    router.refresh();
  };

  if (loading || !settings) {
    return <div className="p-4 text-center">טוען...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">הגדרות</h2>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="text-lg font-bold mb-4">סוגי שאלות בחידון</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.questionTypes.enToHe}
              onChange={(e) =>
                handleUpdate({
                  questionTypes: { ...settings.questionTypes, enToHe: e.target.checked },
                })
              }
              className="ml-2"
            />
            <span>אנגלית → עברית</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.questionTypes.heToEn}
              onChange={(e) =>
                handleUpdate({
                  questionTypes: { ...settings.questionTypes, heToEn: e.target.checked },
                })
              }
              className="ml-2"
            />
            <span>עברית → אנגלית</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.questionTypes.audioToEn}
              onChange={(e) =>
                handleUpdate({
                  questionTypes: { ...settings.questionTypes, audioToEn: e.target.checked },
                })
              }
              className="ml-2"
            />
            <span>שמיעה → אנגלית</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="text-lg font-bold mb-4">אורך חידון</h3>
        <input
          type="number"
          value={settings.quizLength}
          onChange={(e) => handleUpdate({ quizLength: parseInt(e.target.value) })}
          className="w-full p-2 border rounded-lg"
          min="5"
          max="50"
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="text-lg font-bold mb-4">אסטרטגיית למידה נוספת</h3>
        <select
          value={settings.extraLearningStrategy}
          onChange={(e) => handleUpdate({ extraLearningStrategy: e.target.value })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="unseen">מילים שלא נראו</option>
          <option value="needsReview">צריך חיזוק</option>
          <option value="nextPlanned">הבא בתוכנית</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="text-lg font-bold mb-4">כלל רצף ימים</h3>
        <select
          value={settings.streakRule}
          onChange={(e) => handleUpdate({ streakRule: e.target.value })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="learn">רק למידה</option>
          <option value="quiz">רק חידון</option>
          <option value="either">אחד מהם</option>
          <option value="both">שניהם</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">עוצמת פרסים</h3>
        <select
          value={settings.rewardIntensity}
          onChange={(e) => handleUpdate({ rewardIntensity: e.target.value })}
          className="w-full p-2 border rounded-lg"
        >
          <option value="low">נמוכה</option>
          <option value="normal">רגילה</option>
          <option value="high">גבוהה</option>
        </select>
      </div>
    </div>
  );
}
