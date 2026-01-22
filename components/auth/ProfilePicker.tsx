'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ChildProfile {
  id: string;
  nickname: string;
  avatarId?: string;
  ageBand?: string;
}

export default function ProfilePicker() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/parent');
        return;
      }

      const { data, error } = await supabase
        .from('child_profiles')
        .select('id, nickname, avatar_id, age_band')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      // Error loading children
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = async (childId: string) => {
    try {
      // Store active child in cookie/session
      await supabase.auth.setSession({
        access_token: (await supabase.auth.getSession()).data.session?.access_token || '',
        refresh_token: (await supabase.auth.getSession()).data.session?.refresh_token || '',
      });

      // Update last active child
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('parents')
          .update({ last_active_child_id: childId })
          .eq('provider_user_id', user.id);
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      // Error selecting child
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <p className="text-2xl font-bold text-gray-700">טוען...</p>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">אין ילדים במערכת</h2>
          <p className="text-gray-600 mb-6">הורה צריך להוסיף ילדים בפאנל ההורים</p>
          <a
            href="/parent"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            עבור לפאנל הורים
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">שלום!</h1>
          <p className="text-lg text-gray-600">בחר את הפרופיל שלך כדי להתחיל</p>
        </div>

        <div className="space-y-4">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => handleChildSelect(child.id)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-xl text-2xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <span className="text-4xl">{child.avatarId || '👶'}</span>
              <span>{child.nickname}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/parent"
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            הורה? לחץ כאן
          </a>
        </div>
      </div>
    </div>
  );
}
