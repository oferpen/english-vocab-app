'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ParentGate from './ParentGate';

interface ParentPanelNewProps {
  user: any;
}

export default function ParentPanelNew({ user }: ParentPanelNewProps) {
  const [verified, setVerified] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('child_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      // Error loading children
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/parent');
  };

  if (!verified) {
    return <ParentGate onVerified={() => setVerified(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">פאנל הורים</h1>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              התנתק
            </button>
          </div>
          <p className="text-gray-600">מחובר כ: {user.email}</p>
        </div>

        {loading ? (
          <div className="text-center py-8">טוען...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">ילדים ({children.length})</h2>
            {children.length === 0 ? (
              <p className="text-gray-600">אין ילדים במערכת. הוסף ילד חדש.</p>
            ) : (
              <div className="space-y-2">
                {children.map((child) => (
                  <div key={child.id} className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{child.avatar_id || '👶'}</span>
                      <div>
                        <p className="font-bold">{child.nickname}</p>
                        {child.age_band && (
                          <p className="text-sm text-gray-600">גיל: {child.age_band}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
