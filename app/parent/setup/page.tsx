'use client';

import { useState } from 'react';
import { setPIN } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pin.length < 4) {
      setError('PIN חייב להיות לפחות 4 ספרות');
      return;
    }

    if (pin !== confirmPin) {
      setError('PIN לא תואם');
      return;
    }

    try {
      await setPIN(pin);
      router.push('/parent');
    } catch (err) {
      setError('שגיאה בהגדרת PIN');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-6 text-center">הגדר PIN</h1>
        <p className="text-gray-600 mb-6 text-center">
          הגדר PIN כדי להגן על פאנל ההורים
        </p>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPinValue(e.target.value)}
              className="w-full p-3 border rounded-lg text-center text-2xl"
              placeholder="הכנס PIN"
              maxLength={10}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">אישור PIN</label>
            <input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full p-3 border rounded-lg text-center text-2xl"
              placeholder="אשר PIN"
              maxLength={10}
            />
          </div>
          {error && <p className="text-red-600 mb-4 text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium"
          >
            שמור PIN
          </button>
        </form>
      </div>
    </div>
  );
}
