'use client';

import { useState, useEffect } from 'react';
import { recordQuizAttempt } from '@/app/actions/progress';
import { getAllWords } from '@/app/actions/words';
import { getSettings } from '@/app/actions/settings';
import { updateMissionProgress } from '@/app/actions/missions';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';

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
  const [useAllWords, setUseAllWords] = useState(false); // Track if we should use all words
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
      
      // Generate wrong answers with consistent selection
      const availableWords = allWords.filter((w) => w.id !== word.id);
      // Sort by a hash based on word id and seed to get consistent order
      const sortedWords = [...availableWords].sort((a, b) => {
        const hashA = (a.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + seed) % 1000;
        const hashB = (b.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) + seed) % 1000;
        return hashA - hashB;
      });
      
      const wrongAnswers = sortedWords
        .slice(0, 3)
        .map((w) => questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord);

      const correctAnswer = questionType === 'EN_TO_HE' ? word.hebrewTranslation : word.englishWord;
      
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

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
    } else {
      setCompleted(true);
      await updateMissionProgress(childId, 'DAILY', 'complete_quiz', 1, 1);
      await addXP(childId, score.correct * 10);
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

  if (completed) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2">סיימת את החידון!</h2>
        <p className="text-xl text-gray-600 mb-2">
          {score.correct} מתוך {score.total} נכונים
        </p>
        <p className="text-2xl font-bold text-blue-600 mb-6">{percentage}%</p>
        <div className="space-y-3">
          <button
            onClick={handleNewQuiz}
            className="w-full bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium"
          >
            חידון חדש עם מילים אחרות 🎯
          </button>
          <button
            onClick={() => router.push('/progress')}
            className="w-full bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium"
          >
            צפה בהתקדמות
          </button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex justify-between text-sm text-gray-600 flex-1">
            <span>{currentIndex + 1} מתוך {questions.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <button
            onClick={handleRestartQuiz}
            className="ml-4 text-sm text-gray-600 hover:text-gray-800 underline"
            title="התחל חידון חדש"
          >
            🔄 החלף חידון
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="text-center mb-6">
          {question.questionType === 'EN_TO_HE' && (
            <>
              <h2 className="text-4xl font-bold mb-4 text-blue-600">{question.word.englishWord}</h2>
              <p className="text-lg text-gray-600">מה התרגום בעברית?</p>
            </>
          )}
          {question.questionType === 'HE_TO_EN' && (
            <>
              <h2 className="text-4xl font-bold mb-4 text-blue-600">{question.word.hebrewTranslation}</h2>
              <p className="text-lg text-gray-600">מה המילה באנגלית?</p>
            </>
          )}
          {question.questionType === 'AUDIO_TO_EN' && (
            <>
              <button
                onClick={() => speakWord(question.word.englishWord)}
                className="text-6xl mb-4 hover:scale-110 transition-transform"
              >
                🔊
              </button>
              <p className="text-lg text-gray-600">מה המילה ששמעת?</p>
            </>
          )}
        </div>

        <div className="space-y-3">
          {question.answers.map((answer: string, idx: number) => {
            let buttonClass = 'w-full py-4 rounded-lg text-lg font-medium border-2 ';
            
            if (showResult) {
              if (answer === question.correctAnswer) {
                buttonClass += 'bg-green-500 text-white border-green-600';
              } else if (answer === selectedAnswer && !isCorrect) {
                buttonClass += 'bg-red-500 text-white border-red-600';
              } else {
                buttonClass += 'bg-gray-100 text-gray-600 border-gray-300';
              }
            } else {
              buttonClass += selectedAnswer === answer
                ? 'bg-blue-100 text-blue-800 border-blue-400'
                : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50';
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
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-center text-yellow-800 mb-2">לא נכון, נסה שוב!</p>
            <div className="flex justify-center">
              <button
                onClick={handleRetry}
                className="bg-yellow-500 text-white px-6 py-2 rounded-lg"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {showResult && isCorrect && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-center text-green-800 text-xl font-bold">נכון! כל הכבוד! 🎉</p>
            {/* Auto-advancing to next question... */}
          </div>
        )}

        {showResult && !isCorrect && retryUsed && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-center text-red-800">
              התשובה הנכונה: <strong>{question.correctAnswer}</strong>
            </p>
          </div>
        )}
      </div>

      {showResult && (
        <button
          onClick={handleNext}
          className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-medium"
        >
          {currentIndex < questions.length - 1 ? 'הבא' : 'סיים חידון'}
        </button>
      )}
    </div>
  );
}
