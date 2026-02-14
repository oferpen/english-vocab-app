'use client';

import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Languages,
  Type,
  Headphones,
  Zap,
  Info,
  Check,
} from 'lucide-react';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const s = await getSettings();
      setSettings(s);
    } catch (error: any) {
      // Silently handle 404s - settings panel can work with defaults
      if (!error?.message?.includes('404') && !error?.message?.includes('Not Found')) {
        console.error('Failed to load settings:', error);
      }
      // Use default settings on error
      setSettings({
        questionTypes: {
          enToHe: true,
          heToEn: true,
          audioToEn: false,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuestionType = async (type: 'enToHe' | 'heToEn' | 'audioToEn') => {
    if (!settings || !settings.questionTypes) return;

    const questionTypes = { ...settings.questionTypes };
    const newValue = !questionTypes[type];

    // Ensure at least one is active
    const activeCount = Object.values(questionTypes).filter(v => v).length;
    if (!newValue && activeCount <= 1) {
      alert('חייב להישאר לפחות סוג שאלה אחד פעיל');
      return;
    }

    const updatedTypes = { ...questionTypes, [type]: newValue };

    setSaving(true);
    try {
      await updateSettings({ questionTypes: updatedTypes });
      setSettings({ ...settings, questionTypes: updatedTypes });
      router.refresh();
    } catch (error) {
      alert('שגיאה בשמירת ההגדרות');
    } finally {
      setSaving(false);
    }
  };



  if (loading || !settings) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const questionTypes = settings.questionTypes || {
    enToHe: true,
    heToEn: true,
    audioToEn: false,
  };

  const typeCards = [
    { id: 'enToHe', label: 'אנגלית ← עברית', description: 'לזהות את התרגום הנכון למילה באנגלית', icon: Languages },
    { id: 'heToEn', label: 'עברית ← אנגלית', description: 'לזהות את המילה המקורית לפי התרגום', icon: Type },
    { id: 'audioToEn', label: 'שמיעה ← אנגלית', description: 'להקשיב למילה ולזהות את הכתיב הנכון', icon: Headphones },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">הגדרות למידה</h2>
          <p className="text-neutral-500 font-bold mt-1">נהל את סוגי השאלות והתכנים שהילד פוגש</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 p-8 md:p-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black text-neutral-800">סוגי שאלות פעילים</h3>
            </div>

            <div className="grid gap-4">
              {typeCards.map((type) => {
                const isSelected = !!questionTypes[type.id as keyof typeof questionTypes];
                return (
                  <button
                    key={type.id}
                    onClick={() => handleToggleQuestionType(type.id as any)}
                    disabled={saving}
                    className={`
                      w-full flex items-center gap-6 p-6 rounded-3xl border-2 transition-all text-right group
                      ${isSelected
                        ? 'bg-indigo-50/50 border-indigo-500 shadow-lg shadow-indigo-100'
                        : 'bg-white border-neutral-100 hover:border-neutral-200'
                      }
                    `}
                  >
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center transition-all
                      ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-neutral-50 text-neutral-300'}
                    `}>
                      <type.icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-lg font-black ${isSelected ? 'text-indigo-900' : 'text-neutral-700'}`}>
                          {type.label}
                        </span>
                        {isSelected && (
                          <div className="bg-indigo-600 text-white rounded-full p-1 scale-90 md:scale-100">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400 font-bold leading-relaxed">
                        {type.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black mb-4">טיפ למידה</h3>
              <p className="text-indigo-50 font-bold leading-relaxed">
                שילוב של תרגול חזותי (אנג → עב) ותרגול פעיל (עב → אנג) יוצר את הלמידה האפקטיבית ביותר!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
