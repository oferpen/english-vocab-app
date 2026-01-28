'use client';

import { useEffect, useState } from 'react';
import Confetti from './Confetti';

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
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center animate-slide-up border-2 border-primary-200">
          <div className="text-7xl md:text-8xl mb-6 animate-bounce-slow">
            {emoji}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-600">
            {title}
          </h2>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-medium">
            {message}
          </p>
          <div className="flex flex-col gap-3">
            {actionLabel && onAction && (
              <button
                onClick={handleAction}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 rounded-xl text-lg md:text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {actionLabel}
              </button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <button
                onClick={handleSecondaryAction}
                className="w-full bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white py-4 rounded-xl text-lg md:text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {secondaryActionLabel}
              </button>
            )}
            {onClose && !actionLabel && !secondaryActionLabel && (
              <button
                onClick={handleClose}
                className="w-full text-gray-600 hover:text-gray-800 py-3 rounded-xl text-base font-medium transition-colors"
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
