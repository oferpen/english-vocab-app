'use client';

import { useState, useEffect } from 'react';
import { getAllWords, createWord, updateWord, deleteWord } from '@/app/actions/words';
import { useRouter } from 'next/navigation';

export default function WordsManagement() {
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    englishWord: '',
    hebrewTranslation: '',
    category: '',
    difficulty: '1',
    exampleEn: '',
    exampleHe: '',
  });
  const router = useRouter();

  useEffect(() => {
    loadWords();
  }, []);

  const loadWords = async () => {
    setLoading(true);
    const wordList = await getAllWords();
    setWords(wordList);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateWord(editing.id, {
          ...formData,
          difficulty: parseInt(formData.difficulty),
        });
      } else {
        await createWord({
          ...formData,
          difficulty: parseInt(formData.difficulty),
        });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({
        englishWord: '',
        hebrewTranslation: '',
        category: '',
        difficulty: '1',
        exampleEn: '',
        exampleHe: '',
      });
      loadWords();
      router.refresh();
    } catch (error) {
      alert('שגיאה בשמירה');
    }
  };

  const handleEdit = (word: any) => {
    setEditing(word);
    setFormData({
      englishWord: word.englishWord,
      hebrewTranslation: word.hebrewTranslation,
      category: word.category,
      difficulty: word.difficulty.toString(),
      exampleEn: word.exampleEn || '',
      exampleHe: word.exampleHe || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק מילה זו?')) {
      await deleteWord(id);
      loadWords();
      router.refresh();
    }
  };

  const categories = Array.from(new Set(words.map((w) => w.category)));

  if (loading) {
    return <div className="p-4 text-center">טוען...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">ניהול מילים</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({
              englishWord: '',
              hebrewTranslation: '',
              category: '',
              difficulty: '1',
              exampleEn: '',
              exampleHe: '',
            });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + הוסף מילה
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">{editing ? 'ערוך מילה' : 'הוסף מילה'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">מילה באנגלית *</label>
              <input
                type="text"
                value={formData.englishWord}
                onChange={(e) => setFormData({ ...formData, englishWord: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">תרגום בעברית *</label>
              <input
                type="text"
                value={formData.hebrewTranslation}
                onChange={(e) => setFormData({ ...formData, hebrewTranslation: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">קטגוריה *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border rounded-lg"
                list="categories"
                required
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">רמת קושי</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full p-2 border rounded-lg"
              >
                <option value="1">קל</option>
                <option value="2">בינוני</option>
                <option value="3">קשה</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">דוגמה באנגלית</label>
              <input
                type="text"
                value={formData.exampleEn}
                onChange={(e) => setFormData({ ...formData, exampleEn: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">דוגמה בעברית</label>
              <input
                type="text"
                value={formData.exampleHe}
                onChange={(e) => setFormData({ ...formData, exampleHe: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
              >
                שמור
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {words.map((word) => (
          <div
            key={word.id}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div>
              <div className="font-bold text-lg">
                {word.englishWord} - {word.hebrewTranslation}
              </div>
              <div className="text-sm text-gray-600">
                {word.category} | רמה {word.difficulty}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(word)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                ערוך
              </button>
              <button
                onClick={() => handleDelete(word.id)}
                className="bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                מחק
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
