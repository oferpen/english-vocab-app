'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAllWords } from '@/app/actions/words';
import { getAllLetters, getAllLetterProgress } from '@/app/actions/letters';
import { getLevelState } from '@/app/actions/levels';
import {
  Target, Home, School, Dog, Palette, Apple, User, Users,
  Shirt, Trees, Car, Trophy, CloudSun, Smile, Binary,
  Footprints, Package, Type, Rocket, Bike, Languages, Crown,
  Star, Lock, Clock, CheckCircle2
} from 'lucide-react';
import { getAllProgress } from '@/app/actions/progress';


interface LearnPathProps {
  childId: string;
  levelState?: any; // Optional - if provided, don't fetch it again
  progress?: any[]; // Optional - if provided, don't fetch it again
  allWords?: any[]; // Optional - if provided, don't fetch words again
}

interface PathSection {
  id: string;
  title: string;
  color: string;
  lessons: PathLesson[];
  unlocked: boolean;
  completed: boolean;
  level: number; // Add level to section
}

interface PathLesson {
  id: string;
  type: 'letter' | 'word' | 'quiz';
  content: any;
  completed: boolean;
  active: boolean;
  locked: boolean;
}

export default function LearnPath({ childId, levelState: propLevelState, progress: propProgress, allWords: propAllWords }: LearnPathProps) {
  const router = useRouter();
  const [sections, setSections] = useState<PathSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelState, setLevelState] = useState<any>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollingRef = useRef(false);
  const hasScrolledRef = useRef(false);
  const scrollAnimationRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);

  // Helper functions
  const getCategoryHebrewName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Starter': 'מילים בסיסיות',
      'Starter A': 'מילים בסיסיות א',
      'Starter B': 'מילים בסיסיות ב',
      'Home': 'בית',
      'School': 'בית ספר',
      'Animals': 'חיות',
      'Colors': 'צבעים',
      'Food': 'אוכל',
      'Body': 'גוף',
      'Family': 'משפחה',
      'Clothes': 'בגדים',
      'Clothing': 'בגדים',
      'Nature': 'טבע',
      'Transportation': 'תחבורה',
      'Sports': 'ספורט',
      'Weather': 'מזג אוויר',
      'Feelings': 'רגשות',
      'Numbers': 'מספרים',
      'Actions': 'פעולות',
      'Time': 'זמן',
      'אחר': 'אחר',
    };
    return categoryMap[category] || category;
  };

  const getCategoryIcon = (section: PathSection) => {
    const iconProps = { className: "w-10 h-10", strokeWidth: 2.5 };

    if (!section || !section.id) return <Target {...iconProps} />;
    if (section.id === 'letters-all') return <Languages {...iconProps} />;

    let category = '';
    const match = section.id.match(/words-\d+-(.+)/);
    if (match) {
      category = match[1];
    } else if (section.title) {
      const reverseMap: Record<string, string> = {
        'מילים בסיסיות': 'Starter',
        'מילים בסיסיות א': 'Starter A',
        'מילים בסיסיות ב': 'Starter B',
        'חיות': 'Animals',
        'אוכל': 'Food',
        'בגדים': 'Clothes',
        'צבעים': 'Colors',
        'זמן': 'Time',
        'פעולות': 'Actions',
      };
      category = reverseMap[section.title] || section.title;
    }

    const iconMap: Record<string, any> = {
      'Starter': Target, 'Home': Home, 'School': School, 'Animals': Dog,
      'Colors': Palette, 'Food': Apple, 'Body': User, 'Family': Users,
      'Clothes': Shirt, 'Clothing': Shirt, 'Nature': Trees, 'Transportation': Car,
      'Sports': Trophy, 'Weather': CloudSun, 'Feelings': Smile, 'Numbers': Binary,
      'Actions': Footprints, 'Time': Clock, 'אחר': Package
    };

    const key = Object.keys(iconMap).find(k => category.includes(k) || k.includes(category));
    const IconComponent = iconMap[category] || (key ? iconMap[key] : Target);
    return <IconComponent {...iconProps} />;
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      teal: 'bg-success-500 hover:bg-success-600 border-success-600 shadow-success-200',
      green: 'bg-success-500 hover:bg-success-600 border-success-600 shadow-success-200',
      blue: 'bg-primary-500 hover:bg-primary-600 border-primary-600 shadow-primary-200',
      pink: 'bg-danger-500 hover:bg-danger-600 border-danger-600 shadow-danger-200',
      purple: 'bg-purple-500 hover:bg-purple-600 border-purple-600 shadow-purple-200',
      orange: 'bg-accent-500 hover:bg-accent-600 border-accent-600 shadow-accent-200',
    };
    return colors[color] || colors.green;
  };

  const getLevelTitle = (level: number) => {
    if (level === 1) return 'מתחילים';
    if (level === 2) return 'רמה 2: מילים';
    if (level === 3) return 'רמה 3: מתקדם';
    return `רמה ${level}`;
  };

  const getLevelColor = (level: number) => {
    if (level === 1) return 'bg-primary-50 border-primary-100 text-primary-700';
    if (level === 2) return 'bg-success-50 border-success-100 text-success-700';
    if (level === 3) return 'bg-accent-50 border-accent-100 text-accent-700';
    return 'bg-neutral-50 border-neutral-200 text-neutral-700';
  };

  // Logic: Load Data
  useEffect(() => {
    loadPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  // Logic: Scroll to active
  useEffect(() => {
    if (!loading && sections.length > 0 && !hasScrolledRef.current && !userInteractedRef.current) {
      // Find first incomplete or first active
      const targetSection = sections.find(s => !s.completed) || sections[sections.length - 1];
      if (targetSection) {
        hasScrolledRef.current = true;
        setTimeout(() => {
          if (userInteractedRef.current) return;
          const el = sectionRefs.current.get(targetSection.id);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [loading, sections]);

  const loadPath = async () => {
    try {
      setLoading(true);
      let level: any = propLevelState;
      let progress: any[] = propProgress || [];

      if (!propLevelState) {
        try { level = await getLevelState(childId); }
        catch { level = { level: 1, xp: 0, id: '', childId, updatedAt: new Date() }; }
      }
      if (!propProgress) {
        try { progress = await getAllProgress(childId); }
        catch { progress = []; }
      }

      setLevelState(level);
      const progressMap = new Map(progress.map((p: any) => [p.wordId, p]));
      const pathSections: PathSection[] = [];

      // Level 1: Letters & Starter Words
      let letters: any[] = [];
      let letterProgress: any[] = [];
      try { letters = await getAllLetters(); } catch { }
      try { letterProgress = await getAllLetterProgress(childId); } catch { }
      const letterProgressMap = new Map(letterProgress.map((lp: any) => [lp.letterId, lp]));

      pathSections.push({
        id: 'letters-all',
        title: 'אותיות A-Z',
        color: 'teal',
        unlocked: true,
        completed: letters.length > 0 && letters.every((l: any) => letterProgressMap.get(l.id)?.mastered),
        level: 1,
        lessons: letters.map((letter: any, index: number) => ({
          id: `letter-${letter.id}`,
          type: 'letter',
          content: letter,
          completed: letterProgressMap.get(letter.id)?.mastered || false,
          active: index === 0 || letterProgressMap.get(letters[index - 1]?.id)?.mastered || false,
          locked: index > 0 && !letterProgressMap.get(letters[index - 1]?.id)?.mastered,
        }))
      });

      // Words Logic
      let allWords: any[] = propAllWords || [];
      if (!propAllWords || propAllWords.length === 0) {
        try { allWords = await getAllWords(); } catch { }
      }
      console.log('[LearnPath] Loaded allWords:', allWords.length, 'Sample:', allWords[0] ? { english: allWords[0].englishWord, level: allWords[0].level, difficulty: allWords[0].difficulty } : 'empty');

      // Process words by level (1, 2, 3)
      const processLevelWords = (lvl: number, colorShift: number) => {
        const lvlWords = allWords.filter((w: any) => {
          const wordLevel = w.level ?? w.difficulty;
          return wordLevel === lvl;
        });

        console.log(`[LearnPath] Level ${lvl} words found:`, lvlWords.length);
        const wordsByCategory = new Map<string, any[]>();

        lvlWords.forEach((w: any) => {
          const cat = w.category || 'אחר';
          if (!wordsByCategory.has(cat)) wordsByCategory.set(cat, []);
          wordsByCategory.get(cat)!.push(w);
        });

        const categories = [...wordsByCategory.keys()].sort((a, b) => {
          if (a.startsWith('Starter') && !b.startsWith('Starter')) return -1;
          if (!a.startsWith('Starter') && b.startsWith('Starter')) return 1;
          if (a.startsWith('Starter') && b.startsWith('Starter')) return a.localeCompare(b);
          return a.localeCompare(b);
        });

        const colors = ['green', 'blue', 'pink', 'purple', 'orange', 'teal'];

        categories.forEach((cat, idx) => {
          const categoryWords = wordsByCategory.get(cat) || [];
          if (categoryWords.length === 0) return;

          const lessons: PathLesson[] = categoryWords.map((word: any) => ({
            id: `word-${word.id}`,
            type: 'word',
            content: word,
            completed: (progressMap.get(word.id)?.masteryScore || 0) >= 80,
            active: true,
            locked: false
          }));

          pathSections.push({
            id: `words-${lvl}-${cat}`,
            title: getCategoryHebrewName(cat),
            color: cat.startsWith('Starter') ? 'blue' : colors[(idx + colorShift) % colors.length],
            unlocked: true,
            completed: lessons.every(l => l.completed),
            level: lvl,
            lessons
          });
        });
      };

      processLevelWords(1, 0); // Starter words etc
      processLevelWords(2, 2); // Basic categories
      processLevelWords(3, 4); // Advanced categories

      setSections(pathSections);

    } catch (error) {
      console.error(error);
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJumpHere = (section: PathSection, e?: React.MouseEvent) => {
    userInteractedRef.current = true;
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (section.level >= 1 && section.id.startsWith('words-')) {
      // Navigate to category
      let category = '';
      const match = section.id.match(/words-\d+-(.+)/);
      if (match) category = match[1];
      else category = section.title; // Fallback

      // Reverse map if it's Hebrew title
      const reverseMap: Record<string, string> = {
        'מילים בסיסיות': 'Starter', 'בית': 'Home', 'בית ספר': 'School',
        'חיות': 'Animals', 'צבעים': 'Colors', 'אוכל': 'Food',
        'גוף': 'Body', 'משפחה': 'Family', 'בגדים': 'Clothes',
        'טבע': 'Nature', 'תחבורה': 'Transportation', 'ספורט': 'Sports',
        'מזג אוויר': 'Weather', 'רגשות': 'Feelings', 'מספרים': 'Numbers',
        'פעולות': 'Actions', 'אחר': 'אחר'
      };
      const englishCategory = reverseMap[section.title] || category; // Try title first map, then extracted ID

      const url = `/learn?category=${encodeURIComponent(englishCategory)}&level=${section.level}`;
      window.location.assign(url);
    } else {
      // Letters
      const firstActive = section.lessons.find(l => l.active && !l.locked);
      if (firstActive) {
        router.push(`/learn?letterId=${firstActive.content.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center min-h-[50vh] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">טוען את מפת הלמידה...</p>
      </div>
    );
  }

  // Render: Group by Level
  const sectionsByLevel = new Map<number, PathSection[]>();
  sections.forEach(s => {
    if (!sectionsByLevel.has(s.level)) sectionsByLevel.set(s.level, []);
    sectionsByLevel.get(s.level)!.push(s);
  });

  return (
    <div className="min-h-screen bg-transparent pb-32">
      <div className="relative max-w-lg mx-auto px-4 py-8">

        {/* Central Path Line (Dashed) */}
        <div className="absolute left-1/2 top-4 bottom-32 w-1 border-r-4 border-dashed border-neutral-100 transform -translate-x-1/2 z-0 hidden md:block opacity-40"></div>
        <div className="absolute left-1/2 top-4 bottom-32 w-1.5 bg-neutral-100 transform -translate-x-1/2 z-0 md:hidden opacity-30"></div>

        {Array.from(sectionsByLevel.entries()).map(([level, levelSections], levelIndex) => (
          <div key={`level-${level}`} className="relative mb-16 z-10">

            {/* Level Island Header */}
            <div className="sticky top-20 z-20 mb-16 flex justify-center">
              <div className={`
                    ${getLevelColor(level)} 
                    px-6 py-2 rounded-full shadow-lg border backdrop-blur-md bg-white/90
                    transform hover:scale-105 transition-transform duration-300
                    flex items-center gap-3
                 `}>
                <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center shadow-inner">
                  {level === 1 ? <Type className="w-6 h-6 text-indigo-600" /> : level === 2 ? <Bike className="w-6 h-6 text-emerald-600" /> : <Rocket className="w-6 h-6 text-amber-600" />}
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-bold opacity-60 leading-none">רמה {level}</span>
                  <h1 className="text-lg font-bold leading-tight">{getLevelTitle(level).split(':')[1] || getLevelTitle(level)}</h1>
                </div>
              </div>
            </div>

            <div className="space-y-12">
              {levelSections.map((section, sectionIndex) => {
                const isCompleted = section.completed;
                const isUnlocked = section.unlocked; // All unlocked for now
                const isActive = !isCompleted;

                return (
                  <div
                    key={section.id}
                    ref={(el) => { if (el) sectionRefs.current.set(section.id, el); }}
                    className={`relative flex flex-col items-center group transition-all duration-700`}
                    style={{
                      transform: `translateX(${sectionIndex % 4 === 1 ? '50px' :
                        sectionIndex % 4 === 3 ? '-50px' : '0px'
                        })`
                    }}
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Floating Label */}
                      <div className={`
                          mb-4 px-4 py-1.5 rounded-2xl text-sm font-black shadow-sm transition-all duration-300 flex items-center gap-2
                          ${isCompleted
                          ? 'bg-success-500 text-white border-2 border-white shadow-lg'
                          : 'bg-white text-neutral-600 border border-neutral-100 shadow-md transform group-hover:-translate-y-1'
                        }
                      `}>
                        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                        {section.title}
                      </div>

                      {/* Node */}
                      <button
                        onClick={(e) => handleJumpHere(section, e)}
                        className={`
                          w-24 h-24 rounded-full flex items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-b-8 relative
                          transition-all duration-200 active:translate-y-2 active:shadow-none active:border-b-0
                          ${isCompleted
                            ? 'bg-success-500 border-success-600 text-white shadow-success-600/20'
                            : `${getColorClasses(section.color).split(' ')[0]} border-black/10 ring-4 ring-white shadow-xl`
                          }
                        `}
                      >
                        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                          {isUnlocked ? getCategoryIcon(section) : <Lock className="w-10 h-10 opacity-30" />}
                        </div>
                      </button>

                      {/* Completion Reward Icon (Pinned to node) */}
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 z-20">
                          <div className="bg-amber-400 rounded-full p-2 shadow-lg border-4 border-white">
                            <Crown className="w-5 h-5 text-white fill-white" />
                          </div>
                        </div>
                      )}

                      {/* Particles/Decorations (CSS only) */}
                      {isActive && (
                        <div className="absolute -z-10 w-32 h-32 bg-current opacity-10 rounded-full blur-xl animate-pulse text-primary-500"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center mt-32 pb-10 opacity-40 grayscale hover:grayscale-0 transition-all duration-500 flex flex-col items-center">
          <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center mb-4 border-2 border-dashed border-neutral-300">
            <Rocket className="w-10 h-10 text-neutral-300" />
          </div>
          <p className="font-bold text-neutral-400">עוד שלבים בקרוב...</p>
        </div>

      </div>
    </div>
  );
}
