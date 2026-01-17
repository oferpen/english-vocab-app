'use client';

import { useState } from 'react';
import { verifyPIN } from '@/app/actions/auth';

interface PINGateProps {
  onVerified: () => void;
}

export default function PINGate({ onVerified }: PINGateProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const isValid = await verifyPIN(pin);
    if (isValid) {
      onVerified();
    } else {
      setError('PIN שגוי, נסה שוב');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">פאנל הורים</h1>
        <p className="text-gray-600 mb-6 text-center">הכנס PIN</p>
        
        <form onSubmit={handlePINSubmit} className="space-y-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:border-blue-500 focus:outline-none"
            autoFocus
            maxLength={4}
          />
          
          {error && (
            <p className="text-red-600 text-center text-sm">{error}</p>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-medium hover:bg-blue-700"
          >
            המשך
          </button>
        </form>
      </div>
    </div>
  );
}
