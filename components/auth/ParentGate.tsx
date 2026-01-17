'use client';

import { useState, useEffect } from 'react';

interface ParentGateProps {
  onVerified: () => void;
  type?: 'math' | 'word';
}

export default function ParentGate({ onVerified, type = 'math' }: ParentGateProps) {
  const [challenge, setChallenge] = useState<{ question: string; answer: number } | { word: string } | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    generateChallenge();
  }, [type]);

  const generateChallenge = () => {
    if (type === 'math') {
      // Simple math question: a + b = ?
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      setChallenge({ question: `${a} + ${b}`, answer: a + b });
    } else {
      // Type-a-word challenge: show a simple Hebrew word
      const words = ['אמא', 'אבא', 'בית', 'ספר', 'מים', 'שמש', 'ירח', 'כוכב'];
      const word = words[Math.floor(Math.random() * words.length)];
      setChallenge({ word });
    }
    setUserAnswer('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === 'math' && challenge && 'answer' in challenge) {
      if (parseInt(userAnswer) === challenge.answer) {
        onVerified();
      } else {
        setError('תשובה שגויה, נסה שוב');
        setUserAnswer('');
      }
    } else if (type === 'word' && challenge && 'word' in challenge) {
      if (userAnswer.trim() === challenge.word) {
        onVerified();
      } else {
        setError('מילה שגויה, נסה שוב');
        setUserAnswer('');
      }
    }
  };

  if (!challenge) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <h2 className="text-2xl font-bold mb-4">שער הורים</h2>
        <p className="text-gray-600 mb-6">אנא ענה על השאלה כדי להמשיך</p>
        
        {type === 'math' && 'question' in challenge && (
          <div className="mb-6">
            <p className="text-3xl font-bold text-blue-600 mb-4">{challenge.question} = ?</p>
          </div>
        )}
        
        {type === 'word' && 'word' in challenge && (
          <div className="mb-6">
            <p className="text-xl text-gray-700 mb-2">הקלד את המילה:</p>
            <p className="text-4xl font-bold text-purple-600 mb-4">{challenge.word}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => {
              setUserAnswer(e.target.value);
              setError('');
            }}
            className="w-full p-3 border rounded-lg text-center text-xl mb-4"
            placeholder={type === 'math' ? 'תשובה' : 'הקלד כאן'}
            autoFocus
          />
          {error && <p className="text-red-600 mb-4 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              בדוק
            </button>
            <button
              type="button"
              onClick={generateChallenge}
              className="px-4 py-3 border rounded-lg hover:bg-gray-50"
            >
              שאלה אחרת
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
