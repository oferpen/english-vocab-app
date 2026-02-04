'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { getAllLetters, markLetterSeen } from '@/app/actions/letters';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';
import { Volume2, SkipBack, CheckCircle2, XCircle } from 'lucide-react';

interface QuizLettersProps {
    userId: string;
    onModeSwitch?: (mode: 'learn' | 'quiz') => void;
}

export default function QuizLetters({ userId }: QuizLettersProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [questions, setQuestions] = useState<any[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [selectedAnswerQuestionId, setSelectedAnswerQuestionId] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [retryUsed, setRetryUsed] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [showConfetti, setShowConfetti] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [xpGained, setXpGained] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const continueButtonRef = useRef<HTMLButtonElement>(null);
    const router = useRouter();

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: x * 8, y: y * -8 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
    };

    useEffect(() => {
        generateQuestions();
    }, [userId]);

    // Reset answer selection when moving to next question
    useEffect(() => {
        setSelectedAnswer(null);
        setSelectedAnswerQuestionId(null);
        setShowResult(false);
        setIsCorrect(false);
        setRetryUsed(false);
    }, [currentIndex]);

    // Auto-scroll to continue button when showing result
    useEffect(() => {
        if (showResult && selectedAnswerQuestionId && continueButtonRef.current) {
            setTimeout(() => {
                continueButtonRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }, 300);
        }
    }, [showResult, selectedAnswerQuestionId]);

    const generateQuestions = async () => {
        try {
            setLoading(true);
            setError(null);
            const allLetters = await getAllLetters();
            if (allLetters.length === 0) {
                setError('אין אותיות זמינות לחידון.');
                setLoading(false);
                setQuestions([]);
                return;
            }

            const shuffled = [...allLetters].sort(() => Math.random() - 0.5);
            // Use all letters for the quiz (like word quiz uses all words in category)
            const quizLetters = shuffled;

            const questionList = quizLetters.map(letter => {
                const types = ['LETTER_TO_NAME', 'LETTER_TO_HEBREW', 'AUDIO_TO_LETTER'];
                const type = types[Math.floor(Math.random() * types.length)];

                let correctAnswer = '';
                if (type === 'LETTER_TO_NAME') correctAnswer = letter.name || '';
                else if (type === 'LETTER_TO_HEBREW') correctAnswer = letter.hebrewName || '';
                else correctAnswer = letter.letter || '';

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
        } catch (err) {
            setError('שגיאה בטעינת החידון');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer: string) => {
        if (showResult) return;
        const question = questions[currentIndex];
        if (!question) return;
        
        setSelectedAnswer(answer);
        setSelectedAnswerQuestionId(question.letter.id);
        
        // Auto-check answer (like Quiz component)
        const correct = answer === question.correctAnswer;
        setIsCorrect(correct);
        setShowResult(true);

        if (correct) {
            playSuccessSound();
            setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 1000);
        } else {
            playFailureSound();
        }

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

    const handleSkip = async () => {
        if (showResult) return;

        // Play failure sound for skip
        playFailureSound();

        const question = questions[currentIndex];
        if (!question) return;

        // Record skip as incorrect attempt
        await markLetterSeen(userId, question.letter.id, false);

        // Update score (skip counts as wrong)
        setScore(prev => ({ ...prev, total: prev.total + 1 }));

        // Move to next question or finish quiz
        if (currentIndex < questions.length - 1) {
            setSelectedAnswer(null);
            setSelectedAnswerQuestionId(null);
            setShowResult(false);
            setIsCorrect(false);
            setRetryUsed(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finish quiz
            const xp = score.correct * 5;
            setXpGained(xp);
            setShowCelebration(true);
            await addXP(userId, xp);
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

    if (loading || !questions[currentIndex]) {
        return (
            <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto mb-4"></div>
                <p className="text-xl text-white font-black">טוען שאלה...</p>
                {questions.length === 0 && (
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

    if (error && questions.length === 0) {
        return (
            <div className="p-4 text-center">
                <p className="text-xl text-white font-black mb-4">{error}</p>
                <button
                    onClick={() => generateQuestions()}
                    className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600"
                >
                    נסה שוב
                </button>
            </div>
        );
    }

    if (showCelebration) {
        const percentage = Math.round((score.correct / questions.length) * 100);
        
        // Emoji based on performance - appropriate for all score ranges
        const emoji = percentage >= 70 ? '🎉' : percentage >= 50 ? '💪' : percentage >= 30 ? '📚' : '🌱';
        
        // Title adapted to score
        const title = percentage >= 50 ? 'חידון אותיות הושלם!' : 'לא נורא, המשך לתרגל';
        
        // Remove exclamation marks for low scores
        const message = percentage >= 50 
          ? `${score.correct} מתוך ${questions.length} נכונים! קיבלת ${xpGained} נקודות נסיון!`
          : `${score.correct} מתוך ${questions.length} נכונים. קיבלת ${xpGained} נקודות נסיון.`;
        
        return (
            <>
                <Confetti trigger={showCelebration && percentage >= 70} duration={1000} />
                <CelebrationScreen
                    title={title}
                    message={message}
                    emoji={emoji}
                    showConfetti={showCelebration && percentage >= 70}
                    actionLabel="חזור למסך הראשי"
                    onAction={() => router.push('/learn/path')}
                    onClose={() => router.push('/learn/path')}
                />
            </>
        );
    }

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;

    // Only show result state if this is the current question and we have a result
    const isCurrentQuestionResult = showResult &&
        selectedAnswerQuestionId !== null &&
        selectedAnswerQuestionId === question.letter.id;

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
                                {question.type === 'LETTER_TO_NAME' && (
                                    <>
                                        <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-1 sm:mb-2 text-white tracking-tight leading-tight">{question.letter.letter}</h2>
                                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-bold tracking-tight">איך מבטאים?</p>
                                    </>
                                )}
                                {question.type === 'LETTER_TO_HEBREW' && (
                                    <>
                                        <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-1 sm:mb-2 text-white tracking-tight leading-tight">{question.letter.letter}</h2>
                                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-bold tracking-tight">מה התרגום לעברית?</p>
                                    </>
                                )}
                                {question.type === 'AUDIO_TO_LETTER' && (
                                    <>
                                        <div className="flex justify-center mb-1 sm:mb-1.5 md:mb-2">
                                            <button
                                                onClick={() => speakLetter(question.letter.letter)}
                                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md sm:rounded-lg md:rounded-xl lg:rounded-2xl bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/40 hover:scale-110 active:scale-95 transition-all group"
                                            >
                                                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:animate-pulse" />
                                            </button>
                                        </div>
                                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/80 font-bold tracking-tight">איזו אות שמעת?</p>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-2 md:gap-3 lg:gap-4">
                                {question.answers.map((answer: string, idx: number) => {
                                    const currentQuestionId = question.letter.id;
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
                                            key={`q${currentIndex}-l${question.letter.id}-a${idx}`}
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
