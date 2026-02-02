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
  userId: string;
  levelState?: any; // Optional - if provided, don't fetch it again
  progress?: any[]; // Optional - if provided, don't fetch it again
  allWords?: any[]; // Optional - if provided, don't fetch words again
  letters?: any[]; // Optional - if provided, don't fetch letters again
  letterProgress?: any[]; // Optional - if provided, don't fetch letter progress again
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

export default function LearnPath({
  userId,
  levelState: propLevelState,
  progress: propProgress,
  allWords: propAllWords,
  letters: propLetters,
  letterProgress: propLetterProgress
}: LearnPathProps) {
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
      'Starter A': 'מילים בסיסיות',
      'Starter B': 'מילים בסיסיות',
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
    if (!section || !section.id) return <span className="text-4xl">🎯</span>;
    if (section.id === 'letters-all') return <span className="text-4xl">🔤</span>;

    let category = '';
    const match = section.id.match(/words-\d+-(.+)/);
    if (match) {
      category = match[1];
    } else if (section.title) {
      const reverseMap: Record<string, string> = {
        'מילים בסיסיות': 'Starter',
        'מילים בסיסיות 1': 'Starter',
        'מילים בסיסיות 2': 'Starter',
        'חיות': 'Animals',
        'אוכל': 'Food',
        'בגדים': 'Clothes',
        'צבעים': 'Colors',
        'זמן': 'Time',
        'פעולות': 'Actions',
      };
      category = reverseMap[section.title] || section.title;
    }

    const iconMap: Record<string, string> = {
      'Starter': '/images/icons/alphabet.png',
      'Numbers': '/images/icons/numbers.png',
      'Food': '/images/icons/food.png',
      'Animals': '/images/icons/animals.png',
      'Colors': '/images/icons/colors.png',
      'Alphabet': '/images/icons/alphabet.png',
    };

    const emojiMap: Record<string, string> = {
      'Starter': '🎯', 'Home': '🏠', 'School': '🏫', 'Animals': '🐶',
      'Colors': '🎨', 'Food': '🍎', 'Body': '👦', 'Family': '👪',
      'Clothes': '👕', 'Clothing': '👕', 'Nature': '🌳', 'Transportation': '🚗',
      'Sports': '🏆', 'Weather': '🌤️', 'Feelings': '😊', 'Numbers': '🔢',
      'Actions': '👣', 'Time': '⏰', 'אחר': '📦'
    };

    const iconPath = iconMap[category] || Object.entries(iconMap).find(([k]) => category.includes(k) || k.includes(category))?.[1];

    if (iconPath) {
      return (
        <div className="w-16 h-16 relative">
          <img
            src={iconPath}
            alt={category}
            className="w-full h-full object-contain"
          />
        </div>
      );
    }

    const key = Object.keys(emojiMap).find(k => category.includes(k) || k.includes(category));
    const emoji = emojiMap[category] || (key ? emojiMap[key] : '🎯');
    return <span className="text-5xl drop-shadow-sm">{emoji}</span>;
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
    if (level === 1) return 'ראשית הדרך';
    if (level === 2) return 'ההרפתקה מתחילה';
    if (level === 3) return 'המשימה הגדולה';
    return `שלב ${level}`;
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
  }, [userId]);

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
        try { level = await getLevelState(userId); }
        catch { level = { level: 1, xp: 0, id: '', userId, updatedAt: new Date() }; }
      }
      if (!propProgress) {
        try { progress = await getAllProgress(userId); }
        catch { progress = []; }
      }

      setLevelState(level);
      const progressMap = new Map(progress.map((p: any) => [p.wordId, p]));
      const pathSections: PathSection[] = [];

      // Level 1: Letters & Starter Words
      let letters: any[] = propLetters || [];
      let letterProgress: any[] = propLetterProgress || [];

      if (!propLetters) {
        try { letters = await getAllLetters(); } catch { }
      }
      if (!propLetterProgress) {
        try { letterProgress = await getAllLetterProgress(userId); } catch { }
      }
      const letterProgressMap = new Map(letterProgress.map((lp: any) => [lp.letterId, lp]));

      pathSections.push({
        id: 'letters-all',
        title: 'אותיות A-Z',
        color: 'teal',
        unlocked: true,
        completed: letterProgress.filter((p: any) => p.mastered).length >= 20,
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
          let cat = w.category || 'אחר';
          // Combine Starter A and Starter B into "Starter"
          if (cat === 'Starter A' || cat === 'Starter B') {
            cat = 'Starter';
          }
          if (!wordsByCategory.has(cat)) wordsByCategory.set(cat, []);
          wordsByCategory.get(cat)!.push(w);
        });

        const categories = [...wordsByCategory.keys()].sort((a, b) => {
          if (a.startsWith('Starter') && !b.startsWith('Starter')) return -1;
          if (!a.startsWith('Starter') && b.startsWith('Starter')) return 1;
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

          const masteredCount = lessons.filter(l => l.completed).length;
          const isCategoryCompleted = lessons.length > 0 && (masteredCount / lessons.length) >= 0.6;

          pathSections.push({
            id: `words-${lvl}-${cat}`,
            title: getCategoryHebrewName(cat),
            color: cat.startsWith('Starter') ? 'blue' : colors[(idx + colorShift) % colors.length],
            unlocked: true,
            completed: isCategoryCompleted,
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
      router.push(url);
    } else if (section.id.startsWith('letters-')) {
      // Navigate to letters (which just needs level 1 and no category)
      const url = `/learn?level=1&mode=learn`;
      router.push(url);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-xl font-black text-primary-600">מכין את ההרפתקה הבאה...</p>
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
                    px-8 py-3 rounded-[2rem] shadow-xl border-4 backdrop-blur-md bg-white/95
                    transform hover:scale-110 transition-all duration-300
                    flex items-center gap-4 btn-bubbly
                 `}>
                <div className="w-14 h-14 rounded-2xl bg-white shadow-inner flex items-center justify-center text-3xl">
                  {level === 1 ? '🌱' : level === 2 ? '🚀' : '👑'}
                </div>
                <div className="text-right">
                  <span className="block text-xs uppercase tracking-widest font-black opacity-40 leading-none mb-1">רמה {level}</span>
                  <h1 className="text-2xl font-black leading-tight text-neutral-800">{getLevelTitle(level).split(':')[1] || getLevelTitle(level)}</h1>
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
                          mb-4 px-6 py-2 rounded-2xl text-lg font-black shadow-lg transition-all duration-300 flex items-center gap-2
                          ${isCompleted
                          ? 'bg-success-500 text-white border-4 border-white shadow-success-200'
                          : 'bg-white text-neutral-800 border-4 border-primary-50 shadow-xl transform group-hover:-translate-y-2'
                        }
                      `}>
                        {isCompleted && <CheckCircle2 className="w-5 h-5 stroke-[4]" />}
                        {section.title}
                      </div>

                      {/* Node */}
                      <button
                        onClick={(e) => handleJumpHere(section, e)}
                        className={`
                          w-28 h-28 rounded-3xl flex flex-col items-center justify-center shadow-[0_8px_0_0_rgba(0,0,0,0.1)] border-b-8 relative bg-white
                          transition-all duration-200 active:translate-y-2 active:shadow-none active:border-b-0
                          ${isCompleted
                            ? 'border-success-100 shadow-success-600/10'
                            : `${getColorClasses(section.color).split(' ')[0]} border-black/5 ring-4 ring-white shadow-xl`
                          }
                        `}
                      >
                        <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                          {isUnlocked ? (
                            section.id.startsWith('letters-') ? (
                              <div className="w-16 h-16">
                                <img src="/images/icons/alphabet.png" alt="Letters" className="w-full h-full object-contain" />
                              </div>
                            ) : getCategoryIcon(section)
                          ) : <Lock className="w-10 h-10 opacity-30" />}
                        </div>

                        {/* Stars Indicator */}
                        <div className="flex gap-0.5 mt-2">
                          {[1, 2, 3].map((star) => {
                            const masteryPercent = section.lessons.length > 0
                              ? (section.lessons.filter(l => l.completed).length / section.lessons.length)
                              : 0;
                            const isStarred = masteryPercent >= (star * 0.33);
                            return (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${isStarred
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-neutral-200 fill-neutral-100'
                                  }`}
                              />
                            );
                          })}
                        </div>
                      </button>

                      {/* Completion Reward Icon (Pinned to node) */}
                      {isCompleted && (
                        <div className="absolute -top-4 -right-4 z-20 animate-bounce-subtle">
                          <div className="bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 rounded-full p-2 shadow-[0_4px_15px_rgba(251,191,36,0.4)] border-4 border-white">
                            <Trophy className="w-6 h-6 text-white fill-white/20" />
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
          <p className="font-bold text-neutral-400 text-lg">עוד הרפתקאות בקרוב...</p>
        </div>

      </div>
    </div>
  );
}
