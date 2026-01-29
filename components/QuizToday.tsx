'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { recordQuizAttempt } from '@/app/actions/progress';
import { getAllWords, getWordsByCategory, getAllCategories } from '@/app/actions/words';
import { getSettings } from '@/app/actions/settings';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';
import { Volume2, SkipBack, CheckCircle2, XCircle, ChevronLeft, Sparkles } from 'lucide-react';

interface QuizTodayProps {
  childId: string;
  todayPlan: any;
  category?: string;
  levelState?: any; // Pass levelState to avoid fetching it again
  categoryWords?: any[]; // Pass categoryWords to avoid fetching them again
  onModeSwitch?: (mode: 'learn' | 'quiz') => void;
}

export default function QuizToday({ childId, todayPlan, category, levelState: propLevelState, categoryWords: propCategoryWords, onModeSwitch }: QuizTodayProps) {
  const searchParams = useSearchParams();
  const level = searchParams?.get('level');
  const currentMode = searchParams?.get('mode') || 'quiz';
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
        generateQuestions();
      } else {
        // If plan changed but we have questions, just reset the index (don't regenerate)
        setCurrentIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayPlan?.id]); // Only depend on todayPlan.id

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

  // Find next category when category changes
  useEffect(() => {
    const findNextCategory = async () => {
      if (!category) {
        setNextCategory(null);
        return;
      }

      try {
        // Use propLevelState if available, otherwise fetch it
        let currentLevelState = propLevelState;
        if (!currentLevelState) {
          const { getLevelState } = await import('@/app/actions/levels');
          currentLevelState = await getLevelState(childId);
        }

        // Get all words filtered by level to find categories with words at this level
        const levelWords = await getAllWords(currentLevelState.level);

        // Extract unique categories from words at this level, excluding Starter
        const categoriesSet = new Set<string>();
        levelWords.forEach((word: any) => {
          if (word.category && !word.category.startsWith('Starter')) {
            categoriesSet.add(word.category);
          }
        });

        // Sort categories alphabetically
        const sortedCategories = Array.from(categoriesSet).sort((a, b) => a.localeCompare(b));
        const currentIndex = sortedCategories.indexOf(category);

        if (currentIndex >= 0 && currentIndex < sortedCategories.length - 1) {
          setNextCategory(sortedCategories[currentIndex + 1]);
        } else {
          setNextCategory(null); // No next category
        }
      } catch (error) {
        console.error('Error finding next category:', error);
        setNextCategory(null);
      }
    };

    findNextCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, childId, propLevelState]);

  const generateQuestions = async (resetUsedWords: boolean = false, useAllAvailableWords: boolean = false) => {
    // Prevent multiple simultaneous calls
    if (isGeneratingRef.current) return;

    try {
      isGeneratingRef.current = true;
      setLoading(true);
      setError(null);
      const settings = await getSettings();

      // Use propLevelState if available, otherwise fetch it
      let levelState = propLevelState;
      if (!levelState) {
        const { getLevelState } = await import('@/app/actions/levels');
        levelState = await getLevelState(childId);
      }

      // Use propCategoryWords if available, otherwise fetch them
      let filteredWords: any[];
      if (propCategoryWords && propCategoryWords.length > 0) {
        filteredWords = propCategoryWords;
      } else if (category) {
        filteredWords = await getWordsByCategory(category);
      } else {
        // Fallback: use words from todayPlan if category is not provided (shouldn't happen)
        filteredWords = words;
      }

      // Always fetch allWords to generate wrong answers, even if not using them for quiz questions
      let allWords: any[] = [];
      if (useAllAvailableWords) {
        allWords = await getAllWords(levelState.level);
      } else {
        // Still need allWords to generate wrong answers, so fetch them
        allWords = await getAllWords(levelState.level);
      }

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

      setQuestions(questionList);
      // Reset currentIndex when generating new questions (but only if resetting)
      if (resetUsedWords) {
        setCurrentIndex(0);
      }
      setLoading(false);
      isGeneratingRef.current = false;
    } catch (err: any) {
      console.error('Error generating questions:', err);
      setError('שגיאה בטעינת החידון. נסה שוב.');
      setLoading(false);
      isGeneratingRef.current = false;
      setQuestions([]);
    }
  };

  const handleAnswerSelect = (answer: string) => {
    // Only allow selection if there's no result for the current question
    const currentQuestionId = questions[currentIndex]?.word.id;
    if (showResult && selectedAnswerQuestionId === currentQuestionId) return;

    setSelectedAnswer(answer);
    setSelectedAnswerQuestionId(currentQuestionId);
  };

  const handleCheck = async () => {
    if (!selectedAnswer || showResult) return;

    const question = questions[currentIndex];
    const correct = selectedAnswer === question.correctAnswer;
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
      // Allow retry
      return;
    }

    // Record attempt
    const attemptPromise = recordQuizAttempt(
      childId,
      question.word.id,
      question.questionType as any,
      correct,
      false
    );
    setPendingQuizAttempts(prev => [...prev, attemptPromise]);
    attemptPromise.catch(err => console.error('Error recording quiz attempt:', err));
  };

  const handleSkip = async () => {
    if (showResult) return;

    // Play failure sound for skip
    playFailureSound();

    const question = questions[currentIndex];
    // Record skip as incorrect attempt
    await recordQuizAttempt(
      childId,
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
          console.error('Error waiting for quiz attempts:', error);
        }
      }

      const xp = score.correct * 10;
      setXpGained(xp);
      setShowCelebration(true);
      await updateMissionProgress(childId, 'DAILY', 'complete_quiz', 1, 1);
      await addXP(childId, xp);

      // Revalidate path to refresh category completion status
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/learn/path');
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
      await updateMissionProgress(childId, 'DAILY', 'complete_quiz', 1, 1);
      await addXP(childId, xp);
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
        <p className="text-xl text-gray-600 mb-4">אין מילים לחידון היום</p>
        <p className="text-gray-500">בקש מהורה להגדיר תוכנית יומית</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-xl text-gray-600">טוען חידון...</p>
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
        <p className="text-xl text-gray-600 mb-4">אין מילים זמינות לחידון</p>
        <p className="text-gray-500 mb-4">נסה ללמוד עוד מילים תחילה</p>
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
    const percentage = Math.round((score.correct / score.total) * 100);
    const emoji = percentage >= 80 ? '🎉' : percentage >= 60 ? '👍' : '💪';

    return (
      <>
        <Confetti trigger={showCelebration && percentage >= 80} />
        <CelebrationScreen
          title="סיימת את החידון!"
          message={`${score.correct} מתוך ${score.total} נכונים (${percentage}%)! קיבלת ${xpGained} נקודות נסיון!`}
          emoji={emoji}
          showConfetti={showCelebration && percentage >= 80}
          actionLabel="חזור לנתיב הלמידה"
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
            // Revalidate path to ensure category completion is updated
            const { revalidatePath } = await import('next/cache');
            revalidatePath('/learn/path');
            // Navigate to next category quiz
            const nextCategoryUrl = `/learn?mode=quiz&category=${encodeURIComponent(nextCategory)}${level ? `&level=${level}` : ''}`;
            router.push(nextCategoryUrl);
            setTimeout(() => router.refresh(), 100);
          } : undefined}
          onClose={async () => {
            setShowCelebration(false);
            setCompleted(true);
            // Revalidate path to ensure category completion is updated
            const { revalidatePath } = await import('next/cache');
            revalidatePath('/learn/path');
            // Force reload of path page to update completion status
            router.push('/learn/path');
            setTimeout(() => router.refresh(), 100);
          }}
        />
      </>
    );
  }

  const question = questions[currentIndex];
  if (!question) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl text-gray-600">טוען שאלה...</p>
      </div>
    );
  }

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
      <div className="p-4 md:p-8 bg-neutral-50 min-h-screen animate-fade-in flex flex-col max-w-2xl mx-auto">
        {/* Progress Bar Header */}
        {!completed && !showCelebration && (
          <div className="mb-8 w-full">
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={handleRestartQuiz}
                className="text-sm font-bold text-neutral-400 hover:text-primary-600 transition-colors uppercase tracking-wide"
                type="button"
              >
                התחל מחדש
              </button>
              <span className="text-sm font-black text-neutral-500">
                {currentIndex + 1} מתוך {questions.length}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-5 overflow-hidden shadow-inner p-1">
              <div
                className="bg-primary-500 h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-8 md:p-12 mb-8 border border-neutral-100 animate-slide-up flex-1 flex flex-col justify-between relative overflow-hidden">
          {!isCurrentQuestionResult && (
            <div className="absolute top-6 right-6">
              <button
                onClick={handleSkip}
                className="text-neutral-300 hover:text-primary-500 transition-colors p-2"
                title="דלג"
              >
                <SkipBack className="w-6 h-6" />
              </button>
            </div>
          )}

          <div className="flex-1">
            <div className="text-center mb-10">
              {question.questionType === 'EN_TO_HE' && (
                <>
                  <h2 className="text-6xl md:text-7xl font-black mb-4 text-primary-600 tracking-tight leading-tight">{question.word.englishWord}</h2>
                  <p className="text-xl md:text-2xl text-neutral-800 font-bold tracking-tight">מה התרגום בעברית?</p>
                </>
              )}
              {question.questionType === 'HE_TO_EN' && (
                <>
                  <h2 className="text-6xl md:text-7xl font-black mb-4 text-primary-600 tracking-tight leading-tight">{question.word.hebrewTranslation}</h2>
                  <p className="text-xl md:text-2xl text-neutral-800 font-bold tracking-tight">מה המילה באנגלית?</p>
                </>
              )}
              {question.questionType === 'AUDIO_TO_EN' && (
                <>
                  <div className="flex justify-center mb-6">
                    <button
                      onClick={() => speakWord(question.word.englishWord)}
                      className="w-24 h-24 rounded-[2rem] bg-primary-100 text-primary-600 flex items-center justify-center shadow-[0_8px_0_0_#e0e7ff] hover:translate-y-1 hover:shadow-[0_4px_0_0_#e0e7ff] transition-all duration-200 active:translate-y-2 active:shadow-none"
                    >
                      <Volume2 className="w-12 h-12" />
                    </button>
                  </div>
                  <p className="text-xl md:text-2xl text-neutral-800 font-bold tracking-tight">מה המילה ששמעת?</p>
                </>
              )}
            </div>

            <div className="space-y-4">
              {question.answers.map((answer: string, idx: number) => {
                let buttonClass = 'w-full py-5 rounded-2xl text-xl font-bold border-2 transition-all duration-200 shadow-[0_4px_0_0_rgba(0,0,0,0.05)] active:translate-y-1 active:shadow-none ';

                if (isCurrentQuestionResult) {
                  if (isCorrect) {
                    if (answer === question.correctAnswer) {
                      buttonClass += 'bg-success-500 text-white border-success-600 shadow-[0_4px_0_0_#059669] scale-[1.02]';
                    } else {
                      buttonClass += 'bg-white text-neutral-300 border-neutral-100 opacity-40 shadow-none';
                    }
                  } else {
                    if (answer === selectedAnswer) {
                      buttonClass += 'bg-danger-500 text-white border-danger-600 shadow-[0_4px_0_0_#e11d48]';
                    } else if (answer === question.correctAnswer && retryUsed) {
                      buttonClass += 'bg-success-500 text-white border-success-600 shadow-[0_4px_0_0_#059669]';
                    } else {
                      buttonClass += 'bg-white text-neutral-300 border-neutral-100 opacity-40 shadow-none';
                    }
                  }
                } else {
                  const isSelected = selectedAnswer === answer &&
                    selectedAnswerQuestionId === question.word.id;
                  buttonClass += isSelected
                    ? 'bg-primary-100 text-primary-600 border-primary-500 shadow-[0_4px_0_0_#c7d2fe]'
                    : 'bg-white text-neutral-600 border-neutral-100 hover:border-primary-200 hover:bg-neutral-50';
                }

                return (
                  <button
                    key={`q${currentIndex}-w${question.word.id}-a${idx}`}
                    onClick={() => handleAnswerSelect(answer)}
                    className={buttonClass}
                    disabled={isCurrentQuestionResult}
                  >
                    {answer}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Section inside Card */}
          {isCurrentQuestionResult && (
            <div className="mt-8 animate-slide-up">
              {isCorrect ? (
                <div className="p-5 bg-success-50 border-2 border-success-200 rounded-3xl flex items-center justify-center gap-3">
                  <div className="bg-success-500 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <p className="text-success-700 text-xl font-black tracking-tight">נכון! כל הכבוד! 🎉</p>
                </div>
              ) : !retryUsed ? (
                <div className="p-5 bg-accent-50 border-2 border-accent-200 rounded-3xl text-center space-y-4">
                  <p className="text-accent-800 text-xl font-black tracking-tight flex items-center justify-center gap-2">
                    לא נורא, נסה שוב
                  </p>
                  <button
                    onClick={handleRetry}
                    className="w-full bg-accent-500 hover:bg-accent-600 text-white py-4 rounded-2xl font-black transition-all shadow-[0_4px_0_0_#d97706] active:translate-y-1 active:shadow-none"
                  >
                    נסה שוב
                  </button>
                </div>
              ) : (
                <div className="p-5 bg-danger-50 border-2 border-danger-200 rounded-3xl text-center flex items-center justify-center gap-3">
                  <div className="bg-danger-500 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm">
                    <XCircle className="w-5 h-5" />
                  </div>
                  <p className="text-danger-800 text-xl font-black tracking-tight">
                    התשובה: {question.correctAnswer}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Global Action Button Anchor */}
        <div className="w-full mt-auto pb-8">
          {!isCurrentQuestionResult ? (
            <button
              onClick={handleCheck}
              disabled={!selectedAnswer}
              className={`
                w-full py-5 rounded-2xl text-2xl font-black transition-all duration-200 tracking-tight
                ${selectedAnswer
                  ? 'bg-primary-500 text-white shadow-[0_8px_0_0_#4f46e5] hover:translate-y-1 hover:shadow-[0_4px_0_0_#4f46e5] active:translate-y-2 active:shadow-none'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                }
              `}
            >
              בדיקה
            </button>
          ) : (
            <button
              ref={continueButtonRef}
              onClick={handleNext}
              className={`
                w-full py-5 rounded-2xl text-2xl font-black transition-all duration-200 tracking-tight
                ${isCorrect
                  ? 'bg-success-500 text-white shadow-[0_8px_0_0_#059669] hover:translate-y-1 hover:shadow-[0_4px_0_0_#059669]'
                  : 'bg-primary-500 text-white shadow-[0_8px_0_0_#4f46e5] hover:translate-y-1 hover:shadow-[0_4px_0_0_#4f46e5]'
                }
                active:translate-y-2 active:shadow-none
              `}
            >
              {currentIndex < questions.length - 1 ? 'המשך' : 'סיים חידון ✓'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
