'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { recordQuizAttempt, revalidateLearnPath } from '@/app/actions/progress';
import { getAllWords, getWordsByCategory, getAllCategories } from '@/app/actions/words';
import { getSettings } from '@/app/actions/settings';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';
import { Volume2, SkipBack, CheckCircle2, XCircle } from 'lucide-react';

interface QuizProps {
  userId: string;
  todayPlan: any;
  category?: string;
  levelState?: any; // Pass levelState to avoid fetching it again
  categoryWords?: any[]; // Pass categoryWords to avoid fetching them again
  onModeSwitch?: (mode: 'learn' | 'quiz') => void;
}

export default function Quiz({ userId, todayPlan, category, levelState: propLevelState, categoryWords: propCategoryWords, onModeSwitch }: QuizProps) {
  const searchParams = useSearchParams();
  const level = searchParams?.get('level');
  // Don't read mode from URL - use callback prop instead to avoid re-renders
  const currentMode = 'quiz'; // Always quiz when this component is rendered
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedAnswerQuestionId, setSelectedAnswerQuestionId] = useState<string | null>(null); // Track which question the answer belongs to
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [retryUsed, setRetryUsed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [usedWordIds, setUsedWordIds] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const [pendingQuizAttempts, setPendingQuizAttempts] = useState<Promise<any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null); // Track plan ID to detect changes
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 8, y: y * -8 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };
  const isGeneratingRef = useRef(false); // Track if we're currently generating questions
  const continueButtonRef = useRef<HTMLButtonElement>(null); // Ref for continue button to scroll into view
  const [nextCategory, setNextCategory] = useState<string | null>(null);
  const router = useRouter();

  const words = todayPlan?.words?.map((w: any) => w.word) || [];

  // Track when todayPlan changes (new quiz started)
  // Only generate questions if planId changes AND questions don't exist yet
  useEffect(() => {
    const newPlanId = todayPlan?.id || null;
    if (newPlanId !== planId && newPlanId !== null) {
      setPlanId(newPlanId);
      // Only generate questions if we don't have any yet (preserve state when switching modes)
      if (questions.length === 0 && todayPlan?.words?.length > 0) {
        setCurrentIndex(0); // Reset index when plan changes
        // Use requestAnimationFrame to defer question generation and prevent reload
        requestAnimationFrame(() => {
          generateQuestions();
        });
      } else {
        // If plan changed but we have questions, just reset the index (don't regenerate)
        setCurrentIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayPlan?.id]); // Only depend on todayPlan.id

  // Fallback: if loading takes too long or questions are empty but we have words, regenerate
  useEffect(() => {
    if (loading && todayPlan?.words?.length > 0 && questions.length === 0) {
      const timeout = setTimeout(() => {
        if (questions.length === 0 && !isGeneratingRef.current) {
          generateQuestions();
        }
      }, 3000); // Wait 3 seconds before retrying
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, questions.length, todayPlan?.words?.length]);

  // Reset answer selection when moving to next question
  useEffect(() => {
    // Reset all state when question changes
    setSelectedAnswer(null);
    setSelectedAnswerQuestionId(null);
    setShowResult(false);
    setIsCorrect(false);
    setRetryUsed(false);
  }, [currentIndex]);

  // Auto-scroll to continue button when showing result (especially for correct answers)
  useEffect(() => {
    if (showResult && selectedAnswerQuestionId && continueButtonRef.current) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        continueButtonRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [showResult, selectedAnswerQuestionId]);

  // Helper function to find next category from allWords data
  const findNextCategoryFromWords = (levelWords: any[], currentCategory: string | undefined) => {
    if (!currentCategory) {
      setNextCategory(null);
      return;
    }

    try {
      // Extract unique categories from words at this level, excluding Starter
      const categoriesSet = new Set<string>();
      levelWords.forEach((word: any) => {
        if (word.category && !word.category.startsWith('Starter')) {
          categoriesSet.add(word.category);
        }
      });

      // Sort categories alphabetically
      const sortedCategories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
      const currentIndex = sortedCategories.indexOf(currentCategory);

      if (currentIndex >= 0 && currentIndex < sortedCategories.length - 1) {
        setNextCategory(sortedCategories[currentIndex + 1]);
      } else {
        setNextCategory(null); // No next category
      }
    } catch (error) {
      setNextCategory(null);
    }
  };

  const generateQuestions = async (resetUsedWords: boolean = false, useAllAvailableWords: boolean = false) => {
    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current) {
      // If already generating, wait a bit and check again
      setTimeout(() => {
        if (questions.length === 0 && todayPlan?.words?.length > 0) {
          generateQuestions(resetUsedWords, useAllAvailableWords);
        }
      }, 1000);
      return;
    }

    try {
      isGeneratingRef.current = true;
      setLoading(true);
      setError(null);
      const settings = await getSettings();

      // Use propLevelState if available, otherwise fetch it
      let levelState = propLevelState;
      if (!levelState) {
        const { getLevelState } = await import('@/app/actions/levels');
        levelState = await getLevelState(userId);
      }

      // Use propCategoryWords if available, otherwise fetch them
      let filteredWords: any[];
      if (propCategoryWords && propCategoryWords.length > 0) {
        filteredWords = propCategoryWords;
      } else if (category) {
        // Parse level from URL if it's there, otherwise use propLevelState
        const levelToUse = level ? parseInt(level) : (levelState?.level || 1);
        filteredWords = await getWordsByCategory(category, levelToUse);
      } else {
        // Fallback: use words from todayPlan if category is not provided (shouldn't happen)
        filteredWords = words;
      }

      // Fetch allWords to generate wrong answers
      const allWords = await getAllWords(levelState.level);

      // Find next category using the allWords we just fetched (avoid separate fetch)
      findNextCategoryFromWords(allWords, category);

      const questionList: any[] = [];

      // Determine which word pool to use for quiz questions
      // If restarting and we want variety, use all words instead of just today's plan
      const wordPool = (useAllAvailableWords && allWords.length > 0) ? allWords : filteredWords;

      if (wordPool.length === 0) {
        setError('אין מילים זמינות לחידון. נסה ללמוד עוד מילים תחילה.');
        setLoading(false);
        isGeneratingRef.current = false;
        setQuestions([]);
        return;
      }

      // Use fresh word IDs if resetting, otherwise use current state
      const currentUsedWordIds = resetUsedWords ? new Set<string>() : usedWordIds;

      // Get words that haven't been used yet, or all words if we've used them all
      const availableWords = wordPool.filter((w: any) => !currentUsedWordIds.has(w.id));
      const wordsToUse = availableWords.length > 0 ? availableWords : wordPool;

      // Shuffle to get different words each time
      const shuffledWords = [...wordsToUse].sort(() => Math.random() - 0.5);

      // Always use all words in the category (category is now required)
      const quizLength = wordPool.length;
      const wordsForQuiz = shuffledWords.slice(0, quizLength);

      // Update used word IDs
      const newUsedWordIds = resetUsedWords ? new Set<string>() : new Set(currentUsedWordIds);
      wordsForQuiz.forEach((w: any) => newUsedWordIds.add(w.id));
      setUsedWordIds(newUsedWordIds);

      for (const word of wordsForQuiz) {
        const questionTypes: string[] = [];
        if (settings.questionTypes.enToHe) questionTypes.push('EN_TO_HE');
        if (settings.questionTypes.heToEn) questionTypes.push('HE_TO_EN');
        if (settings.questionTypes.audioToEn) questionTypes.push('AUDIO_TO_EN');

        if (questionTypes.length === 0) continue;

        const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];

        // Use a seeded random to ensure consistent wrong answers for the same word
        const seed = word.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);

        const correctAnswer = questionType === 'EN_TO_HE' ? word.hebrewTranslation : word.englishWord;

        // Generate wrong answers with consistent selection
        // Use words from the SAME CATEGORY as the correct answer
        // Filter out words that have the same translation as the correct answer
        const wrongAnswerPool = filteredWords.length > 0 ? filteredWords : allWords; // Prefer filteredWords (same category), fallback to allWords
        const availableWordsForWrongAnswers = wrongAnswerPool.filter((w: any) => {
          if (w.id === word.id) return false;
          // Only use words from the same category
          if (w.category !== word.category) return false;
          const wAnswer = questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord;
          return wAnswer !== correctAnswer; // Exclude words with same translation
        });

        // Sort by a hash based on word id and seed to get consistent order
        const sortedWords = [...availableWordsForWrongAnswers].sort((a, b) => {
          const hashA = (a.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + seed) % 1000;
          const hashB = (b.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + seed) % 1000;
          return hashA - hashB;
        });

        // Get wrong answers and ensure uniqueness
        const wrongAnswerSet = new Set<string>();
        for (const w of sortedWords) {
          const wAnswer = questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord;
          if (wAnswer !== correctAnswer && !wrongAnswerSet.has(wAnswer)) {
            wrongAnswerSet.add(wAnswer);
            if (wrongAnswerSet.size >= 3) break;
          }
        }

        const wrongAnswers = Array.from(wrongAnswerSet);

        // If we don't have enough unique wrong answers, try to find more
        if (wrongAnswers.length < 3 && availableWordsForWrongAnswers.length > wrongAnswers.length) {
          // Try to find more unique answers
          for (const w of sortedWords) {
            const wAnswer = questionType === 'EN_TO_HE' ? (w as any).hebrewTranslation : (w as any).englishWord;
            if (wAnswer !== correctAnswer && !wrongAnswers.includes(wAnswer)) {
              wrongAnswers.push(wAnswer);
              if (wrongAnswers.length >= 3) break;
            }
          }
        }

        // If we still don't have enough wrong answers (shouldn't happen with proper data), 
        // we'll just use what we have (minimum 1 correct + wrong answers)

        // Shuffle answers randomly using Fisher-Yates algorithm
        const allAnswers = [correctAnswer, ...wrongAnswers];
        const shuffledAnswers = [...allAnswers];
        // Fisher-Yates shuffle for true randomization
        for (let i = shuffledAnswers.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledAnswers[i], shuffledAnswers[j]] = [shuffledAnswers[j], shuffledAnswers[i]];
        }

        questionList.push({
          word,
          questionType,
          correctAnswer,
          answers: shuffledAnswers,
        });
      }

      // Ensure we have at least some questions
      if (questionList.length === 0) {
        setError('לא ניתן ליצור שאלות. בדוק את הגדרות החידון.');
        setLoading(false);
        isGeneratingRef.current = false;
        setQuestions([]);
        return;
      }

      setQuestions(questionList);
      // Reset currentIndex when generating new questions (but only if resetting)
      if (resetUsedWords) {
        setCurrentIndex(0);
      }
      setLoading(false);
      isGeneratingRef.current = false;
    } catch (err: any) {
      setError('שגיאה בטעינת החידון. נסה שוב.');
      setLoading(false);
      isGeneratingRef.current = false;
      setQuestions([]);
    } finally {
      // Ensure loading is always set to false
      setLoading(false);
      isGeneratingRef.current = false;
    }
  };

  const handleAnswerSelect = async (answer: string) => {
    // Only allow selection if there's no result for the current question
    const currentQuestionId = questions[currentIndex]?.word.id;
    if (showResult && selectedAnswerQuestionId === currentQuestionId) return;

    setSelectedAnswer(answer);
    setSelectedAnswerQuestionId(currentQuestionId);

    // Immediately check the answer
    const question = questions[currentIndex];
    const correct = answer === question.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    // Play sound based on result
    if (correct) {
      playSuccessSound();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
      setScore(prev => ({ ...prev, correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      playFailureSound();
      if (retryUsed) {
        setScore(prev => ({ ...prev, total: prev.total + 1 }));
      }
    }

    if (!correct && !retryUsed) {
      // Allow retry - don't record attempt yet
      return;
    }

    // Record attempt
    const attemptPromise = recordQuizAttempt(
      userId,
      question.word.id,
      question.questionType as any,
      correct,
      false
    );
    setPendingQuizAttempts(prev => [...prev, attemptPromise]);
    attemptPromise.catch(() => {});
  };

  const handleSkip = async () => {
    if (showResult) return;

    // Play failure sound for skip
    playFailureSound();

    const question = questions[currentIndex];
    // Record skip as incorrect attempt
    await recordQuizAttempt(
      userId,
      question.word.id,
      question.questionType as any,
      false,
      false
    );

    setScore({ ...score, total: score.total + 1 });

    // Move to next question
    if (currentIndex < questions.length - 1) {
      setSelectedAnswer(null);
      setSelectedAnswerQuestionId(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      // Wait for all pending quiz attempts to complete before finishing quiz
      const currentPending = pendingQuizAttempts;
      if (currentPending.length > 0) {
        try {
          await Promise.all(currentPending);
        } catch (error) {
        }
      }

      const xp = score.correct * 10;
      setXpGained(xp);
      setShowCelebration(true);
      await updateMissionProgress(userId, 'DAILY', 'complete_quiz', 1, 1);
      await addXP(userId, xp);

      // Revalidate path to refresh category completion status via server action
      await revalidateLearnPath();
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      // Reset all state FIRST before moving to next question
      setSelectedAnswer(null);
      setSelectedAnswerQuestionId(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
      // Then move to next question - use functional update to ensure we get latest value
      setCurrentIndex((prevIndex) => prevIndex + 1);
    } else {
      const xp = score.correct * 10;
      setXpGained(xp);
      setShowCelebration(true);
      await updateMissionProgress(userId, 'DAILY', 'complete_quiz', 1, 1);
      await addXP(userId, xp);
    }
  };

  const handleRetry = () => {
    setRetryUsed(true);
    setShowResult(false);
    setSelectedAnswer(null);
    setSelectedAnswerQuestionId(null);
  };

  const speakWord = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (words.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-white mb-4 font-black">אין מילים לחידון היום</p>
        <p className="text-white/70">בקש מהורה להגדיר תוכנית יומית</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-xl text-white font-black">טוען חידון...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-red-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            generateQuestions();
          }}
          className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
        >
          נסה שוב
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-white mb-4 font-black">אין מילים זמינות לחידון</p>
        <p className="text-white/70 mb-4">נסה ללמוד עוד מילים תחילה</p>
        <button
          onClick={() => router.push('/learn/path')}
          className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
        >
          🏠 חזור לנתיב הלמידה
        </button>
      </div>
    );
  }

  const handleNewQuiz = async () => {
    setCompleted(false);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setSelectedAnswerQuestionId(null);
    setShowResult(false);
    setIsCorrect(false);
    setRetryUsed(false);
    setScore({ correct: 0, total: 0 });
    // Use all words for new quiz to get variety
    await generateQuestions(true, true);
  };

  const handleRestartQuiz = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתחיל חידון חדש? ההתקדמות הנוכחית תימחק.')) {
      setCompleted(false);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setSelectedAnswerQuestionId(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
      setScore({ correct: 0, total: 0 });
      // Pass true to reset used words and use all available words for variety
      await generateQuestions(true, true);
    }
  };

  if (completed || showCelebration) {
    const totalQuestions = questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score.correct / totalQuestions) * 100) : 0;
    
    // Emoji based on performance - appropriate for all score ranges
    const emoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '💪' : percentage >= 30 ? '📚' : '🌱';
    
    // Simple message format like letters quiz, but with appropriate tone for low scores
    const title = percentage >= 50 ? 'חידון הושלם!' : 'לא נורא, המשך לתרגל';
    // Remove exclamation marks for low scores
    const message = percentage >= 50 
      ? `${score.correct} מתוך ${totalQuestions} נכונים! קיבלת ${xpGained} נקודות נסיון!`
      : `${score.correct} מתוך ${totalQuestions} נכונים. קיבלת ${xpGained} נקודות נסיון.`;

    return (
      <>
        <Confetti trigger={showCelebration && percentage >= 80} />
        <CelebrationScreen
          title={title}
          message={message}
          emoji={emoji}
          showConfetti={showCelebration && percentage >= 80}
          actionLabel="חזור למסך הראשי"
          onAction={() => {
            setShowCelebration(false);
            setCompleted(true);
            // Force reload of path page to update completion status
            router.push('/learn/path');
            setTimeout(() => router.refresh(), 100);
          }}
          secondaryActionLabel={nextCategory ? `המשך לקטגוריה הבאה: ${nextCategory}` : undefined}
          onSecondaryAction={nextCategory ? async () => {
            setShowCelebration(false);
            setCompleted(true);
            // Revalidate path via server action
            await revalidateLearnPath();
            // Navigate to next category quiz
            // Use levelState level if available, otherwise use level from URL
            const levelToUse = propLevelState?.level || level || 1;
            const nextCategoryUrl = `/learn?mode=quiz&category=${encodeURIComponent(nextCategory)}&level=${levelToUse}`;
            // Use window.location for full navigation to ensure proper data loading
            window.location.href = nextCategoryUrl;
          } : undefined}
          onClose={async () => {
            setShowCelebration(false);
            setCompleted(true);
            // Force reload of path page to update completion status
            router.push('/learn/path');
            setTimeout(() => router.refresh(), 100);
          }}
        />
      </>
    );
  }

  // Show loading state if we're loading or if question doesn't exist
  if (loading || !questions[currentIndex]) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto mb-4"></div>
        <p className="text-xl text-white font-black">טוען שאלה...</p>
        {todayPlan?.words?.length > 0 && questions.length === 0 && (
          <button
            onClick={() => generateQuestions()}
            className="mt-4 bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
          >
            נסה שוב
          </button>
        )}
      </div>
    );
  }

  const question = questions[currentIndex];

  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Only show result state if this is the current question and we have a result
  // Make sure we check if question exists and IDs match
  const isCurrentQuestionResult = showResult &&
    selectedAnswerQuestionId !== null &&
    selectedAnswerQuestionId === question.word.id;

  const handleModeSwitch = (newMode: 'learn' | 'quiz') => {
    if (isSwitching || isPending || currentMode === newMode) return; // Prevent multiple clicks or switching to same mode
    setIsSwitching(true);

    // Use callback if provided (client-side mode switch), otherwise use URL navigation
    if (onModeSwitch) {
      onModeSwitch(newMode);
      setTimeout(() => setIsSwitching(false), 100);
    } else {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (level) params.set('level', level.toString());
      params.set('mode', newMode);
      startTransition(() => {
        router.replace(`/learn?${params.toString()}`, { scroll: false });
        setTimeout(() => setIsSwitching(false), 500);
      });
    }
  };

  return (
    <>
      <Confetti trigger={showConfetti} duration={1000} />
      <div className="px-2 py-0.5 sm:p-4 md:p-8 animate-fade-in flex flex-col w-full max-w-sm sm:max-w-2xl md:max-w-4xl mx-auto min-h-0 relative overflow-hidden">
        {/* Pulsing Neon Blobs */}
        <div className="absolute top-40 -right-20 w-80 h-80 bg-accent-500/20 rounded-full blur-[100px] animate-blob mix-blend-screen" />
        <div className="absolute bottom-40 -left-20 w-[30rem] h-[30rem] bg-primary-500/20 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen" />

        {/* Progress Header */}
        <div className="glass-premium w-full rounded-full h-3 sm:h-4 md:h-6 overflow-hidden shadow-2xl p-0.5 sm:p-1 md:p-1.5 border-white/30 mb-2 sm:mb-3 md:mb-4 lg:mb-8">
          <div
            className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question Card (3D Tilt) */}
        <div
          className="relative perspective-2000 group mb-2 sm:mb-3 md:mb-4 lg:mb-6 xl:mb-10 z-10"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="glass-premium rounded-lg sm:rounded-xl md:rounded-[2rem] lg:rounded-[3rem] p-6 sm:p-4 md:p-6 lg:p-10 xl:p-16 border-white/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col justify-between relative overflow-visible transition-all duration-500 z-10">
            {!isCurrentQuestionResult && (
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6">
                <button
                  onClick={handleSkip}
                  className="text-neutral-300 hover:text-primary-500 transition-colors p-1.5 sm:p-2"
                  title="דלג"
                >
                  <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            )}

            <div className="flex-1">
              <div className="text-center mb-2 sm:mb-3 md:mb-4 lg:mb-6">
                {question.questionType === 'EN_TO_HE' && (
                  <>
                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-white tracking-tight leading-tight">{question.word.englishWord}</h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-bold tracking-tight">מה התרגום?</p>
                  </>
                )}
                {question.questionType === 'HE_TO_EN' && (
                  <>
                    <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-black mb-1 sm:mb-2 text-white tracking-tight leading-tight">{question.word.hebrewTranslation}</h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-bold tracking-tight">מה המילה?</p>
                  </>
                )}
                {question.questionType === 'AUDIO_TO_EN' && (
                  <>
                    <div className="flex justify-center mb-1 sm:mb-1.5 md:mb-2">
                      <button
                        onClick={() => speakWord(question.word.englishWord)}
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all group"
                      >
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:animate-pulse" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-bold tracking-tight">מה המילה ששמעת?</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-2 md:gap-3 lg:gap-4">
                {question.answers.map((answer: string, idx: number) => {
                  const currentQuestionId = question.word.id;
                  const hasSelectedAnswer = selectedAnswer !== null && selectedAnswerQuestionId === currentQuestionId;
                  let buttonClass = 'w-full py-5 sm:py-2.5 md:py-3 lg:py-4 xl:py-5 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-black border-2 transition-all duration-300 shadow-sm active:scale-95 ';

                  if (isCurrentQuestionResult) {
                    if (isCorrect) {
                      if (answer === question.correctAnswer) {
                        buttonClass += 'bg-success-500 text-white border-success-600 shadow-[0_4px_0_0_#059669] scale-[1.02] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent';
                      } else {
                        buttonClass += 'bg-white text-neutral-300 border-neutral-100 opacity-40 shadow-none';
                      }
                    } else {
                      if (answer === selectedAnswer) {
                        buttonClass += 'bg-danger-500 text-white border-danger-600 shadow-[0_4px_0_0_#e11d48]';
                      } else if (answer === question.correctAnswer && retryUsed) {
                        buttonClass += 'bg-success-500 text-white border-success-600 shadow-[0_4px_0_0_#059669] relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent';
                      } else {
                        buttonClass += 'bg-white text-neutral-300 border-neutral-100 opacity-40 shadow-none';
                      }
                    }
                  } else {
                    const isSelected = selectedAnswer === answer && selectedAnswerQuestionId === currentQuestionId;
                    buttonClass += isSelected
                      ? 'bg-primary-100 text-primary-600 border-primary-500 shadow-[0_4px_0_0_#c7d2fe]'
                      : 'bg-white text-neutral-800 border-neutral-100 hover:border-primary-200 hover:bg-neutral-50';
                  }

                  return (
                    <button
                      key={`q${currentIndex}-w${question.word.id}-a${idx}`}
                      onClick={() => handleAnswerSelect(answer)}
                      className={buttonClass}
                      disabled={isCurrentQuestionResult || hasSelectedAnswer}
                    >
                      {answer}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Section inside Card - Compact on mobile */}
            {isCurrentQuestionResult && (
              <div className="mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 xl:mt-6 animate-slide-up">
                {isCorrect ? (
                  <div className="p-1.5 sm:p-2 md:p-3 lg:p-4 glass-card border-success-500/50 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center gap-1 sm:gap-2 md:gap-4 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                    <div className="bg-success-500 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white shadow-lg"><CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" /></div>
                    <p className="text-success-400 text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-black tracking-tight text-shimmer">נכון מאוד! ✨🏆</p>
                  </div>
                ) : !retryUsed ? (
                  <div className="p-2 sm:p-2.5 md:p-3 lg:p-4 xl:p-6 glass-card border-accent-500/50 rounded-lg sm:rounded-xl md:rounded-2xl text-center shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                    <button onClick={handleRetry} className="w-full bg-gradient-to-r from-accent-400 to-accent-600 text-white py-1.5 sm:py-2 md:py-2.5 lg:py-3 rounded-md sm:rounded-lg md:rounded-xl text-xs sm:text-sm md:text-base lg:text-lg font-black shadow-lg hover:scale-105 active:scale-95 transition-all">נסה שוב</button>
                  </div>
                ) : (
                  <div className="p-1.5 sm:p-2 md:p-3 lg:p-4 glass-card border-danger-500/50 rounded-lg sm:rounded-xl md:rounded-2xl text-center flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-4 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                    <div className="bg-danger-500 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-white shadow-lg"><XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" /></div>
                    <p className="text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-black tracking-tight">התשובה הנכונה היא: <span className="text-shimmer">{question.correctAnswer}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {isCurrentQuestionResult && (
          <div className="w-full mt-1.5 sm:mt-2 md:mt-3 lg:mt-4 pb-4 sm:pb-6 md:pb-8 lg:pb-12 relative z-10">
            <button
              ref={continueButtonRef}
              onClick={handleNext}
              className={`w-full py-2.5 sm:py-3 md:py-4 lg:py-5 xl:py-6 rounded-lg sm:rounded-xl md:rounded-[2rem] text-xs sm:text-sm md:text-base lg:text-xl xl:text-2xl font-black transition-all duration-300 relative z-10 ${isCorrect
                ? 'bg-gradient-to-r from-success-400 to-emerald-600 text-white shadow-[0_20px_50px_-10px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-primary-500 to-primary-700 text-white shadow-[0_20px_50px_-10px_rgba(14,165,233,0.5)]'
                } hover:scale-[1.02] active:scale-95`}
              style={{ pointerEvents: 'auto' }}
            >
              {currentIndex < questions.length - 1 ? 'המילה הבאה ✨' : (() => {
                // Calculate percentage based on questions answered so far (currentIndex + 1)
                const totalAnswered = currentIndex + 1;
                const percentage = totalAnswered > 0 ? Math.round((score.correct / totalAnswered) * 100) : 0;
                if (percentage >= 70) return 'סיים בהצטיינות! 🏆';
                if (percentage >= 50) return 'סיים בהצלחה! ✨';
                return 'סיים! 💪';
              })()}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
