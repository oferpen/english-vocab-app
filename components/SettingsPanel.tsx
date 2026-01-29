import { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/app/actions/settings';
import { updatePIN } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Languages,
  Type,
  Headphones,
  Zap,
  Info,
  Check,
  ChevronLeft,
  Lock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPinForm, setShowPinForm] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState({ text: '', type: '' });
  const router = useRouter();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const s = await getSettings();
    setSettings(s);
    setLoading(false);
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

  const handlePINChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinMessage({ text: 'הקוד חייב להכיל 4 ספרות', type: 'error' });
      return;
    }

    setSaving(true);
    setPinMessage({ text: '', type: '' });

    try {
      const success = await updatePIN(newPin);
      if (success) {
        setPinMessage({ text: 'הקוד הוחלף בהצלחה', type: 'success' });
        setNewPin('');
        setTimeout(() => {
          setShowPinForm(false);
          setPinMessage({ text: '', type: '' });
        }, 2000);
      } else {
        setPinMessage({ text: 'שגיאה בהחלפת הקוד', type: 'error' });
      }
    } catch (error) {
      setPinMessage({ text: 'שגיאה בתקשורת עם השרת', type: 'error' });
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

          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 p-8 md:p-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-neutral-800">אבטחה</h3>
              </div>
              {!showPinForm && (
                <button
                  onClick={() => setShowPinForm(true)}
                  className="text-indigo-600 font-black text-sm hover:underline"
                >
                  החלף קוד PIN
                </button>
              )}
            </div>

            {showPinForm ? (
              <form onSubmit={handlePINChange} className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-black text-center text-2xl tracking-[1em]"
                      placeholder="----"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving || newPin.length !== 4}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-[0_8px_0_0_#4338ca] active:translate-y-2 active:shadow-none transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                      שמור קוד
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowPinForm(false); setPinMessage({ text: '', type: '' }); }}
                      className="px-8 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black hover:bg-neutral-200 transition-all"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
                {pinMessage.text && (
                  <div className={`flex items-center gap-2 text-sm font-bold ${pinMessage.type === 'success' ? 'text-green-600' : 'text-rose-500'} animate-in fade-in`}>
                    {pinMessage.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {pinMessage.text}
                  </div>
                )}
              </form>
            ) : (
              <div className="flex items-center gap-4 p-6 bg-neutral-50 rounded-3xl border border-neutral-100">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-neutral-300">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-neutral-800">קוד הגישה מופעל</div>
                  <div className="text-xs text-neutral-400 font-bold">הקוד משמש לכניסה לאזור ההורים</div>
                </div>
              </div>
            )}
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

          <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-neutral-100 p-8 text-center group">
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-neutral-100 transition-colors">
              <SettingsIcon className="w-8 h-8 text-neutral-300 group-hover:rotate-45 transition-transform duration-500" />
            </div>
            <h4 className="text-lg font-black text-neutral-400">הגדרות מתקדמות</h4>
            <p className="text-sm text-neutral-300 font-bold mt-2 italic">בקרוב תוכלו לשלוט גם ברמת הקושי...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
