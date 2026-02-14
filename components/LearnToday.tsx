'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { markWordSeen } from '@/app/actions/progress';
import { completeLearningSession } from '@/app/actions/learning';
import { markLetterSeen, getAllLetters } from '@/app/actions/content';
import { addXP } from '@/app/actions/levels';
import { useRouter, useSearchParams } from 'next/navigation';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound } from '@/lib/sounds';
import { Volume2, ChevronLeft } from 'lucide-react';

interface LearnTodayProps {
  userId: string;
  todayPlan?: any;
  wordId?: string;
  letterId?: string;
  category?: string;
  level?: number;
  onModeSwitch?: (mode: 'learn' | 'quiz') => void;
  currentMode?: 'learn' | 'quiz';
}

export default function LearnToday({ userId, todayPlan, wordId, letterId, category, level, onModeSwitch, currentMode: propMode }: LearnTodayProps) {
  const searchParams = useSearchParams();
  const urlLevel = searchParams?.get('level');
  const levelToUse = level || (urlLevel ? parseInt(urlLevel) : undefined);
  const currentMode = propMode || searchParams?.get('mode') || 'learn';
  
  // Determine if this is letters mode (level 1 and no todayPlan/category)
  const isLettersMode = (!todayPlan && !category && (levelToUse === 1 || level === 1));
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [isPending, startTransition] = useTransition();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(isLettersMode);
  const [letters, setLetters] = useState<any[]>([]);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const prevModeRef = useRef<string>(currentMode);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: y * -10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const words = todayPlan?.words?.map((w: any) => w.word) || [];

  // Load letters if in letters mode
  useEffect(() => {
    if (isLettersMode) {
      loadLetters();
    }
  }, [userId, letterId, isLettersMode]);

  const loadLetters = async () => {
    try {
      setLoading(true);
      const allLetters = await getAllLetters();
      
      if (letterId) {
        const letterIndex = allLetters.findIndex((l: any) => l.id === letterId);
        if (letterIndex >= 0) {
          setLetters(allLetters);
          setCurrentIndex(letterIndex);
        } else {
          setLetters(allLetters);
        }
      } else {
        if (allLetters.length === 0) {
          setCompleted(true);
        } else {
          setLetters(allLetters);
        }
      }
    } catch (error: any) {
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isLettersMode) return;
    
    if (wordId && words.length > 0) {
      const wordIndex = words.findIndex((w: any) => w.id === wordId);
      if (wordIndex >= 0) {
        setCurrentIndex(wordIndex);
      }
    }
    if (words.length === 0) {
      setCompleted(true);
    }
  }, [wordId, words.length, isLettersMode]);

  useEffect(() => {
    const wasInQuiz = prevModeRef.current === 'quiz';
    const isNowInLearn = currentMode === 'learn';
    if (wasInQuiz && isNowInLearn) {
      setCompleted(false);
      setShowCelebration(false);
    }
    prevModeRef.current = currentMode;
  }, [currentMode]);


  const handleNext = async () => {
    if (isProcessingRef.current) return;
    
    if (isLettersMode) {
      const letter = letters[currentIndex];
      const currentIdx = currentIndex;
      const isLastLetter = currentIdx >= letters.length - 1;
      
      if (!isLastLetter) {
        setCurrentIndex(currentIdx + 1);
      }
      
      playSuccessSound();
      
      startTransition(async () => {
        markLetterSeen(userId, letter.id, true).catch(console.error);
        
        if (isLastLetter) {
          try {
            const { checkLevel1Complete } = await import('@/app/actions/content');
            const level1Complete = await checkLevel1Complete(userId);
            if (level1Complete) {
              const { checkAndUnlockLevel2 } = await import('@/app/actions/levels');
              await checkAndUnlockLevel2(userId);
              await addXP(userId, 50);
              setXpGained(50);
            } else {
              await addXP(userId, 30);
              setXpGained(30);
            }
            setShowCelebration(true);
            setCompleted(true);
          } catch (error) {
            console.error('Error completing letter learning:', error);
            setShowCelebration(true);
            setCompleted(true);
            setXpGained(30);
          }
        }
      });
      return;
    }
    
    const word = words[currentIndex];
    if (currentIndex < words.length - 1) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      startTransition(async () => {
        await markWordSeen(userId, word.id);
        isProcessingRef.current = false;
        setIsProcessing(false);
      });
      playSuccessSound();
      setCurrentIndex(currentIndex + 1);
    } else {
      isProcessingRef.current = true;
      setIsProcessing(true);
      playSuccessSound();
      const xp = words.length * 5;
      setXpGained(xp);
      setShowCelebration(true);
      setCompleted(true);
      completeLearningSession(userId, word.id, words.length, xp)
        .finally(() => {
          isProcessingRef.current = false;
          setIsProcessing(false);
        });
    }
  };

  const speakWord = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      // Convert to lowercase for speech to avoid saying "capital"
      const speechText = text.toLowerCase();
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Loading state for letters
  if (isLettersMode && loading) {
    return (
      <div className="p-8 text-center glass-premium rounded-3xl max-w-2xl mx-auto mt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto"></div>
        <p className="text-xl text-white font-black mt-4">טוען אותיות...</p>
      </div>
    );
  }

  // Empty state for letters
  if (isLettersMode && letters.length === 0 && !loading) {
    return (
      <div className="p-10 text-center glass-premium rounded-3xl max-w-2xl mx-auto mt-20">
        <p className="text-2xl text-white font-black mb-6">סיימת את כל האותיות להיום!</p>
        <button onClick={() => router.push('/learn/path')} className="bg-primary-500 text-white px-10 py-4 rounded-2xl font-black shadow-lg glow-primary">חזור למפה</button>
      </div>
    );
  }

  // Celebration for letters
  if (isLettersMode && showCelebration && completed) {
    return (
      <>
        <CelebrationScreen
          title="כל הכבוד!"
          message={`סיימת ללמוד את כל האותיות! קיבלת ${xpGained} נקודות נסיון!`}
          emoji="🎉"
          showConfetti={false}
          actionLabel="עבור לחידון"
          onAction={() => {
            window.location.href = '/learn?mode=quiz&level=1';
          }}
          onClose={() => {
            window.location.href = '/learn?mode=quiz&level=1';
          }}
        />
      </>
    );
  }

  if (!isLettersMode && words.length === 0) {
    return (
      <div className="p-4 text-center glass-premium rounded-3xl p-10">
        <p className="text-2xl text-white font-black mb-4">אין מילים ללמידה היום</p>
        <p className="text-white/60">בקש מהורה להגדיר תוכנית יומית</p>
      </div>
    );
  }

  if (showCelebration && completed) {
    const percentage = 100;
    return (
      <>
        <CelebrationScreen
          title="סיימת ללמוד!"
          message={`סיימת ללמוד ${words.length} מילים היום! קיבלת ${xpGained} נקודות נסיון!`}
          emoji={percentage >= 70 ? '🎉' : '💪'}
          showConfetti={showCelebration && percentage >= 70}
          actionLabel="עבור לחידון"
          onAction={() => {
            let categoryToUse = category;
            
            if (!categoryToUse) {
              const urlCategory = searchParams?.get('category');
              if (urlCategory) {
                categoryToUse = urlCategory;
              }
            }
            
            if (!categoryToUse && todayPlan?.id) {
              const matchWithLevel = todayPlan.id.match(/category-(.+?)-level/);
              if (matchWithLevel && matchWithLevel[1]) {
                categoryToUse = matchWithLevel[1];
              } else {
                const matchSimple = todayPlan.id.match(/^category-(.+)$/);
                if (matchSimple && matchSimple[1]) {
                  categoryToUse = matchSimple[1];
                }
              }
            }
            
            const quizLevel = levelToUse || (searchParams?.get('level') ? parseInt(searchParams.get('level')!) : undefined) || todayPlan?.id?.match(/level-(\d+)/)?.[1];
            
            if (categoryToUse && categoryToUse.trim() !== '') {
              const quizUrl = `/learn?mode=quiz&category=${encodeURIComponent(categoryToUse.trim())}${quizLevel ? `&level=${quizLevel}` : ''}`;
              window.location.href = quizUrl;
            } else {
              window.location.href = '/learn/path';
            }
          }}
          onClose={() => {
            router.push('/learn/path');
            setTimeout(() => router.refresh(), 100);
          }}
        />
      </>
    );
  }

  const currentItem = isLettersMode ? letters[currentIndex] : words[currentIndex];
  const totalCount = isLettersMode ? letters.length : words.length;

  return (
    <>
      <div className="flex flex-col px-2 sm:px-4 pb-20 sm:pb-24 md:pb-28 lg:pb-32" style={{ height: '100%', gap: '0px', alignItems: 'stretch', justifyContent: 'flex-start', overflow: 'hidden' }}>
        {/* Counter */}
        <div className="text-center" style={{ margin: '0', padding: '0', lineHeight: '1', flexShrink: '0', height: 'auto' }}>
          <span className="text-xs sm:text-sm font-bold text-white/80" style={{ display: 'block', lineHeight: '1', margin: '0', padding: '0' }}>
            {isLettersMode ? `אות ${currentIndex + 1} מתוך ${totalCount}` : `מילה ${currentIndex + 1} מתוך ${totalCount}`}
          </span>
        </div>

        {/* Flashcard Container - fills remaining space, positions glass card near top */}
        <div
          className="relative perspective-2000 group flex-1 min-h-0 learn-today-flashcard"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'center',
            marginTop: '0px',
            paddingTop: '0px',
            paddingBottom: '0px',
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className={`glass-premium rounded-xl md:rounded-2xl lg:rounded-3rem text-center border-white/20 w-full ${isLettersMode ? 'p-3 sm:p-4 md:p-6 lg:p-10' : 'p-3 sm:p-4 md:p-6 lg:p-10'}`} style={{ height: '100%', position: 'relative', marginTop: '8px', marginBottom: '0px', display: 'flex', flexDirection: 'column' }}>
            <div className={`relative flex-1 flex flex-col justify-center ${isLettersMode ? 'px-2 sm:px-4 md:px-6' : 'px-4 sm:px-6 md:px-10'}`} style={{ width: '100%' }}>
              {isLettersMode ? (
                <>
                  <h2 className="font-black mb-2 text-white tracking-tighter" style={{ fontSize: 'clamp(3rem, 8vh, 8rem)' }}>
                    {currentItem.letter}
                  </h2>
                  <p className="font-bold text-white/90 mb-2" style={{ fontSize: 'clamp(1rem, 3vh, 2rem)' }} dir="ltr">
                    {currentItem.name}
                  </p>
                  {currentItem.hebrewName && (
                    <p className="font-bold text-white/70 mb-2" style={{ fontSize: 'clamp(1rem, 3vh, 2rem)' }} dir="rtl">
                      {currentItem.hebrewName}
                    </p>
                  )}
                  <div className="flex justify-center mt-4 mb-2">
                    <button
                      onClick={() => speakWord(currentItem.name || currentItem.letter)}
                      className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
                      style={{ width: 'clamp(3rem, 8vh, 4rem)', height: 'clamp(3rem, 8vh, 4rem)' }}
                    >
                      <Volume2 style={{ width: 'clamp(1.5rem, 4vh, 2rem)', height: 'clamp(1.5rem, 4vh, 2rem)' }} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-black mb-2 text-white tracking-tighter" style={{ fontSize: 'clamp(3rem, 8vh, 8rem)' }} dir="ltr">
                    {currentItem.englishWord}
                  </h2>
                  <p className="font-bold text-white/90 mb-2" style={{ fontSize: 'clamp(1rem, 3vh, 2rem)' }} dir="rtl">
                    {currentItem.hebrewTranslation}
                  </p>
                  <div className="flex justify-center mt-4 mb-2">
                    <button
                      onClick={() => speakWord(currentItem.englishWord)}
                      className="rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-white/15 active:scale-95 transition-all"
                      style={{ width: 'clamp(3rem, 8vh, 4rem)', height: 'clamp(3rem, 8vh, 4rem)' }}
                    >
                      <Volume2 style={{ width: 'clamp(1.5rem, 4vh, 2rem)', height: 'clamp(1.5rem, 4vh, 2rem)' }} />
                    </button>
                  </div>
                  {isClient && currentItem.exampleEn && (
                    <div className="mt-auto pt-4 border-t border-white/10">
                      <p className="font-medium text-white/80 mb-1 leading-relaxed" style={{ fontSize: 'clamp(0.75rem, 2vh, 1rem)' }} dir="ltr">
                        "{currentItem.exampleEn}"
                      </p>
                      <p className="text-white/70 font-medium" style={{ fontSize: 'clamp(0.75rem, 2vh, 1rem)' }} dir="rtl">
                        {currentItem.exampleHe}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls - Fixed at bottom, outside flex container */}
      {isLettersMode ? (
        <div className="flex gap-2 items-center justify-between" style={{ position: 'fixed', bottom: '0', left: '0', right: '0', marginTop: '0', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', flexShrink: '0', backgroundColor: 'transparent', zIndex: '10' }}>
          <div className="w-8 h-8"></div>
          <button
            onClick={handleNext}
            disabled={isPending}
            className="flex-1 h-10 sm:h-12 md:h-14 rounded-lg md:rounded-xl lg:rounded-2xl text-sm sm:text-base md:text-lg lg:text-xl font-black text-white bg-primary-500 hover:bg-primary-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            המשך ✨
          </button>
          <div className="w-8 h-8"></div>
        </div>
      ) : (
        <div className="flex gap-2 items-center justify-between" style={{ position: 'fixed', bottom: '0', left: '0', right: '0', marginTop: '0', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '16px', paddingRight: '16px', flexShrink: '0', backgroundColor: 'transparent', zIndex: '10' }}>
          <div className="w-8 h-8"></div>
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="flex-1 h-10 sm:h-12 md:h-14 rounded-lg md:rounded-xl lg:rounded-2xl text-sm sm:text-base md:text-lg lg:text-xl font-black text-white bg-primary-500 hover:bg-primary-400 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span>{currentIndex < words.length - 1 ? 'המילה הבאה' : 'סיים יחידה!'}</span>
            <ChevronLeft className={`w-3 h-3 sm:w-4 sm:h-4 ${currentIndex < words.length - 1 ? 'animate-bounce-x' : ''}`} />
          </button>
          <div className="w-8 h-8"></div>
        </div>
      )}
    </>
  );
}
