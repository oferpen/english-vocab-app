'use client';

import { useState } from 'react';
import { verifyPIN } from '@/app/actions/auth';

interface PINGateProps {
  onVerified: () => void;
}

export default function PINGate({ onVerified }: PINGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyPIN(pin);
    if (isValid) {
      onVerified();
    } else {
      setError('PIN שגוי');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">פאנל הורים</h1>
        <p className="text-gray-600 mb-6 text-center">הכנס PIN כדי להמשיך</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
            className="w-full p-3 border rounded-lg text-center text-2xl mb-4"
            placeholder="PIN"
            autoFocus
          />
          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium"
          >
            כניסה
          </button>
        </form>
      </div>
    </div>
  );
}
