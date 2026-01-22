'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAllWords } from '@/app/actions/words';
import { getAllLetters, getAllLetterProgress } from '@/app/actions/letters';
import { getLevelState } from '@/app/actions/levels';
import { getAllProgress } from '@/app/actions/progress';

// Module-level cache to persist across React Strict Mode unmounts/remounts
const loadedChildIds = new Set<string>();
const loadingChildIds = new Set<string>();

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

  const getCategoryHebrewName = (category: string): string => {
    const categoryMap: Record<string, string> = {
      'Starter': 'מילים בסיסיות',
      'Home': 'בית',
      'School': 'בית ספר',
      'Animals': 'חיות',
      'Colors': 'צבעים',
      'Food': 'אוכל',
      'Body': 'גוף',
      'Family': 'משפחה',
      'Clothes': 'בגדים',
      'Clothing': 'בגדים', // Support both spellings
      'Nature': 'טבע',
      'Transportation': 'תחבורה',
      'Sports': 'ספורט',
      'Weather': 'מזג אוויר',
      'Feelings': 'רגשות',
      'Numbers': 'מספרים',
      'Actions': 'פעולות',
      'אחר': 'אחר',
    };
    return categoryMap[category] || category;
  };

  const getCategoryIcon = (section: PathSection): string => {
    if (!section || !section.id) {
      return '📚';
    }
    
    // For letters section
    if (section.id === 'letters-all') {
      return '🔤';
    }
    
    // Extract category from section
    let category = '';
    
    // Try to extract from section id first (format: words-1-Category, words-2-Category, etc.)
    const match = section.id.match(/words-\d+-(.+)/);
    if (match) {
      category = match[1];
    } else if (section.title) {
      // Try to reverse map from Hebrew title
      const categoryMap: Record<string, string> = {
        'מילים בסיסיות': 'Starter',
        'בית': 'Home',
        'בית ספר': 'School',
        'חיות': 'Animals',
        'צבעים': 'Colors',
        'אוכל': 'Food',
        'גוף': 'Body',
        'משפחה': 'Family',
        'בגדים': 'Clothes',
        'טבע': 'Nature',
        'תחבורה': 'Transportation',
        'ספורט': 'Sports',
        'מזג אוויר': 'Weather',
        'רגשות': 'Feelings',
        'מספרים': 'Numbers',
        'פעולות': 'Actions',
        'אחר': 'אחר',
      };
      category = categoryMap[section.title] || section.title;
    }
    
    // Map category to emoji
    const iconMap: Record<string, string> = {
      'Starter': '🎯',
      'Home': '🏠',
      'School': '🏫',
      'Animals': '🐾',
      'Colors': '🎨',
      'Food': '🍎',
      'Body': '👤',
      'Family': '👨‍👩‍👧',
      'Clothes': '👕',
      'Clothing': '👕',
      'Nature': '🌳',
      'Transportation': '🚗',
      'Sports': '⚽',
      'Weather': '🌤️',
      'Feelings': '😊',
      'Numbers': '🔢',
      'Actions': '🏃',
      'אחר': '📦',
    };
    
    return iconMap[category] || '📚';
  };

  useEffect(() => {
    // Clear cache if childId changes (allows reloading when switching children)
    // But keep cache for same childId to prevent React Strict Mode double calls
    const previousChildId = Array.from(loadedChildIds)[0];
    if (previousChildId && previousChildId !== childId) {
      loadedChildIds.clear();
      loadingChildIds.clear();
    }
    
    // Use module-level cache to prevent multiple calls even with React Strict Mode
    // Set loading flag IMMEDIATELY (synchronously) to prevent race conditions
    if (loadingChildIds.has(childId)) {
      return;
    }
    if (loadedChildIds.has(childId)) {
      setLoading(false);
      return;
    }
    
    // Mark as loading immediately before calling loadPath
    loadingChildIds.add(childId);
    loadPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]); // Only depend on childId to prevent multiple calls

  // Reload path when returning from quiz to update completion status
  // Disabled to prevent interference with clicks during scroll animation
  // The path will reload naturally when navigating back to it
  // useEffect(() => {
  //   const handleVisibilityChange = () => {
  //     // Reload when tab becomes visible (user returns to the page)
  //     if (document.visibilityState === 'visible' && window.location.pathname === '/learn/path') {
  //       loadPath();
  //     }
  //   };
  //   
  //   const handleFocus = () => {
  //     // Reload when window regains focus (user switches back to tab)
  //     if (window.location.pathname === '/learn/path') {
  //       loadPath();
  //     }
  //   };
  //   
  //   document.addEventListener('visibilitychange', handleVisibilityChange);
  //   window.addEventListener('focus', handleFocus);
  //   
  //   return () => {
  //     document.removeEventListener('visibilitychange', handleVisibilityChange);
  //     window.removeEventListener('focus', handleFocus);
  //   };
  // }, [childId]);

  // Scroll to first incomplete section when sections are loaded (only once)
  useEffect(() => {
    if (!loading && sections.length > 0 && !hasScrolledRef.current && !userInteractedRef.current) {
      const firstIncompleteSection = sections.find(section => !section.completed);
      if (firstIncompleteSection) {
        hasScrolledRef.current = true;
        // Wait a bit for DOM to render, then scroll
        setTimeout(() => {
          // Don't scroll if user has interacted
          if (!userInteractedRef.current) {
            const sectionElement = sectionRefs.current.get(firstIncompleteSection.id);
            if (sectionElement) {
              // Custom rubbery scroll animation
              const startPosition = window.pageYOffset || document.documentElement.scrollTop;
              const sectionTop = sectionElement.getBoundingClientRect().top + startPosition;
              // Add offset to settle higher so category header is visible (negative = scroll up more)
              const offset = -100; // pixels to scroll higher
              const targetPosition = sectionTop + offset;
              const distance = targetPosition - startPosition;
              const duration = 1200; // milliseconds - shorter animation
              let startTime: number | null = null;
              let animationFrameId: number | null = null;

              // Rubber easing function (overshoots and bounces back) - less bounces
              const rubberEase = (t: number): number => {
                const c4 = (2 * Math.PI) / 3;
                if (t === 0) return 0;
                if (t === 1) return 1;
                // Reduced frequency for fewer bounces (1 bounce instead of multiple)
                return Math.pow(2, -10 * t) * Math.sin((t * 3 - 0.75) * c4) + 1;
              };

              const animateScroll = (currentTime: number) => {
                // Check if scrolling was cancelled
                if (!isScrollingRef.current || scrollAnimationRef.current === null || userInteractedRef.current) {
                  return;
                }
                
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                
                const easedProgress = rubberEase(progress);
                const currentPosition = startPosition + distance * easedProgress;
                
                window.scrollTo(0, currentPosition);
                
                if (timeElapsed < duration && isScrollingRef.current && scrollAnimationRef.current !== null && !userInteractedRef.current) {
                  animationFrameId = requestAnimationFrame(animateScroll);
                  scrollAnimationRef.current = animationFrameId;
                } else {
                  isScrollingRef.current = false;
                  scrollAnimationRef.current = null;
                }
              };

              isScrollingRef.current = true;
              animationFrameId = requestAnimationFrame(animateScroll);
              scrollAnimationRef.current = animationFrameId;
            }
          }
        }, 500);
      }
    }
  }, [loading, sections]);

  const loadPath = async () => {
    // Double-check cache (loading flag should already be set by useEffect)
    if (loadedChildIds.has(childId)) {
      loadingChildIds.delete(childId); // Clean up if already loaded
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Wrap each call individually to prevent one failure from breaking everything
      let level: any = propLevelState; // Use prop if available
      let progress: any[] = propProgress || []; // Use prop if available
      
      // Only fetch levelState if not provided as prop
      if (!propLevelState) {
        try {
          level = await getLevelState(childId);
        } catch (error: any) {
          console.error('Error loading level state:', error);
          level = { level: 1, xp: 0, id: '', childId, updatedAt: new Date() };
        }
      }
      
      // Only fetch progress if not provided as prop
      if (!propProgress) {
        try {
          // Mark as loaded BEFORE the server call to prevent race conditions
          // This ensures that even if another component tries to call the same action,
          // it will see that we're already loading/loaded
          if (loadedChildIds.has(childId)) {
            console.log('[LearnPath] Skipping getAllProgress - already loaded');
            // Return early if already loaded
            loadingChildIds.delete(childId);
            setLoading(false);
            return;
          }
          console.log('[LearnPath] Calling getAllProgress for childId:', childId);
          progress = await getAllProgress(childId);
          console.log('[LearnPath] getAllProgress completed, got', progress.length, 'items');
        } catch (error: any) {
          console.error('Error loading progress:', error);
          progress = [];
        }
      }

      setLevelState(level);

      const progressMap = new Map(progress.map((p: any) => [p.wordId, p]));

      const pathSections: PathSection[] = [];

      // Always show Level 1 sections if user has access
      let letters: any[] = [];
      let letterProgress: any[] = [];
      
      try {
        letters = await getAllLetters();
      } catch (error: any) {
        console.error('Error loading letters:', error);
        letters = [];
      }
      
      try {
        // Double-check cache before each server call
        if (loadedChildIds.has(childId)) {
          console.log('[LearnPath] Skipping getAllLetterProgress - already loaded');
          return;
        }
        letterProgress = await getAllLetterProgress(childId);
      } catch (error: any) {
        console.error('Error loading letter progress:', error);
        letterProgress = [];
      }
      
      const letterProgressMap = new Map(letterProgress.map((lp: any) => [lp.letterId, lp]));

      // Single section for all letters (A-Z)
      pathSections.push({
        id: 'letters-all',
        title: 'אותיות A-Z',
        color: 'teal',
        unlocked: true,
        completed: letters.every((l: any) => letterProgressMap.get(l.id)?.mastered),
        level: 1,
        lessons: letters.map((letter: any, index: number) => ({
          id: `letter-${letter.id}`,
          type: 'letter' as const,
          content: letter,
          completed: letterProgressMap.get(letter.id)?.mastered || false,
          active: index === 0 || letterProgressMap.get(letters[index - 1]?.id)?.mastered,
          locked: index > 0 && !letterProgressMap.get(letters[index - 1]?.id)?.mastered,
        })),
      });

      // Starter category in Level 1 (right after letters)
      // Use propAllWords if available, otherwise fetch
      let starterWords: any[] = [];
      if (propAllWords && propAllWords.length > 0) {
        // Filter propAllWords for difficulty 1 (level 2)
        starterWords = propAllWords.filter((w: any) => w.difficulty === 1);
      } else {
        // Fallback: fetch words if propAllWords is not available
        try {
          starterWords = await getAllWords(2);
        } catch (error) {
          console.error('Error fetching starter words:', error);
          starterWords = [];
        }
      }
      // Filter for Starter category - handle both string and null/undefined cases
      let starterCategoryWords = starterWords.filter((w: any) => {
        const category = w.category;
        return category === 'Starter' || category === 'starter' || (category === null && w.englishWord && ['Happy', 'Sad', 'I', 'You', 'Me'].includes(w.englishWord));
      });
      
      // If no Starter words found but we have difficulty 1 words, try fetching directly
      if (starterCategoryWords.length === 0 && starterWords.length > 0) {
        console.warn('[LearnPath] No Starter words found in propAllWords, attempting direct fetch...');
        try {
          const directStarterWords = await getAllWords(2);
          starterCategoryWords = directStarterWords.filter((w: any) => w.category === 'Starter');
          console.log('[LearnPath] Direct fetch found', starterCategoryWords.length, 'Starter words');
        } catch (error) {
          console.error('[LearnPath] Error fetching Starter words directly:', error);
        }
      }
      
      // Debug logging
      const sampleWords = starterWords.slice(0, 5);
      console.log('[LearnPath] Starter words check:', {
        propAllWordsLength: propAllWords?.length || 0,
        starterWordsLength: starterWords.length,
        starterCategoryWordsLength: starterCategoryWords.length,
        sampleStarterWords: starterCategoryWords.slice(0, 3).map((w: any) => w.englishWord),
        sampleDifficulty1Words: sampleWords.map((w: any) => ({ 
          word: w.englishWord, 
          category: w.category, 
          difficulty: w.difficulty,
          hasCategory: !!w.category,
          categoryType: typeof w.category
        }))
      });
      
      // Always show Starter section if words exist
      if (starterCategoryWords.length > 0) {
        const starterLessons: PathLesson[] = starterCategoryWords.map((word: any) => {
          const wordProgress = progressMap.get(word.id);
          const completed = (wordProgress?.masteryScore || 0) >= 80;

          return {
            id: `word-${word.id}`,
            type: 'word' as const,
            content: word,
            completed,
            active: true,
            locked: false,
          };
        });

        pathSections.push({
          id: 'words-1-Starter',
          title: getCategoryHebrewName('Starter'),
          color: 'green',
          unlocked: true,
          completed: starterLessons.every((l) => l.completed),
          level: 1,
          lessons: starterLessons,
        });
      }

      // Level 2+: Words Sections (show all levels for all users)
      // Show Level 2 words for all users (not just level 2+)
      {
        // Use propAllWords if available, otherwise fetch
        let level2Words: any[];
        if (propAllWords) {
          // Filter propAllWords for difficulty 1 (level 2)
          level2Words = propAllWords.filter((w: any) => w.difficulty === 1);
        } else {
          level2Words = await getAllWords(2);
        }
        
        // Group words by category for level 2 (excluding Starter)
        const wordsByCategory2 = new Map<string, any[]>();
        level2Words.forEach((word: any) => {
          // Skip Starter category - it's already in Level 1
          if (word.category === 'Starter') return;
          
          const category = word.category || 'אחר';
          if (!wordsByCategory2.has(category)) {
            wordsByCategory2.set(category, []);
          }
          wordsByCategory2.get(category)!.push(word);
        });

        // Only show categories that have words
        const sortedCategories = [...wordsByCategory2.keys()]
          .filter(cat => cat !== 'Starter')
          .sort((a, b) => a.localeCompare(b));
        
        const colors = ['green', 'blue', 'pink', 'purple', 'orange', 'teal'];
        let colorIndex = 0;

        // Show only categories with words
        sortedCategories.forEach((category) => {
          const categoryWords = wordsByCategory2.get(category) || [];
          
          // Skip empty categories
          if (categoryWords.length === 0) return;
          const sectionColor = colors[colorIndex % colors.length];
          const sectionId = `words-2-${category}`;
          
          const lessons: PathLesson[] = categoryWords.map((word: any, index: number) => {
            const wordProgress = progressMap.get(word.id);
            const completed = (wordProgress?.masteryScore || 0) >= 80;

            return {
              id: `word-${word.id}`,
              type: 'word' as const,
              content: word,
              completed,
              active: true, // All words are active
              locked: false, // No words are locked
            };
          });

          pathSections.push({
            id: sectionId,
            title: getCategoryHebrewName(category),
            color: sectionColor,
            unlocked: true, // All sections are unlocked
            completed: lessons.length > 0 && lessons.every((l) => l.completed),
            level: 2,
            lessons,
          });

          colorIndex++;
        });
      }

      // Show Level 3 words for all users (not just level 3+)
      {
        // Use propAllWords if available, otherwise fetch
        let level3Words: any[];
        if (propAllWords) {
          // Filter propAllWords for difficulty 2+ (level 3)
          level3Words = propAllWords.filter((w: any) => w.difficulty >= 2);
        } else {
          level3Words = await getAllWords(3);
        }
        
        // Group words by category for level 3
        const wordsByCategory3 = new Map<string, any[]>();
        level3Words.forEach((word: any) => {
          const category = word.category || 'אחר';
          if (!wordsByCategory3.has(category)) {
            wordsByCategory3.set(category, []);
          }
          wordsByCategory3.get(category)!.push(word);
        });

        // Only show categories that have words
        const sortedCategories = [...wordsByCategory3.keys()].sort((a, b) => {
          return a.localeCompare(b);
        });
        
        const colors = ['green', 'blue', 'pink', 'purple', 'orange', 'teal'];
        let colorIndex = 0;

        // Show only categories with words
        sortedCategories.forEach((category) => {
          const categoryWords = wordsByCategory3.get(category) || [];
          
          // Skip empty categories
          if (categoryWords.length === 0) return;
          const sectionColor = colors[colorIndex % colors.length];
          const sectionId = `words-3-${category}`;
          
          const lessons: PathLesson[] = categoryWords.map((word: any, index: number) => {
            const wordProgress = progressMap.get(word.id);
            const completed = (wordProgress?.masteryScore || 0) >= 80;

            return {
              id: `word-${word.id}`,
              type: 'word' as const,
              content: word,
              completed,
              active: true, // All words are active
              locked: false, // No words are locked
            };
          });

          pathSections.push({
            id: sectionId,
            title: getCategoryHebrewName(category),
            color: sectionColor,
            unlocked: true, // All sections are unlocked
            completed: lessons.length > 0 && lessons.every((l) => l.completed),
            level: 3,
            lessons,
          });

          colorIndex++;
        });
      }

      setSections(pathSections);
    } catch (error: any) {
      // Error loading path - log for debugging
      console.error('Error in loadPath:', {
        error: error?.message || error,
        stack: error?.stack,
        childId,
      });
      // Set empty sections to prevent UI from breaking
      setSections([]);
    } finally {
      setLoading(false);
      loadingChildIds.delete(childId); // Remove from loading set
      loadedChildIds.add(childId); // Mark as loaded
    }
  };

  const handleLessonClick = (lesson: PathLesson, section: PathSection) => {
    if (lesson.locked || !lesson.active) return;
    
    // Navigate to learn page with the specific lesson ID
    if (lesson.type === 'letter') {
      router.push(`/learn?letterId=${lesson.content.id}`);
    } else if (lesson.type === 'word') {
      router.push(`/learn?wordId=${lesson.content.id}`);
    } else {
      router.push('/learn');
    }
  };

  const handleJumpHere = (section: PathSection, e?: React.MouseEvent) => {
    // Cancel any ongoing scroll animation IMMEDIATELY
    if (scrollAnimationRef.current !== null) {
      cancelAnimationFrame(scrollAnimationRef.current);
      scrollAnimationRef.current = null;
      isScrollingRef.current = false;
    }
    
    // Mark that user has interacted to prevent auto-scroll
    userInteractedRef.current = true;
    
    // Prevent any default behavior IMMEDIATELY
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent.stopImmediatePropagation();
    }
    
    // For word sections (including Starter in level 1), navigate with category filter
    if (section.level >= 1 && section.id.startsWith('words-')) {
      // Extract category from section title (Hebrew) - need to reverse map
      const categoryMap: Record<string, string> = {
        'מילים בסיסיות': 'Starter',
        'בית': 'Home',
        'בית ספר': 'School',
        'חיות': 'Animals',
        'צבעים': 'Colors',
        'אוכל': 'Food',
        'גוף': 'Body',
        'משפחה': 'Family',
        'בגדים': 'Clothes',
        'טבע': 'Nature',
        'תחבורה': 'Transportation',
        'ספורט': 'Sports',
        'מזג אוויר': 'Weather',
        'רגשות': 'Feelings',
        'מספרים': 'Numbers',
        'פעולות': 'Actions',
        'אחר': 'אחר',
      };
      // Try to get category from title first, then from section id
      let englishCategory = categoryMap[section.title];
      if (!englishCategory) {
        // Extract from section id (format: words-1-Category, words-2-Category, or words-3-Category)
        const match = section.id.match(/words-\d+-(.+)/);
        if (match) {
          englishCategory = match[1];
        } else {
          englishCategory = section.title;
        }
      }
      // For word sections, navigate to learn page with category
      // Always pass level parameter - use section.level, but for Starter (level 1), use level 2 since Starter words are difficulty 1
      const levelToPass = section.level === 1 && englishCategory === 'Starter' ? 2 : section.level;
      const url = `/learn?category=${encodeURIComponent(englishCategory)}${levelToPass > 1 ? `&level=${levelToPass}` : ''}`;
      // Navigate immediately without any async operations
      window.location.assign(url);
    } else {
      // For letters, use the first lesson
      const firstActiveLesson = section.lessons.find((l) => l.active && !l.locked);
      if (firstActiveLesson) {
        handleLessonClick(firstActiveLesson, section);
      }
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      teal: 'bg-teal-500 hover:bg-teal-600 border-teal-600',
      green: 'bg-green-500 hover:bg-green-600 border-green-600',
      blue: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
      pink: 'bg-pink-500 hover:bg-pink-600 border-pink-600',
      purple: 'bg-purple-500 hover:bg-purple-600 border-purple-600',
      orange: 'bg-orange-500 hover:bg-orange-600 border-orange-600',
    };
    return colors[color] || colors.green;
  };

  const getButtonColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      teal: 'bg-teal-100 border-teal-300 text-teal-800',
      green: 'bg-green-100 border-green-300 text-green-800',
      blue: 'bg-blue-100 border-blue-300 text-blue-800',
      pink: 'bg-pink-100 border-pink-300 text-pink-800',
      purple: 'bg-purple-100 border-purple-300 text-purple-800',
      orange: 'bg-orange-100 border-orange-300 text-orange-800',
    };
    return colors[color] || colors.green;
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">טוען נתיב למידה...</p>
      </div>
    );
  }

  // Group sections by level
  const sectionsByLevel = new Map<number, PathSection[]>();
  sections.forEach(section => {
    if (!sectionsByLevel.has(section.level)) {
      sectionsByLevel.set(section.level, []);
    }
    sectionsByLevel.get(section.level)!.push(section);
  });

  const getLevelTitle = (level: number) => {
    if (level === 1) return 'רמה 1: אותיות';
    if (level === 2) return 'רמה 2: מילים התחלתיות';
    if (level === 3) return 'רמה 3: מילים מתקדמות';
    return `רמה ${level}`;
  };

  const getLevelColor = (level: number) => {
    if (level === 1) return 'bg-blue-100 border-blue-400 text-blue-800';
    if (level === 2) return 'bg-green-100 border-green-400 text-green-800';
    if (level === 3) return 'bg-purple-100 border-purple-400 text-purple-800';
    return 'bg-gray-100 border-gray-400 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-32">
      {/* Path Container */}
      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Path Line */}
        <div className="absolute right-1/2 top-0 bottom-0 w-1 bg-gray-200 transform translate-x-1/2"></div>

        {/* Sections grouped by level */}
        {Array.from(sectionsByLevel.entries()).map(([level, levelSections], levelIndex) => {
          return (
            <div key={`level-${level}`} className="relative mb-12">
              {/* Level Header */}
              <div className="sticky top-0 z-20 mb-8 pt-4 pb-2 bg-gradient-to-b from-gray-50 to-transparent">
                <div className={`${getLevelColor(level)} border-2 rounded-xl px-6 py-3 text-center shadow-lg`}>
                  <h1 className="text-2xl md:text-3xl font-bold">{getLevelTitle(level)}</h1>
                </div>
              </div>

              {/* Level Divider */}
              {levelIndex > 0 && (
                <div className="absolute right-1/2 top-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent transform translate-x-1/2 -translate-y-4"></div>
              )}

              {/* Sections in this level */}
              {levelSections.map((section, sectionIndex) => {
                const hasActiveLesson = section.lessons.length > 0 && section.lessons.some((l) => l.active && !l.locked);
                const isUnlocked = true; // All sections are unlocked
                // Show start button if unlocked and either has active lessons OR is a word section (level >= 2)
                const shouldShowStartButton = isUnlocked && (hasActiveLesson || (section.level >= 2 && section.lessons.length === 0));

                return (
                  <div 
                    key={section.id}
                    ref={(el) => {
                      if (el) {
                        sectionRefs.current.set(section.id, el);
                      } else {
                        sectionRefs.current.delete(section.id);
                      }
                    }}
                    className={`relative mb-16 ${
                      section.completed ? 'bg-green-50 rounded-xl p-4 border-2 border-green-200' : ''
                    }`}
                  >
                    {/* Section Divider */}
                    {sectionIndex > 0 && (
                      <div className="absolute right-1/2 top-0 w-full h-0.5 bg-gray-300 transform translate-x-1/2 -translate-y-8"></div>
                    )}

                    {/* Section Title */}
                    <div className="text-center mb-6">
                      <div className="flex items-center justify-center gap-2">
                        {section.completed && (
                          <span className="text-2xl md:text-3xl">✅</span>
                        )}
                        <h2 className={`text-xl md:text-2xl font-bold mb-2 ${
                          section.completed 
                            ? 'text-green-600 line-through opacity-75' 
                            : isUnlocked 
                              ? 'text-gray-800' 
                              : 'text-gray-400'
                        }`}>
                          {section.title}
                        </h2>
                      </div>
                      {section.completed && (
                        <p className="text-sm text-green-600 font-medium mt-1">הושלם!</p>
                      )}
                    </div>

                    {/* Start Button */}
                    {shouldShowStartButton && (
                      <div className="flex justify-center mb-4">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            handleJumpHere(section, e);
                          }}
                          className={`${
                            section.completed 
                              ? 'bg-green-500 hover:bg-green-600 border-green-600 opacity-75' 
                              : getColorClasses(section.color)
                          } w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 relative z-10`}
                        >
                          <span className="text-3xl md:text-4xl">{getCategoryIcon(section)}</span>
                          {section.completed && (
                            <div className="absolute top-0 right-0 w-5 h-5 md:w-6 md:h-6 bg-green-600 rounded-full flex items-center justify-center border-2 border-white">
                              <svg className="w-3 h-3 md:w-4 md:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Lessons - unified per category, no individual icons */}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* End of Path */}
        {sections.length > 0 && sections.every((s) => s.completed) && (
          <div className="text-center mt-16">
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-6 shadow-xl">
              <span className="text-4xl">🎉</span>
            </div>
            <p className="mt-4 text-xl font-bold text-gray-800">כל הכבוד! סיימת את כל השיעורים!</p>
          </div>
        )}
      </div>
    </div>
  );
}
