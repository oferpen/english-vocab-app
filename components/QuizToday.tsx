'use client';

import { useState, useEffect } from 'react';
import { recordQuizAttempt } from '@/app/actions/progress';
import { getAllWords } from '@/app/actions/words';
import { getSettings } from '@/app/actions/settings';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';

interface QuizTodayProps {
  childId: string;
  todayPlan: any;
}

export default function QuizToday({ childId, todayPlan }: QuizTodayProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [retryUsed, setRetryUsed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [usedWordIds, setUsedWordIds] = useState<Set<string>>(new Set());
  const [useAllWords, setUseAllWords] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const router = useRouter();

  const words = todayPlan?.words?.map((w: any) => w.word) || [];

  useEffect(() => {
    generateQuestions();
  }, [todayPlan]);

  const generateQuestions = async (resetUsedWords: boolean = false, useAllAvailableWords: boolean = false) => {
    const settings = await getSettings();
    const allWords = await getAllWords();
    const questionList: any[] = [];

    // Determine which word pool to use
    // If restarting and we want variety, use all words instead of just today's plan
    const wordPool = (useAllAvailableWords && allWords.length > 0) ? allWords : words;
    
    if (wordPool.length === 0) return;

    // Use fresh word IDs if resetting, otherwise use current state
    const currentUsedWordIds = resetUsedWords ? new Set<string>() : usedWordIds;

    // Get words that haven't been used yet, or all words if we've used them all
    const availableWords = wordPool.filter((w: any) => !currentUsedWordIds.has(w.id));
    const wordsToUse = availableWords.length > 0 ? availableWords : wordPool;
    
    // Shuffle to get different words each time
    const shuffledWords = [...wordsToUse].sort(() => Math.random() - 0.5);
    const wordsForQuiz = shuffledWords.slice(0, Math.min(wordPool.length, settings.quizLength || 10));

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
      // Filter out words that have the same translation as the correct answer
      const availableWords = allWords.filter((w) => {
        if (w.id === word.id) return false;
        const wAnswer = questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord;
        return wAnswer !== correctAnswer; // Exclude words with same translation
      });
      
      // Sort by a hash based on word id and seed to get consistent order
      const sortedWords = [...availableWords].sort((a, b) => {
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
      
      // If we don't have enough unique wrong answers, pad with placeholder
      while (wrongAnswers.length < 3 && availableWords.length > wrongAnswers.length) {
        // Try to find more unique answers
        for (const w of sortedWords) {
          const wAnswer = questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord;
          if (wAnswer !== correctAnswer && !wrongAnswers.includes(wAnswer)) {
            wrongAnswers.push(wAnswer);
            if (wrongAnswers.length >= 3) break;
          }
        }
        if (wrongAnswers.length < 3) break; // Avoid infinite loop
      }
      
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
  };

  const handleAnswerSelect = async (answer: string) => {
    if (showResult) return;

    const question = questions[currentIndex];
    const correct = answer === question.correctAnswer;
    setSelectedAnswer(answer);
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
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
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
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
    } else {
      const xp = (score.correct + (correct ? 1 : 0)) * 10;
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

  if (questions.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">טוען חידון...</p>
      </div>
    );
  }

  const handleNewQuiz = async () => {
    setCompleted(false);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
    setRetryUsed(false);
    setScore({ correct: 0, total: 0 });
    setUseAllWords(true); // Use all words for variety
    // Use all words for new quiz to get variety
    await generateQuestions(true, true);
  };

  const handleRestartQuiz = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתחיל חידון חדש? ההתקדמות הנוכחית תימחק.')) {
      setCompleted(false);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
      setScore({ correct: 0, total: 0 });
      setUseAllWords(true); // Use all words for variety
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
          actionLabel="חידון חדש עם מילים אחרות 🎯"
          onAction={() => {
            setShowCelebration(false);
            setCompleted(true);
            handleNewQuiz();
          }}
          onClose={() => {
            setShowCelebration(false);
            setCompleted(true);
          }}
        />
      </>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <>
      <Confetti trigger={showConfetti} duration={1000} />
      <div className="p-4 md:p-6 bg-gray-50 min-h-[calc(100vh-200px)] animate-fade-in">
        {/* Progress Bar */}
      <div className="mb-6 bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-semibold text-gray-700">
            {currentIndex + 1} מתוך {questions.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-base font-bold text-primary-600">{Math.round(progress)}%</span>
            <button
              onClick={handleRestartQuiz}
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
              title="התחל חידון חדש"
            >
              🔄
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-100 animate-slide-up">
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
            
            if (showResult) {
              if (answer === question.correctAnswer) {
                buttonClass += 'bg-success-500 text-white border-success-600 shadow-lg scale-105';
              } else if (answer === selectedAnswer && !isCorrect) {
                buttonClass += 'bg-red-500 text-white border-red-600 shadow-md';
              } else {
                buttonClass += 'bg-gray-100 text-gray-500 border-gray-300';
              }
            } else {
              buttonClass += selectedAnswer === answer
                ? 'bg-primary-100 text-primary-800 border-primary-400 shadow-md'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-primary-300 hover:shadow-sm';
            }

            return (
              <button
                key={`${question.word.id}-answer-${idx}`}
                onClick={() => handleAnswerSelect(answer)}
                className={buttonClass}
                disabled={showResult}
              >
                {answer}
              </button>
            );
          })}
        </div>

        {showResult && !isCorrect && !retryUsed && (
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

        {showResult && isCorrect && (
          <div className="mt-6 p-5 bg-success-50 border-2 border-success-300 rounded-xl shadow-sm animate-slide-up">
            <p className="text-center text-success-800 text-2xl font-bold">נכון! כל הכבוד! 🎉</p>
          </div>
        )}

        {showResult && !isCorrect && retryUsed && (
          <div className="mt-6 p-5 bg-red-50 border-2 border-red-300 rounded-xl shadow-sm animate-slide-up">
            <p className="text-center text-red-800 text-lg">
              התשובה הנכונה: <strong className="text-xl">{question.correctAnswer}</strong>
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        {!showResult && (
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-4 md:py-5 rounded-xl text-base md:text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            דלג ⏭️
          </button>
        )}
        {showResult && (
          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-5 md:py-6 rounded-xl text-lg md:text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {currentIndex < questions.length - 1 ? 'המשך →' : 'סיים חידון ✓'}
          </button>
        )}
      </div>
      </div>
    </>
  );
}
