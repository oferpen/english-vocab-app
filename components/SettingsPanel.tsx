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

  if (loading || !settings || !settings.questionTypes) {
    return <div className="p-4 text-center">טוען...</div>;
  }

  // Ensure questionTypes exists with defaults
  const questionTypes = settings.questionTypes || {
    enToHe: true,
    heToEn: true,
    audioToEn: false, // Not default - user can enable if they want
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">הגדרות</h2>

      <div className="bg-white rounded-lg shadow p-6 mb-4">
        <h3 className="text-lg font-bold mb-4">סוגי שאלות בחידון</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={questionTypes.enToHe ?? true}
              onChange={(e) =>
                handleUpdate({
                  questionTypes: { ...questionTypes, enToHe: e.target.checked },
                })
              }
              className="ml-2"
            />
            <span>אנגלית → עברית</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={questionTypes.heToEn ?? true}
              onChange={(e) =>
                handleUpdate({
                  questionTypes: { ...questionTypes, heToEn: e.target.checked },
                })
              }
              className="ml-2"
            />
            <span>עברית → אנגלית</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={questionTypes.audioToEn ?? true}
              onChange={(e) =>
                handleUpdate({
                  questionTypes: { ...questionTypes, audioToEn: e.target.checked },
                })
              }
              className="ml-2"
            />
            <span>שמיעה → אנגלית</span>
          </label>
        </div>
      </div>
    </div>
  );
}
