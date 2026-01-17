'use client';

import { useState, useEffect } from 'react';
import { recordQuizAttempt } from '@/app/actions/progress';
import { getAllWords, getWordsByCategory } from '@/app/actions/words';
import { getWordsNeedingReview, getUnseenWords } from '@/app/actions/progress';
import { getTodayPlan } from '@/app/actions/plans';
import { getSettings } from '@/app/actions/settings';
import { useRouter } from 'next/navigation';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';

interface QuizExtraProps {
  childId: string;
}

export default function QuizExtra({ childId }: QuizExtraProps) {
  const [mode, setMode] = useState<'needsReview' | 'mixed' | 'category'>('needsReview');
  const [category, setCategory] = useState<string>('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [retryUsed, setRetryUsed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [usedWordIds, setUsedWordIds] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const words = await getAllWords();
    const uniqueCategories = Array.from(new Set(words.map((w) => w.category)));
    setCategories(uniqueCategories);
    if (uniqueCategories.length > 0) {
      setCategory(uniqueCategories[0]);
    }
  };

  const generateQuestions = async (resetUsedWords: boolean = false) => {
    setLoading(true);
    const settings = await getSettings();
    const allWords = await getAllWords();
    let wordList: any[] = [];

    if (mode === 'needsReview') {
      const progressList = await getWordsNeedingReview(childId);
      wordList = progressList.map((p) => p.word);
    } else if (mode === 'mixed') {
      const todayPlan = await getTodayPlan(childId);
      const todayWords = todayPlan?.words?.map((w: any) => w.word) || [];
      const needsReview = await getWordsNeedingReview(childId);
      const reviewWords = needsReview.map((p) => p.word);
      const unseen = await getUnseenWords(childId);
      wordList = [...todayWords, ...reviewWords, ...unseen].slice(0, 20);
    } else if (mode === 'category' && category) {
      wordList = await getWordsByCategory(category);
    }

    if (wordList.length === 0) {
      setLoading(false);
      return;
    }

    // Use fresh word IDs if resetting, otherwise use current state
    const currentUsedWordIds = resetUsedWords ? new Set<string>() : usedWordIds;

    // Get words that haven't been used yet, or all words if we've used them all
    const availableWords = wordList.filter((w: any) => !currentUsedWordIds.has(w.id));
    const wordsToUse = availableWords.length > 0 ? availableWords : wordList;
    
    // Shuffle to get different words each time
    const shuffledWords = [...wordsToUse].sort(() => Math.random() - 0.5);
    const wordsForQuiz = shuffledWords.slice(0, settings.quizLength || 10);

    // Update used word IDs
    const newUsedWordIds = resetUsedWords ? new Set<string>() : new Set(currentUsedWordIds);
    wordsForQuiz.forEach((w: any) => newUsedWordIds.add(w.id));
    setUsedWordIds(newUsedWordIds);

    const questionList: any[] = [];
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
    setCurrentIndex(0);
    setLoading(false);
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
    } else {
      playFailureSound();
    }

    if (!correct && !retryUsed) {
      return;
    }

    await recordQuizAttempt(
      childId,
      question.word.id,
      question.questionType as any,
      correct,
      true
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
      true
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
      setCompleted(true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
    } else {
      setCompleted(true);
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

  if (questions.length === 0 && !loading) {
    return (
      <div className="p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">סוג תרגול:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full p-2 border rounded-lg mb-2"
          >
            <option value="needsReview">צריך חיזוק</option>
            <option value="mixed">מעורב</option>
            <option value="category">לפי קטגוריה</option>
          </select>
          {mode === 'category' && (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={() => generateQuestions()}
          className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-medium"
        >
          התחל תרגול
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">טוען...</p>
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
    // Don't reset usedWordIds - keep track to avoid repeating words
    await generateQuestions();
  };

  const handleRestartQuiz = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתחיל תרגול חדש? ההתקדמות הנוכחית תימחק.')) {
      setCompleted(false);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
      setRetryUsed(false);
      setScore({ correct: 0, total: 0 });
      // Pass true to reset used words and get fresh words
      await generateQuestions(true);
    }
  };

  if (completed) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-3xl font-bold mb-2">סיימת את התרגול!</h2>
        <p className="text-xl text-gray-600 mb-2">
          {score.correct} מתוך {score.total} נכונים
        </p>
        <p className="text-2xl font-bold text-green-600 mb-6">{percentage}%</p>
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
            title="התחל תרגול חדש"
          >
            🔄 החלף תרגול
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
        <div className="text-center mb-6">
          {question.questionType === 'EN_TO_HE' && (
            <>
              <h2 className="text-4xl font-bold mb-4 text-green-600">{question.word.englishWord}</h2>
              <p className="text-lg text-gray-600">מה התרגום בעברית?</p>
            </>
          )}
          {question.questionType === 'HE_TO_EN' && (
            <>
              <h2 className="text-4xl font-bold mb-4 text-green-600">{question.word.hebrewTranslation}</h2>
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
                ? 'bg-green-100 text-green-800 border-green-400'
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
            className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white py-5 md:py-6 rounded-xl text-lg md:text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {currentIndex < questions.length - 1 ? 'המשך →' : 'סיים תרגול ✓'}
          </button>
        )}
      </div>
    </div>
  );
}
