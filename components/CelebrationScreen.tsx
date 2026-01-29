'use client';

import { useEffect, useState } from 'react';
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

  if (!show) return null;

  return (
    <>
      {showConfetti && <Confetti trigger={confettiTrigger} />}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-white/60 backdrop-blur-md animate-fade-in">
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-10 md:p-12 max-w-md w-full text-center animate-slide-up border border-neutral-100 relative">
          {/* Trophy Badge (Circular with Glow) */}
          <div className="mb-12 flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] border-4 border-indigo-100 ring-8 ring-white z-10 relative">
                <Trophy className="w-16 h-16 text-white fill-white/10" />
              </div>
              <div className="absolute -inset-2 bg-indigo-200 rounded-full blur-xl opacity-20 animate-pulse"></div>
            </div>
          </div>

          {/* Title with Emoji */}
          <h2 className="text-5xl md:text-6xl font-black mb-8 text-indigo-600 tracking-tight leading-tight">
            {title} {emoji}
          </h2>

          <p className="text-2xl md:text-3xl text-neutral-600 mb-12 font-bold tracking-tight leading-relaxed max-w-[320px] mx-auto">
            {message}
          </p>

          <div className="flex flex-col gap-4">
            {actionLabel && onAction && (
              <button
                onClick={handleAction}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-6 rounded-[2rem] text-2xl font-black shadow-[0_10px_0_0_#4338ca] active:translate-y-2 active:shadow-none transition-all duration-150 flex items-center justify-center gap-4 tracking-tight group"
              >
                <ArrowLeft className="w-7 h-7 transform group-hover:-translate-x-1 transition-transform" />
                <span>{actionLabel}</span>
              </button>
            )}

            {secondaryActionLabel && onSecondaryAction && (
              <button
                onClick={handleSecondaryAction}
                className="w-full bg-white text-emerald-600 border-2 border-emerald-100 py-4 rounded-2xl text-lg font-black hover:bg-emerald-50 transition-all transition-all"
              >
                {secondaryActionLabel}
              </button>
            )}

            {onClose && !actionLabel && !secondaryActionLabel && (
              <button
                onClick={handleClose}
                className="w-full text-neutral-400 hover:text-neutral-600 py-3 rounded-xl text-base font-bold transition-colors flex items-center justify-center gap-2"
              >
                סגור
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
