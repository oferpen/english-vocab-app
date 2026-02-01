import { useState, useEffect } from 'react';
import { getAllProgress } from '@/app/actions/progress';
import { getStreak } from '@/app/actions/streak';
import { getLevelState } from '@/app/actions/levels';
import {
  Trophy,
  BookOpen,
  RotateCcw,
  Flame,
  Rocket,
  Percent,
  CheckCircle2,
  ChevronDown,
  Search,
  AlertCircle
} from 'lucide-react';

interface ProgressDashboardProps {
  userId: string;
}

export default function ProgressDashboard({ userId }: ProgressDashboardProps) {
  const [progress, setProgress] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [levelState, setLevelState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prog, str, level] = await Promise.all([
        getAllProgress(userId),
        getStreak(userId),
        getLevelState(userId),
      ]);
      setProgress(prog);
      setStreak(str);
      setLevelState(level);
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const masteredWords = progress.filter((p) => p.masteryScore >= 80).length;
  const totalLearned = progress.filter((p) => p.timesSeenInLearn > 0).length;
  const needsReview = progress.filter((p) => p.needsReview).length;
  const avgMastery = progress.length > 0
    ? Math.round(progress.reduce((sum, p) => sum + p.masteryScore, 0) / progress.length)
    : 0;

  const stats = [
    { label: 'מילים שולטות', value: masteredWords, icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { label: 'מילים שנלמדו', value: totalLearned, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { label: 'צריך חיזוק', value: needsReview, icon: RotateCcw, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
    { label: 'רצף ימים', value: streak, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    { label: 'רמה נוכחית', value: levelState?.level || 1, icon: Rocket, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'שליטה ממוצעת', value: `${avgMastery}%`, icon: Percent, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">דשבורד התקדמות</h2>
          <p className="text-neutral-500 font-bold mt-1">עקוב אחר קצב הלמידה וההישגים</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className={`p-4 rounded-[2rem] bg-white border border-neutral-100 shadow-sm flex flex-col items-center justify-center text-center transition-all hover:shadow-md hover:-translate-y-1 group`}>
            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div className="text-2xl font-black text-neutral-800 leading-none">{stat.value}</div>
            <div className="text-[10px] md:text-xs text-neutral-400 font-bold uppercase tracking-wider mt-1.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 overflow-hidden">
        <div className="px-8 py-6 border-b border-neutral-50 flex items-center justify-between bg-neutral-50/50">
          <h3 className="text-xl font-black text-neutral-800 flex items-center gap-2">
            <Search className="w-5 h-5 text-neutral-400" />
            <span>פירוט לפי מילים</span>
          </h3>
          <span className="text-xs font-black text-neutral-400 uppercase tracking-widest bg-white px-4 py-1.5 rounded-full border border-neutral-100 shadow-sm">
            {progress.length} מילים נצפו
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-neutral-50/50">
                <th className="text-right px-8 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">מילה</th>
                <th className="text-right px-8 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">רמת שליטה</th>
                <th className="text-right px-8 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">דיוק במבחן</th>
                <th className="text-right px-8 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">חשיפה</th>
                <th className="text-right px-8 py-4 text-xs font-black text-neutral-400 uppercase tracking-widest">סטטוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {progress.slice(0, 50).map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-neutral-800 group-hover:text-indigo-600 transition-colors uppercase">{p.word.englishWord}</span>
                      <span className="text-sm font-bold text-neutral-400">{p.word.hebrewTranslation}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${p.masteryScore >= 80 ? 'bg-green-500' : p.masteryScore >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                          style={{ width: `${p.masteryScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-black text-neutral-600">{p.masteryScore}%</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-neutral-500 tabular-nums" dir="ltr">
                      {p.quizCorrect} / {p.quizAttempts}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-black text-neutral-400 tabular-nums">
                      {p.timesSeenInLearn} פעמים
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {p.masteryScore >= 80 ? (
                      <div className="flex items-center gap-1.5 text-green-600 font-black text-xs bg-green-50 px-3 py-1.5 rounded-full w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>שולט</span>
                      </div>
                    ) : p.needsReview ? (
                      <div className="flex items-center gap-1.5 text-rose-500 font-black text-xs bg-rose-50 px-3 py-1.5 rounded-full w-fit">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>צריך חיזוק</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-indigo-500 font-black text-xs bg-indigo-50 px-3 py-1.5 rounded-full w-fit">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>בלמידה</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {progress.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-neutral-100 mx-auto mb-3" />
            <p className="text-neutral-400 font-black">עדיין אין נתוני למידה למשתמש זה</p>
          </div>
        )}
      </div>
    </div>
  );
}
