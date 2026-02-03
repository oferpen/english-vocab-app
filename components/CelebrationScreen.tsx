'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Confetti from './Confetti';
import { Trophy, Sparkles, ArrowRight, ArrowLeft, X } from 'lucide-react';

interface CelebrationScreenProps {
  title: string;
  message: string;
  emoji?: string;
  showConfetti?: boolean;
  onClose?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export default function CelebrationScreen({
  title,
  message,
  emoji = '🎉',
  showConfetti = true,
  onClose,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: CelebrationScreenProps) {
  const [show, setShow] = useState(true);
  const [confettiTrigger, setConfettiTrigger] = useState(false);

  useEffect(() => {
    setConfettiTrigger(true);
    const timer = setTimeout(() => setConfettiTrigger(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const [hasActed, setHasActed] = useState(false);

  const handleClose = () => {
    if (hasActed) return; // Prevent multiple calls
    setShow(false);
    onClose?.();
  };

  const handleAction = () => {
    if (hasActed) return; // Prevent multiple calls
    setHasActed(true);
    setShow(false);
    onAction?.(); // Only call onAction, not onClose
  };

  const handleSecondaryAction = () => {
    if (hasActed) return; // Prevent multiple calls
    setHasActed(true);
    setShow(false);
    onSecondaryAction?.();
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!show) return null;

  const celebrationContent = (
    <>
      {showConfetti && <Confetti trigger={confettiTrigger} />}
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md animate-fade-in quiz-celebration-overlay"></div>
      <div className="quiz-celebration-modal">
          {/* Trophy Badge (Circular with Glow) - Only show for good scores (60%+) */}
          {emoji && (emoji === '🎉' || emoji === '👍') && (
          <div className="mb-4 sm:mb-6 md:mb-8 flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(251,191,36,0.5)] border-2 border-amber-300 z-10 relative">
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white fill-white/20" />
              </div>
              <div className="absolute -inset-2 sm:-inset-2 md:-inset-3 bg-amber-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
            </div>
          </div>
          )}

          {/* Title with Emoji */}
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black mb-3 sm:mb-4 md:mb-6 text-primary-400 tracking-tight leading-tight">
            {title} {emoji}
          </h2>

          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/90 mb-4 sm:mb-6 md:mb-8 font-bold tracking-tight leading-relaxed max-w-full sm:max-w-[320px] mx-auto">
            {message}
          </p>

          <div className="flex flex-col gap-2 sm:gap-3">
            {actionLabel && onAction && (
              <button
                onClick={handleAction}
                className="w-full bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 hover:from-primary-600 hover:via-purple-600 hover:to-pink-600 text-white py-2.5 sm:py-3 md:py-4 lg:py-5 rounded-lg sm:rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg lg:text-xl font-black shadow-[0_8px_0_0_rgba(14,165,233,0.3)] active:translate-y-1 active:shadow-none transition-all duration-150 flex items-center justify-center gap-2 sm:gap-3 tracking-tight group glow-primary"
              >
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 transform group-hover:-translate-x-1 transition-transform" />
                <span>{actionLabel}</span>
              </button>
            )}

            {secondaryActionLabel && onSecondaryAction && (
              <button
                onClick={handleSecondaryAction}
                className="w-full glass-card text-emerald-400 border-2 border-emerald-400/50 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-base lg:text-lg font-black hover:bg-emerald-400/10 transition-all"
              >
                {secondaryActionLabel}
              </button>
            )}

            {onClose && !actionLabel && !secondaryActionLabel && (
              <button
                onClick={handleClose}
                className="w-full text-white/60 hover:text-white py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-bold transition-colors flex items-center justify-center gap-2"
              >
                סגור
              </button>
            )}
          </div>
      </div>
    </>
  );

  if (!mounted) return null;

  return createPortal(celebrationContent, document.body);
}
