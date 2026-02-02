'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { getAllLetters, markLetterSeen } from '@/app/actions/letters';
import { addXP } from '@/app/actions/levels';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';
import CelebrationScreen from './CelebrationScreen';
import { playSuccessSound, playFailureSound } from '@/lib/sounds';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';

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
    const [isPending, startTransition] = useTransition();
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
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

    const generateQuestions = async () => {
        try {
            setLoading(true);
            const allLetters = await getAllLetters();
            if (allLetters.length === 0) return;

            const shuffled = [...allLetters].sort(() => Math.random() - 0.5);
            const quizLetters = shuffled.slice(0, 10);

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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (answer: string) => {
        if (showResult) return;
        setSelectedAnswer(answer);
        setSelectedAnswerQuestionId(questions[currentIndex]?.letter.id);
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
            setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
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
            setShowResult(false);
            setSelectedAnswer(null);
            setSelectedAnswerQuestionId(null);
            setRetryUsed(false);
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
            <div className="p-10 text-center glass-premium rounded-3xl max-w-2xl mx-auto mt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-500 mx-auto"></div>
                <p className="text-xl text-white font-black mt-4">מכין את החידון...</p>
            </div>
        );
    }

    if (showCelebration) {
        const percentage = Math.round((score.correct / questions.length) * 100);
        return (
            <>
                <Confetti trigger={showCelebration && percentage >= 70} />
                <CelebrationScreen
                    title="חידון אותיות הושלם!"
                    message={`${score.correct} מתוך ${questions.length} נכונים! קיבלת ${xpGained} נקודות נסיון!`}
                    emoji={percentage >= 70 ? '🎉' : '💪'}
                    showConfetti={showCelebration && percentage >= 70}
                    actionLabel="חזור למפה"
                    onAction={() => router.push('/learn/path')}
                    onClose={() => router.push('/learn/path')}
                />
            </>
        );
    }

    const question = questions[currentIndex];
    const progress = ((currentIndex + 1) / questions.length) * 100;
    const isCurrentQuestionResult = showResult && selectedAnswerQuestionId === question.letter.id;

    return (
        <div className="p-4 md:p-8 animate-fade-in flex flex-col max-w-4xl mx-auto min-h-0 relative">
            <div className="absolute top-40 -right-20 w-80 h-80 bg-accent-500/20 rounded-full blur-[100px] animate-blob mix-blend-screen" />
            <div className="absolute bottom-40 -left-20 w-[30rem] h-[30rem] bg-primary-500/20 rounded-full blur-[120px] animate-blob delay-2000 mix-blend-screen" />

            {/* Progress Header */}
            <div className="glass-premium w-full rounded-full h-6 overflow-hidden shadow-2xl p-1.5 border-white/30 mb-8">
                <div
                    className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(236,72,153,0.6)] animate-pulse"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Question Card (3D Tilt) */}
            <div
                className="relative perspective-2000 group mb-10"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                <div className="glass-premium rounded-[3.5rem] p-12 md:p-20 border-white/30 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex-shrink-0 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 opacity-70" />
                    <div className="text-center">
                        {question.type === 'LETTER_TO_NAME' && (
                            <h2 className="text-[10rem] font-black mb-4 text-white drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] text-shimmer leading-none">{question.letter.letter}</h2>
                        )}
                        {question.type === 'LETTER_TO_HEBREW' && (
                            <h2 className="text-[10rem] font-black mb-4 text-white drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] text-shimmer leading-none">{question.letter.letter}</h2>
                        )}
                        {question.type === 'AUDIO_TO_LETTER' && (
                            <div className="flex justify-center mb-10">
                                <button
                                    onClick={() => speakLetter(question.letter.letter)}
                                    className="w-32 h-32 rounded-[3rem] bg-gradient-to-br from-primary-400 to-purple-600 text-white flex items-center justify-center shadow-2xl glow-primary hover:scale-110 active:scale-95 transition-all group"
                                >
                                    <Volume2 className="w-16 h-16 group-hover:animate-pulse" />
                                </button>
                            </div>
                        )}
                        <p className="text-3xl text-neutral-800 font-black mb-10 tracking-tight">
                            {question.type === 'AUDIO_TO_LETTER' ? 'איזו אות שמעת?' : 'איך מבטאים?'}
                        </p>

                        <div className="grid grid-cols-2 gap-6">
                            {question.answers.map((answer: string, idx: number) => {
                                let buttonClass = 'py-6 rounded-3xl text-4xl font-black transition-all duration-300 border-2 ';
                                if (showResult && selectedAnswerQuestionId === question.letter.id) {
                                    if (answer === question.correctAnswer) buttonClass += 'bg-success-500 text-white border-white/40 shadow-success-200 scale-105 glow-primary ';
                                    else if (answer === selectedAnswer) buttonClass += 'bg-danger-500 text-white border-white/40 opacity-80 ';
                                    else buttonClass += 'bg-white/5 text-white/20 border-transparent ';
                                } else {
                                    const isSelected = selectedAnswer === answer;
                                    buttonClass += isSelected ? 'bg-primary-500 text-white border-white/40 glow-primary scale-105 ' : 'glass-card text-neutral-800 border-white/10 hover:border-white/40 ';
                                }
                                return (
                                    <button key={idx} onClick={() => handleAnswerSelect(answer)} className={buttonClass}>{answer}</button>
                                );
                            })}
                        </div>

                        {isCurrentQuestionResult && (
                            <div className="mt-10 animate-slide-up">
                                {isCorrect ? (
                                    <div className="p-5 glass-card border-success-500/50 rounded-2xl flex items-center justify-center gap-4 glow-primary">
                                        <CheckCircle2 className="w-8 h-8 text-success-400" />
                                        <p className="text-success-400 text-3xl font-black text-shimmer">מושלם! ✨</p>
                                    </div>
                                ) : (
                                    <div className="p-5 glass-card border-danger-500/50 rounded-2xl flex items-center justify-center gap-4">
                                        <XCircle className="w-8 h-8 text-danger-400" />
                                        <p className="text-white text-2xl font-black">התשובה הנכונה: <span className="text-shimmer">{question.correctAnswer}</span></p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="w-full mt-4 pb-12">
                {!isCurrentQuestionResult ? (
                    <button
                        onClick={handleCheck}
                        disabled={!selectedAnswer}
                        className={`w-full py-6 rounded-[2rem] text-3xl font-black transition-all duration-500 ${selectedAnswer ? 'bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 text-white shadow-[0_20px_50px_-10px_rgba(236,72,153,0.5)] hover:scale-[1.02] glow-primary' : 'bg-white/20 text-neutral-800/40 cursor-not-allowed'} active:scale-95`}
                    >
                        בדיקה! ✨
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className={`w-full py-6 rounded-[2rem] text-3xl font-black transition-all duration-500 bg-gradient-to-r ${isCorrect ? 'from-success-400 to-emerald-600' : 'from-primary-500 to-primary-700'} text-white shadow-2xl hover:scale-[1.02] active:scale-95`}
                    >
                        {currentIndex < questions.length - 1 ? 'המילה הבאה ✨' : 'סיים בהצטיינות! 🏆'}
                    </button>
                )}
            </div>
        </div>
    );
}
