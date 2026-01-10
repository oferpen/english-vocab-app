'use client';

import { useState, useEffect } from 'react';
import { getAllChildren, getActiveChild } from '@/app/actions/children';
import { getAllWords } from '@/app/actions/words';
import { getDailyPlan, createDailyPlan, generateStarterPack, autoGeneratePlan } from '@/app/actions/plans';
import { useRouter } from 'next/navigation';

export default function DailyPlanManagement() {
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [words, setWords] = useState<any[]>([]);
  const [planWords, setPlanWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedChildId && selectedDate) {
      loadPlan();
    }
  }, [selectedChildId, selectedDate]);

  const loadData = async () => {
    setLoading(true);
    const kids = await getAllChildren();
    setChildren(kids);
    if (kids.length > 0) {
      const active = await getActiveChild();
      setSelectedChildId(active?.id || kids[0].id);
      setSelectedDate(new Date().toISOString().split('T')[0]);
    }
    const wordList = await getAllWords();
    setWords(wordList);
    setLoading(false);
  };

  const loadPlan = async () => {
    if (!selectedChildId || !selectedDate) return;
    const plan = await getDailyPlan(selectedChildId, selectedDate);
    if (plan) {
      setPlanWords(plan.words.map((w: any) => w.word));
    } else {
      setPlanWords([]);
    }
  };

  const handleAddWord = (wordId: string) => {
    if (!planWords.find((w) => w.id === wordId)) {
      const word = words.find((w) => w.id === wordId);
      if (word) {
        setPlanWords([...planWords, word]);
      }
    }
  };

  const handleRemoveWord = (wordId: string) => {
    setPlanWords(planWords.filter((w) => w.id !== wordId));
  };

  const handleSave = async () => {
    if (!selectedChildId || !selectedDate) return;
    await createDailyPlan(selectedChildId, selectedDate, planWords.map((w) => w.id));
    alert('תוכנית נשמרה בהצלחה');
    router.refresh();
  };

  const handleStarterPack = async () => {
    if (!selectedChildId || !selectedDate) return;
    await generateStarterPack(selectedChildId, selectedDate, 10);
    alert('תוכנית Starter Pack נוצרה בהצלחה');
    loadPlan();
    router.refresh();
  };

  const handleAutoGenerate = async () => {
    if (!selectedChildId || !selectedDate) return;
    await autoGeneratePlan(selectedChildId, selectedDate, {
      count: 10,
      preferUnseen: true,
    });
    alert('תוכנית נוצרה אוטומטית');
    loadPlan();
    router.refresh();
  };

  if (loading) {
    return <div className="p-4 text-center">טוען...</div>;
  }

  if (children.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xl">אין ילדים במערכת</p>
        <p className="text-gray-600">הוסף ילד בטאב "ילדים"</p>
      </div>
    );
  }

  const availableWords = words.filter((w) => !planWords.find((pw) => pw.id === w.id));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">תוכנית יומית</h2>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">בחר ילד</label>
          <select
            value={selectedChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">תאריך</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 border rounded-lg"
          />
        </div>
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleStarterPack}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg"
          >
            Starter Pack
          </button>
          <button
            onClick={handleAutoGenerate}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
          >
            יצירה אוטומטית
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="text-lg font-bold mb-2">מילים בתוכנית ({planWords.length})</h3>
        <div className="space-y-2">
          {planWords.map((word) => (
            <div
              key={word.id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span>
                {word.englishWord} - {word.hebrewTranslation}
              </span>
              <button
                onClick={() => handleRemoveWord(word.id)}
                className="text-red-600"
              >
                ✕
              </button>
            </div>
          ))}
          {planWords.length === 0 && (
            <p className="text-gray-500 text-center py-4">אין מילים בתוכנית</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="text-lg font-bold mb-2">הוסף מילים</h3>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {availableWords.map((word) => (
            <button
              key={word.id}
              onClick={() => handleAddWord(word.id)}
              className="w-full text-right p-2 bg-gray-50 rounded hover:bg-gray-100"
            >
              {word.englishWord} - {word.hebrewTranslation} ({word.category})
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-medium"
      >
        שמור תוכנית
      </button>
    </div>
  );
}
