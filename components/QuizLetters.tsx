'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { getAllLetters, markLetterSeen } from '@/app/actions/letters';
import { addXP } from '@/app/actions/levels';
import { useRouter, useSearchParams } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';
import { Volume2, SkipBack, CheckCircle2, XCircle, X, Check } from 'lucide-react';

interface QuizLettersProps {
    userId: string;
    onModeSwitch?: (mode: 'learn' | 'quiz') => void;
}

export default function QuizLetters({ userId, onModeSwitch }: QuizLettersProps) {
    const searchParams = useSearchParams();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [selectedAnswerQuestionId, setSelectedAnswerQuestionId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [retryUsed, setRetryUsed] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [showConfetti, setShowConfetti] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [xpGained, setXpGained] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const isGeneratingRef = useRef(false);
    const continueButtonRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();

    useEffect(() => {
        generateQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswerQuestionId(null);
        setShowResult(false);
        setIsCorrect(false);
        setRetryUsed(false);
    }, [currentIndex]);

    useEffect(() => {
        if (showResult && selectedAnswerQuestionId && continueButtonRef.current) {
            setTimeout(() => {
                continueButtonRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }, 300);
        }
    }, [showResult, selectedAnswerQuestionId]);

    const generateQuestions = async () => {
        if (isGeneratingRef.current) return;

        try {
            isGeneratingRef.current = true;
            setLoading(true);
            setError(null);

            const allLetters = await getAllLetters();
            if (allLetters.length === 0) {
                setError('אין אותיות זמינות לחידון.');
                setLoading(false);
                isGeneratingRef.current = false;
                return;
            }

            // Select 10 random letters for the quiz
            const shuffled = [...allLetters].sort(() => Math.random() - 0.5);
            const quizLetters = shuffled.slice(0, 10);

            const questionList = quizLetters.map(letter => {
                const types = ['LETTER_TO_NAME', 'LETTER_TO_HEBREW', 'AUDIO_TO_LETTER'];
                const type = types[Math.floor(Math.random() * types.length)];

                let correctAnswer = '';
                if (type === 'LETTER_TO_NAME') correctAnswer = letter.name || '';
                else if (type === 'LETTER_TO_HEBREW') correctAnswer = letter.hebrewName || '';
                else correctAnswer = letter.letter || '';

                // Generate wrong answers
                const wrongAnswerPool = allLetters.filter(l => l.id !== letter.id);
                const shuffledWrong = [...wrongAnswerPool].sort(() => Math.random() - 0.5);

                const wrongAnswers = new Set<string>();
                for (const l of shuffledWrong) {
                    let ans = '';
                    if (type === 'LETTER_TO_NAME') ans = l.name || '';
                    else if (type === 'LETTER_TO_HEBREW') ans = l.hebrewName || '';
                    else ans = l.letter || '';

                    if (ans !== correctAnswer && ans) {
                        wrongAnswers.add(ans);
                        if (wrongAnswers.size >= 3) break;
                    }
                }

                const allAnswers = [correctAnswer, ...Array.from(wrongAnswers)].sort(() => Math.random() - 0.5);

                return {
                    letter,
                    type,
                    correctAnswer,
                    answers: allAnswers,
                };
            });

            setQuestions(questionList);
            setLoading(false);
            isGeneratingRef.current = false;
        } catch (err) {
            console.error('Error generating questions:', err);
            setError('שגיאה בטעינת החידון.');
            setLoading(false);
            isGeneratingRef.current = false;
        }
    };

    const handleAnswerSelect = (answer: string) => {
        const currentQuestionId = questions[currentIndex]?.letter.id;
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

        if (!correct && !retryUsed) return;

        startTransition(async () => {
            await markLetterSeen(userId, question.letter.id, correct);
        });
    };

    const handleNext = async () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            const xp = score.correct * 5;
            setXpGained(xp);
            setShowCelebration(true);
            await addXP(userId, xp);
        }
    };

    const handleRetry = () => {
        setRetryUsed(true);
        setShowResult(false);
        setSelectedAnswer(null);
        setSelectedAnswerQuestionId(null);
    };

    const handleSkip = () => {
        if (showResult) return;
        playFailureSound();
        setScore(prev => ({ ...prev, total: prev.total + 1 }));
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowCelebration(true);
        }
    };

    const speakLetter = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            window.speechSynthesis.speak(utterance);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-xl text-neutral-600 font-bold">טוען חידון אותיות...</p>
            </div>
        );
    }

    if (error || questions.length === 0) {
        return (
            <div className="p-8 text-center">
                <p className="text-xl text-red-600 mb-6 font-bold">{error || 'לא נמצאו אותיות לחידון'}</p>
                <button
                    onClick={() => router.push('/learn/path')}
                    className="bg-primary-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-primary-200"
                >
                    חזור למפה
                </button>
            </div>
        );
    }

    if (showCelebration) {
        const percentage = Math.round((score.correct / questions.length) * 100);
        return (
            <>
                <Confetti trigger={showCelebration && percentage >= 70} />
                <CelebrationScreen
                    title="סיימת את חידון האותיות!"
                    message={`${score.correct} מתוך ${questions.length} נכונים! קיבלת ${xpGained} נקודות נסיון!`}
                    emoji={percentage >= 70 ? '🎉' : '💪'}
                    showConfetti={showCelebration && percentage >= 70}
                    actionLabel="חזור למפה"
                    onAction={() => {
                        router.push('/learn/path');
                        setTimeout(() => router.refresh(), 100);
                    }}
                    onClose={() => {
                        router.push('/learn/path');
                        setTimeout(() => router.refresh(), 100);
                    }}
                />
            </>
        );
    }

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isCurrentQuestionResult = showResult && selectedAnswerQuestionId === question.letter.id;

    return (
        <>
            <Confetti trigger={showConfetti} duration={1000} />
            <div className="p-4 md:p-6 bg-neutral-50 animate-fade-in flex flex-col max-w-2xl mx-auto min-h-0">
                {/* Progress Pill */}
                <div className="mb-4 w-full flex items-center justify-between bg-white px-5 py-3 rounded-full shadow-sm border border-neutral-100">
                    <div className="text-sm font-bold text-neutral-400">אות {currentIndex + 1} / {questions.length}</div>
                    <div className="flex-1 mx-5 bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-sm font-bold text-primary-600">{Math.round(progress)}%</div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 mb-4 border border-neutral-100 animate-slide-up flex-shrink-0 flex flex-col justify-between relative overflow-hidden">
                    {!isCurrentQuestionResult && (
                        <div className="absolute top-4 right-4">
                            <button onClick={handleSkip} className="text-neutral-300 hover:text-primary-500 p-2"><SkipBack className="w-5 h-5" /></button>
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="text-center mb-6">
                            {question.type === 'LETTER_TO_NAME' && (
                                <>
                                    <h2 className="text-5xl md:text-7xl font-black mb-2 text-primary-600 tracking-tight leading-tight">{question.letter.letter}</h2>
                                    <p className="text-xl md:text-2xl text-neutral-800 font-bold tracking-tight">איך מבטאים?</p>
                                </>
                            )}
                            {question.type === 'LETTER_TO_HEBREW' && (
                                <>
                                    <h2 className="text-5xl md:text-7xl font-black mb-2 text-primary-600 tracking-tight leading-tight">{question.letter.letter}</h2>
                                    <p className="text-xl md:text-2xl text-neutral-800 font-bold tracking-tight">איך היא נשמעת?</p>
                                </>
                            )}
                            {question.type === 'AUDIO_TO_LETTER' && (
                                <>
                                    <div className="flex justify-center mb-6">
                                        <button
                                            onClick={() => speakLetter(question.letter.letter)}
                                            className="w-20 h-20 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center shadow-[0_6px_0_0_#e0e7ff] hover:translate-y-0.5 transition-all duration-200 active:translate-y-1 active:shadow-none"
                                        >
                                            <Volume2 className="w-10 h-10" />
                                        </button>
                                    </div>
                                    <p className="text-xl md:text-2xl text-neutral-800 font-bold tracking-tight">איזו אות שמעת?</p>
                                </>
                            )}
                        </div>

                        <div className="space-y-3">
                            {question.answers.map((answer: string, idx: number) => {
                                let buttonClass = 'w-full py-4 rounded-xl text-lg md:text-2xl font-black border-2 transition-all duration-200 shadow-[0_1px_0_0_rgba(0,0,0,0.05)] active:translate-y-0.5 active:shadow-none ';

                                if (isCurrentQuestionResult) {
                                    if (answer === question.correctAnswer) buttonClass += 'bg-success-500 text-white border-success-600 shadow-[0_4px_0_0_#059669] scale-[1.01]';
                                    else if (answer === selectedAnswer) buttonClass += 'bg-danger-500 text-white border-danger-600 shadow-[0_4px_0_0_#e11d48]';
                                    else buttonClass += 'bg-white text-neutral-300 border-neutral-100 opacity-40 shadow-none';
                                } else {
                                    const isSelected = selectedAnswer === answer && selectedAnswerQuestionId === question.letter.id;
                                    buttonClass += isSelected ? 'bg-primary-100 text-primary-600 border-primary-500 shadow-[0_4px_0_0_#c7d2fe]' : 'bg-white text-neutral-600 border-neutral-100 hover:border-primary-200 hover:bg-neutral-50';
                                }

                                return (
                                    <button
                                        key={`ans-${idx}`}
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

                    {isCurrentQuestionResult && (
                        <div className="mt-1 animate-slide-up">
                            {isCorrect ? (
                                <div className="p-1.5 bg-success-50 border border-success-200 rounded-lg flex items-center justify-center gap-2">
                                    <div className="bg-success-500 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm"><CheckCircle2 className="w-3 h-3" /></div>
                                    <p className="text-success-700 text-sm font-black tracking-tight">נכון! 🎉</p>
                                </div>
                            ) : !retryUsed ? (
                                <div className="p-1.5 bg-accent-50 border border-accent-200 rounded-lg text-center space-y-0.5">
                                    <p className="text-accent-800 text-sm font-black tracking-tight">לא נורא, נסה שוב</p>
                                    <button onClick={handleRetry} className="w-full bg-accent-500 text-white py-1 rounded-md text-xs font-black shadow-[0_1px_0_0_#d97706] active:translate-y-0.5 active:shadow-none">נסה שוב</button>
                                </div>
                            ) : (
                                <div className="p-1.5 bg-danger-50 border border-danger-200 rounded-lg text-center flex items-center justify-center gap-2">
                                    <div className="bg-danger-500 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm"><XCircle className="w-3 h-3" /></div>
                                    <p className="text-danger-800 text-sm font-black tracking-tight">התשובה: {question.correctAnswer}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action Button */}
                <div className="w-full mt-1 pb-4">
                    {!isCurrentQuestionResult ? (
                        <button
                            onClick={handleCheck}
                            disabled={!selectedAnswer}
                            className={`w-full py-4 rounded-2xl text-2xl font-black transition-all duration-200 ${selectedAnswer ? 'bg-primary-500 text-white shadow-[0_6px_0_0_#4f46e5] hover:translate-y-0.5 hover:shadow-[0_3px_0_0_#4f46e5]' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'} active:translate-y-1 active:shadow-none`}
                        >
                            בדיקה
                        </button>
                    ) : (
                        <button
                            ref={continueButtonRef}
                            onClick={handleNext}
                            className={`w-full py-4 rounded-2xl text-2xl font-black transition-all duration-200 ${isCorrect ? 'bg-success-500 text-white shadow-[0_6px_0_0_#059669]' : 'bg-primary-500 text-white shadow-[0_6px_0_0_#4f46e5]'} hover:translate-y-0.5 hover:shadow-[0_3px_0_0_#4f46e5] active:translate-y-1 active:shadow-none`}
                        >
                            {currentIndex < questions.length - 1 ? 'המשך' : 'סיים חידון ✓'}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
