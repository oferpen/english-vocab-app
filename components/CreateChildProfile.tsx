'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createChild } from '@/app/actions/children';

const avatars = ['👶', '👧', '👦', '🧒', '👨', '👩', '🎮', '🌟', '🚀', '🎨', '⚽', '🎵'];

export default function CreateChildProfile() {
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👶');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('אנא הכנס שם');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createChild({
        name: name.trim(),
        avatar: selectedAvatar,
      });
      
      // Redirect to home page to show welcome screen with the new child
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת פרופיל');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ברוכים הבאים!</h1>
          <p className="text-gray-600">בואו ניצור פרופיל לילד/ה</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-right text-gray-700 font-medium mb-2">
              שם הילד/ה
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="הכנס שם"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-right text-lg focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-right text-gray-700 font-medium mb-3">
              בחר אווטר
            </label>
            <div className="grid grid-cols-6 gap-3">
              {avatars.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`text-4xl p-3 rounded-lg border-2 transition-all transform hover:scale-110 ${
                    selectedAvatar === avatar
                      ? 'border-blue-500 bg-blue-50 scale-110'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-right">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg text-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? 'יוצר...' : 'בואו נתחיל! 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
