'use client';

import { useState, useEffect } from 'react';
import { getAllCategories, createWord, updateWord, deleteWord, getAllWordsAdmin } from '@/app/actions/words';
import type { Word } from '@prisma/client';

type WordFormData = {
  englishWord: string;
  hebrewTranslation: string;
  category: string;
  difficulty: number;
  active: boolean;
  imageUrl?: string;
  audioUrl?: string;
  exampleEn?: string;
  exampleHe?: string;
};

export default function AdminWordsManager() {
  const [words, setWords] = useState<Word[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<WordFormData>({
    englishWord: '',
    hebrewTranslation: '',
    category: '',
    difficulty: 1,
    active: true,
    imageUrl: '',
    audioUrl: '',
    exampleEn: '',
    exampleHe: '',
  });
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allWordsData, allCategories] = await Promise.all([
        getAllWordsAdmin(),
        getAllCategories(),
      ]);
      setWords(allWordsData);
      setCategories(allCategories.sort());
    } catch (error) {
      console.error('Error loading data:', error);
      alert('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter((word) => {
    // First filter by category
    if (selectedCategory !== 'all' && word.category !== selectedCategory) {
      return false;
    }
    
    // Then filter by level
    if (selectedLevel !== 'all') {
      // Level mapping:
      // Level 1 = Starter category words with difficulty 1 (shown to level 1 users)
      // Level 2 = difficulty 1 (basic words)
      // Level 3 = difficulty 2+ (less basic words)
      if (selectedLevel === 1) {
        // Level 1 shows Starter category words with difficulty 1
        if (word.category !== 'Starter' || word.difficulty !== 1) {
          return false;
        }
      } else if (selectedLevel === 2) {
        // Level 2 means difficulty 1
        if (word.difficulty !== 1) {
          return false;
        }
      } else if (selectedLevel === 3) {
        // Level 3 means difficulty 2 or higher (>= 2)
        if (word.difficulty < 2) {
          return false;
        }
      } else {
        // Fallback: exact match
        if (word.difficulty !== selectedLevel) {
          return false;
        }
      }
    }
    
    return true;
  });

  const handleAddWord = () => {
    setEditingWord(null);
    setIsNewCategory(false);
    setFormData({
      englishWord: '',
      hebrewTranslation: '',
      category: categories[0] || '',
      difficulty: 1,
      active: true,
      imageUrl: '',
      audioUrl: '',
      exampleEn: '',
      exampleHe: '',
    });
    setShowAddForm(true);
  };

  const handleEditWord = (word: Word) => {
    setEditingWord(word);
    setIsNewCategory(!categories.includes(word.category));
    setFormData({
      englishWord: word.englishWord,
      hebrewTranslation: word.hebrewTranslation,
      category: word.category,
      difficulty: word.difficulty,
      active: word.active,
      imageUrl: word.imageUrl || '',
      audioUrl: word.audioUrl || '',
      exampleEn: word.exampleEn || '',
      exampleHe: word.exampleHe || '',
    });
    setShowAddForm(true);
  };

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const wordData = {
        ...formData,
        imageUrl: formData.imageUrl || undefined,
        audioUrl: formData.audioUrl || undefined,
        exampleEn: formData.exampleEn || undefined,
        exampleHe: formData.exampleHe || undefined,
      };

      if (editingWord) {
        await updateWord(editingWord.id, wordData);
      } else {
        await createWord(wordData);
      }
      
      await loadData();
      setShowAddForm(false);
      setEditingWord(null);
    } catch (error) {
      console.error('Error saving word:', error);
      alert('שגיאה בשמירת המילה');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המילה הזו?')) {
      return;
    }
    
    try {
      setDeleting(wordId);
      await deleteWord(wordId);
      await loadData();
    } catch (error) {
      console.error('Error deleting word:', error);
      alert('שגיאה במחיקת המילה');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingWord(null);
    setIsNewCategory(false);
    setFormData({
      englishWord: '',
      hebrewTranslation: '',
      category: '',
      difficulty: 1,
      active: true,
      imageUrl: '',
      audioUrl: '',
      exampleEn: '',
      exampleHe: '',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">ניהול מילים - Super Admin</h1>
          <button
            onClick={handleAddWord}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            + הוסף מילה חדשה
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              רמה
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">כל הרמות</option>
              <option value="1">רמה 1</option>
              <option value="2">רמה 2</option>
              <option value="3">רמה 3</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-primary-200">
            <h2 className="text-xl font-bold mb-4">
              {editingWord ? 'ערוך מילה' : 'הוסף מילה חדשה'}
            </h2>
            <form onSubmit={handleSaveWord} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מילה באנגלית *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.englishWord}
                    onChange={(e) => setFormData({ ...formData, englishWord: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    תרגום לעברית *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.hebrewTranslation}
                    onChange={(e) => setFormData({ ...formData, hebrewTranslation: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קטגוריה *
                  </label>
                  <div className="flex gap-2 items-center">
                    {!isNewCategory ? (
                      <>
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">בחר קטגוריה</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCategory(true);
                            setFormData({ ...formData, category: '' });
                          }}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          קטגוריה חדשה
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          required
                          placeholder="הזן שם קטגוריה חדשה"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewCategory(false);
                            setFormData({ ...formData, category: categories[0] || '' });
                          }}
                          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          בחר מרשימה
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    רמה *
                  </label>
                  <select
                    required
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="1">רמה 1</option>
                    <option value="2">רמה 2</option>
                    <option value="3">רמה 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL תמונה
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL אודיו
                  </label>
                  <input
                    type="url"
                    value={formData.audioUrl}
                    onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    דוגמה באנגלית
                  </label>
                  <input
                    type="text"
                    value={formData.exampleEn}
                    onChange={(e) => setFormData({ ...formData, exampleEn: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    דוגמה בעברית
                  </label>
                  <input
                    type="text"
                    value={formData.exampleHe}
                    onChange={(e) => setFormData({ ...formData, exampleHe: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="active" className="mr-2 text-sm font-medium text-gray-700">
                    פעיל
                  </label>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'שומר...' : editingWord ? 'עדכן' : 'הוסף'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Words Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-right">אנגלית</th>
                <th className="border border-gray-300 px-4 py-2 text-right">עברית</th>
                <th className="border border-gray-300 px-4 py-2 text-right">קטגוריה</th>
                <th className="border border-gray-300 px-4 py-2 text-right">רמה</th>
                <th className="border border-gray-300 px-4 py-2 text-right">סטטוס</th>
                <th className="border border-gray-300 px-4 py-2 text-right">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filteredWords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    אין מילים להצגה
                  </td>
                </tr>
              ) : (
                filteredWords.map((word) => (
                  <tr key={word.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">{word.englishWord}</td>
                    <td className="border border-gray-300 px-4 py-2">{word.hebrewTranslation}</td>
                    <td className="border border-gray-300 px-4 py-2">{word.category}</td>
                    <td className="border border-gray-300 px-4 py-2">{word.difficulty}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-sm ${word.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {word.active ? 'פעיל' : 'לא פעיל'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditWord(word)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
                        >
                          ערוך
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word.id)}
                          disabled={deleting === word.id}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm disabled:opacity-50"
                        >
                          {deleting === word.id ? 'מוחק...' : 'מחק'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <div>סה"כ מילים: {filteredWords.length} מתוך {words.length}</div>
          {selectedCategory !== 'all' && selectedLevel !== 'all' && (
            <div className="mt-1 text-xs space-y-1">
              <div>קטגוריה: {selectedCategory} | רמה: {selectedLevel}</div>
              <div>
                מילים בקטגוריה: {words.filter(w => w.category === selectedCategory).length} | 
                מילים ברמה: {words.filter(w => {
                  if (selectedLevel === 1) return w.category === 'Starter' && w.difficulty === 1;
                  if (selectedLevel === 2) return w.difficulty === 1;
                  if (selectedLevel === 3) return w.difficulty >= 2;
                  return false;
                }).length}
              </div>
              <div className="text-red-600">
                מילים בקטגוריה לפי difficulty: 
                Difficulty 1: {words.filter(w => w.category === selectedCategory && w.difficulty === 1).length} | 
                Difficulty 2: {words.filter(w => w.category === selectedCategory && w.difficulty === 2).length} | 
                Difficulty 3+: {words.filter(w => w.category === selectedCategory && w.difficulty >= 3).length}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
