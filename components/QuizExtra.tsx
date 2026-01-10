'use client';

import { useState, useEffect } from 'react';
import { recordQuizAttempt } from '@/app/actions/progress';
import { getAllWords, getWordsByCategory } from '@/app/actions/words';
import { getWordsNeedingReview, getUnseenWords } from '@/app/actions/progress';
import { getTodayPlan } from '@/app/actions/plans';
import { getSettings } from '@/app/actions/settings';
import { useRouter } from 'next/navigation';

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

  const generateQuestions = async () => {
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

    const questionList: any[] = [];
    for (const word of wordList.slice(0, settings.quizLength || 10)) {
      const questionTypes: string[] = [];
      if (settings.questionTypes.enToHe) questionTypes.push('EN_TO_HE');
      if (settings.questionTypes.heToEn) questionTypes.push('HE_TO_EN');
      if (settings.questionTypes.audioToEn) questionTypes.push('AUDIO_TO_EN');

      if (questionTypes.length === 0) continue;

      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const wrongAnswers = allWords
        .filter((w) => w.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => questionType === 'EN_TO_HE' ? w.hebrewTranslation : w.englishWord);

      const correctAnswer = questionType === 'EN_TO_HE' ? word.hebrewTranslation : word.englishWord;
      const allAnswers = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

      questionList.push({
        word,
        questionType,
        correctAnswer,
        answers: allAnswers,
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
      // Auto-advance to next question after 1.5 seconds if correct
      setTimeout(() => {
        handleNext();
      }, 1500);
    } else {
      setScore({ ...score, total: score.total + 1 });
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
          onClick={generateQuestions}
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
        <button
          onClick={() => {
            setQuestions([]);
            setCompleted(false);
            setScore({ correct: 0, total: 0 });
          }}
          className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium"
        >
          תרגול נוסף
        </button>
      </div>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{currentIndex + 1} מתוך {questions.length}</span>
          <span>{Math.round(progress)}%</span>
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
                key={idx}
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

      {showResult && (
        <button
          onClick={handleNext}
          className="w-full bg-green-600 text-white py-4 rounded-lg text-lg font-medium"
        >
          {currentIndex < questions.length - 1 ? 'הבא' : 'סיים תרגול'}
        </button>
      )}
    </div>
  );
}
