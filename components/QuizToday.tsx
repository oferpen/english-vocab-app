'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { recordQuizAttempt } from '@/app/actions/progress';
import { getAllWords, getWordsByCategory } from '@/app/actions/words';
import { getSettings } from '@/app/actions/settings';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null); // Track plan ID to detect changes
  const [isSwitching, setIsSwitching] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isGeneratingRef = useRef(false); // Track if we're currently generating questions
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
      // Use allWords (which we always fetch) to generate wrong answers
      // Filter out words that have the same translation as the correct answer
      const wrongAnswerPool = allWords.length > 0 ? allWords : filteredWords; // Fallback to filteredWords if allWords is empty
      const availableWordsForWrongAnswers = wrongAnswerPool.filter((w) => {
        if (w.id === word.id) return false;
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
          const wAnswer = questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord;
          if (wAnswer !== correctAnswer && !wrongAnswers.includes(wAnswer)) {
            wrongAnswers.push(wAnswer);
            if (wrongAnswers.length >= 3) break;
          }
        }
      }
      
      // If we still don't have enough wrong answers (shouldn't happen with proper data), 
      // we'll just use what we have (minimum 1 correct + wrong answers)
      
      // Shuffle answers with consistent order for the same word
      const allAnswers = [correctAnswer, ...wrongAnswers];
      const shuffledAnswers = [...allAnswers].sort((a, b) => {
        const hashA = a.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), seed);
        const hashB = b.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), seed);
        return hashA - hashB;
      });

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

  const handleAnswerSelect = async (answer: string) => {
    // Only allow selection if there's no result for the current question
    const currentQuestionId = questions[currentIndex]?.word.id;
    if (showResult && selectedAnswerQuestionId === currentQuestionId) return;
    
    // Prevent multiple calls by checking if we're already processing this question
    if (selectedAnswer && selectedAnswerQuestionId === currentQuestionId) return;

    const question = questions[currentIndex];
    const correct = answer === question.correctAnswer;
    setSelectedAnswer(answer);
    setSelectedAnswerQuestionId(question.word.id); // Store which question this answer belongs to
    setIsCorrect(correct);
    setShowResult(true);

    // Play sound based on result
    if (correct) {
      playSuccessSound();
      // Show confetti for correct answer
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    } else {
      playFailureSound();
    }

    if (!correct && !retryUsed) {
      // Allow retry
      return;
    }

    // Record attempt
    await recordQuizAttempt(
      childId,
      question.word.id,
      question.questionType as any,
      correct,
      false
    );

    if (correct) {
      setScore({ ...score, correct: score.correct + 1, total: score.total + 1 });
    } else {
      setScore({ ...score, total: score.total + 1 });
    }
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
      const xp = score.correct * 10;
      setXpGained(xp);
      setShowCelebration(true);
      await updateMissionProgress(childId, 'DAILY', 'complete_quiz', 1, 1);
      await addXP(childId, xp);
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
          חזור לנתיב הלמידה
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
          title={`סיימת את החידון! ${emoji}`}
          message={`${score.correct} מתוך ${score.total} נכונים (${percentage}%)! קיבלת ${xpGained} נקודות XP!`}
          emoji={emoji}
          showConfetti={showCelebration && percentage >= 80}
          actionLabel="חזור לנתיב הלמידה →"
          onAction={() => {
            setShowCelebration(false);
            setCompleted(true);
            // Force reload of path page to update completion status
            router.push('/learn/path');
            setTimeout(() => router.refresh(), 100);
          }}
          onClose={() => {
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
      <div className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-200px)] animate-fade-in">
        {/* Navigation Tabs */}
        <div className="mb-4 flex gap-2 bg-white rounded-xl p-2 shadow-md border border-gray-100">
          <button
            onClick={() => handleModeSwitch('learn')}
            disabled={isSwitching}
            className="flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-200 hover:bg-blue-50 text-gray-600 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-2xl mb-1">📖</span>
            <span className="text-sm font-semibold">למידה</span>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center py-3 px-4 rounded-lg border-2 border-primary-500 text-primary-600 font-bold">
            <span className="text-2xl mb-1">✏️</span>
            <span className="text-sm">חידון</span>
          </div>
        </div>

        {/* Progress Bar */}
      <div className="mb-4 bg-white rounded-lg p-3 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">
            {currentIndex + 1} מתוך {questions.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-100 animate-slide-up">
        {!isCurrentQuestionResult && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleSkip}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 hover:border-gray-400 p-2 md:p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              title="דלג"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ transform: 'scaleX(-1)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
        <div className="text-center mb-8">
          {question.questionType === 'EN_TO_HE' && (
            <>
              <h2 className="text-5xl md:text-6xl font-bold mb-4 text-primary-600 drop-shadow-sm">{question.word.englishWord}</h2>
              <p className="text-lg md:text-xl text-gray-600 font-medium">מה התרגום בעברית?</p>
            </>
          )}
          {question.questionType === 'HE_TO_EN' && (
            <>
              <h2 className="text-5xl md:text-6xl font-bold mb-4 text-primary-600 drop-shadow-sm">{question.word.hebrewTranslation}</h2>
              <p className="text-lg md:text-xl text-gray-600 font-medium">מה המילה באנגלית?</p>
            </>
          )}
          {question.questionType === 'AUDIO_TO_EN' && (
            <>
              <button
                onClick={() => speakWord(question.word.englishWord)}
                className="text-6xl md:text-7xl mb-4 hover:scale-110 active:scale-95 transition-all duration-200 hover:drop-shadow-lg"
              >
                🔊
              </button>
              <p className="text-lg md:text-xl text-gray-600 font-medium">מה המילה ששמעת?</p>
            </>
          )}
        </div>

        <div className="space-y-3 md:space-y-4">
          {question.answers.map((answer: string, idx: number) => {
            let buttonClass = 'w-full py-4 md:py-5 rounded-xl text-lg md:text-xl font-semibold border-2 transition-all duration-200 ';
            
            if (isCurrentQuestionResult) {
              if (answer === question.correctAnswer) {
                buttonClass += 'bg-success-500 text-white border-success-600 shadow-lg scale-105';
              } else if (answer === selectedAnswer && !isCorrect) {
                buttonClass += 'bg-red-500 text-white border-red-600 shadow-md';
              } else {
                buttonClass += 'bg-gray-100 text-gray-500 border-gray-300';
              }
            } else {
              // Only highlight if selectedAnswer matches AND it's for the current question
              // This prevents showing selected state from previous question
              const isSelected = selectedAnswer === answer && 
                                 selectedAnswerQuestionId === question.word.id && 
                                 !showResult;
              buttonClass += isSelected
                ? 'bg-primary-100 text-primary-800 border-primary-400 shadow-md'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-primary-300 hover:shadow-sm';
            }

            return (
              <button
                key={`q${currentIndex}-w${question.word.id}-a${idx}-${answer.substring(0, 10)}`}
                onClick={() => handleAnswerSelect(answer)}
                className={buttonClass}
                disabled={isCurrentQuestionResult}
              >
                {answer}
              </button>
            );
          })}
        </div>

        {isCurrentQuestionResult && !isCorrect && !retryUsed && (
          <div className="mt-6 p-5 bg-yellow-50 border-2 border-yellow-300 rounded-xl shadow-sm animate-slide-up">
            <p className="text-center text-yellow-800 mb-3 text-lg font-semibold">לא נכון, נסה שוב!</p>
            <div className="flex justify-center">
              <button
                onClick={handleRetry}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {isCurrentQuestionResult && isCorrect && (
          <div className="mt-6 p-5 bg-success-50 border-2 border-success-300 rounded-xl shadow-sm animate-slide-up">
            <p className="text-center text-success-800 text-2xl font-bold">נכון! כל הכבוד! 🎉</p>
          </div>
        )}

        {isCurrentQuestionResult && !isCorrect && retryUsed && (
          <div className="mt-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl shadow-sm animate-slide-up">
            <p className="text-center text-red-800 text-lg">
              התשובה הנכונה: <strong className="text-xl">{question.correctAnswer}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {isCurrentQuestionResult && (
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-5 md:py-6 rounded-xl text-xl md:text-2xl font-bold shadow-lg hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] animate-slide-up"
          >
            {currentIndex < questions.length - 1 ? 'המשך' : 'סיים חידון ✓'}
          </button>
        )}
      </div>
      </div>
    </>
  );
}
