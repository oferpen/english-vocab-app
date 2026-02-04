'use client';

import { useState, useEffect } from 'react';
import { getAllCategories, createWord, updateWord, deleteWord, getAllWordsAdmin } from '@/app/actions/words';
import type { Word } from '@prisma/client';
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  Zap,
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  AlertCircle,
  FolderOpen,
  Settings as SettingsIcon,
  ArrowRight
} from 'lucide-react';

type WordFormData = {
  englishWord: string;
  hebrewTranslation: string;
  category: string;
  level: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<WordFormData>({
    englishWord: '',
    hebrewTranslation: '',
    category: '',
    level: 1,
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
      alert('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  const filteredWords = words.filter((word) => {
    // First filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const englishMatch = word.englishWord.toLowerCase().includes(searchLower);
      const hebrewMatch = word.hebrewTranslation.toLowerCase().includes(searchLower);
      if (!englishMatch && !hebrewMatch) return false;
    }

    // Then filter by category
    if (selectedCategory !== 'all' && word.category !== selectedCategory) {
      return false;
    }

    // Then filter by level (using defensive access for migration safety)
    const wordLevel = (word as any).level ?? (word as any).difficulty;
    if (selectedLevel !== 'all' && wordLevel !== selectedLevel) {
      return false;
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
      level: 1,
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
    setIsNewCategory(!categories.includes(word.category || ''));
    setFormData({
      englishWord: word.englishWord,
      hebrewTranslation: word.hebrewTranslation,
      category: word.category || '',
      level: (word as any).level ?? (word as any).difficulty,
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
      level: 1,
      active: true,
      imageUrl: '',
      audioUrl: '',
      exampleEn: '',
      exampleHe: '',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F9F9FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-neutral-400 font-bold animate-pulse">טוען נתונים...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9FF] pb-20">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-indigo-50 px-4 md:px-8 py-4 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-indigo-600 font-black hover:bg-indigo-50 transition-all active:scale-95 text-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span>חזרה לאתר</span>
          </button>

          <div className="flex flex-col items-center">
            <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-1.5" dir="ltr">
              <span className="text-neutral-900">English</span>
              <span className="text-indigo-600">Path</span>
              <span className="text-neutral-300 mx-1">|</span>
              <span className="text-neutral-400 font-bold text-sm md:text-base rtl">ניהול מילים</span>
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <SettingsIcon className="w-3 h-3 text-indigo-400" />
              <p className="text-[10px] md:text-xs text-neutral-400 font-bold uppercase tracking-wider">Super Admin Dashboard</p>
            </div>
          </div>

          <button
            onClick={handleAddWord}
            className="group flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl text-sm font-black shadow-[0_4px_0_0_#4338ca] hover:shadow-[0_2px_0_0_#4338ca] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span className="hidden md:inline">הוסף מילה</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters & Metrics View */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-[2.5rem] shadow-sm border border-neutral-100">
            <div className="flex items-center gap-3 mb-4 text-indigo-600">
              <Layers className="w-5 h-5" />
              <h3 className="font-black">סינון נתונים</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 mr-1">קטגוריה</label>
                <div className="relative">
                  <FolderOpen className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800 text-sm appearance-none"
                  >
                    <option value="all">כל הקטגוריות</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 mr-1">רמה</label>
                <div className="relative">
                  <Zap className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full pl-4 pr-10 py-3 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800 text-sm appearance-none"
                  >
                    <option value="all">כל הרמות</option>
                    <option value="1">מתחילים</option>
                    <option value="2">רמה 2 (Basic)</option>
                    <option value="3">רמה 3 (Advanced)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-neutral-400 uppercase tracking-widest mb-2 mr-1">חיפוש חופשי</label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
                  <input
                    type="text"
                    placeholder="חפש מילה..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800 text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-neutral-100 flex flex-col justify-center">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">סה"כ מילים</p>
              <div className="text-4xl font-black text-neutral-800">{words.length}</div>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-neutral-100 flex flex-col justify-center">
              <p className="text-xs font-black text-neutral-400 uppercase tracking-widest mb-1">מילים מסוננות</p>
              <div className="text-4xl font-black text-indigo-600">{filteredWords.length}</div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-[2.5rem] shadow-lg shadow-indigo-100 text-white flex flex-col justify-center relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">קטגוריות</p>
                <div className="text-4xl font-black">{categories.length}</div>
              </div>
              <Layers className="absolute -bottom-4 -left-4 w-24 h-24 text-white/10 group-hover:rotate-12 transition-transform duration-500" />
            </div>
          </div>
        </div>

        {/* Add/Edit Form Section */}
        {showAddForm && (
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 p-8 md:p-10 mb-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-neutral-800">
                {editingWord ? 'עריכת מילה' : 'מילה חדשה'}
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveWord} className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">מילה באנגלית *</label>
                  <input
                    type="text"
                    required
                    value={formData.englishWord}
                    onChange={(e) => setFormData({ ...formData, englishWord: e.target.value })}
                    className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800 text-lg"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">תרגום לעברית *</label>
                  <input
                    type="text"
                    required
                    value={formData.hebrewTranslation}
                    onChange={(e) => setFormData({ ...formData, hebrewTranslation: e.target.value })}
                    className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800 text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">קטגוריה *</label>
                  <div className="flex gap-2">
                    {!isNewCategory ? (
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="flex-1 px-6 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800"
                      >
                        <option value="">בחר קטגוריה</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="הזן שם קטגוריה"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="flex-1 px-6 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewCategory(!isNewCategory);
                        setFormData({ ...formData, category: isNewCategory ? (categories[0] || '') : '' });
                      }}
                      className="p-4 bg-neutral-100 text-neutral-500 rounded-2xl hover:bg-neutral-200 transition-all active:scale-95"
                      title={isNewCategory ? "בחר מרשימה" : "קטגוריה חדשה"}
                    >
                      {isNewCategory ? <Filter className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">רמה *</label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                    className="w-full px-6 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800"
                  >
                    <option value="1">מתחילים</option>
                    <option value="2">רמה 2 (Beginner)</option>
                    <option value="3">רמה 3 (Advanced)</option>
                  </select>
                </div>
              </div>

              <div className="bg-neutral-50 p-6 rounded-[2.5rem] border-2 border-dashed border-neutral-100 flex flex-col items-center justify-center text-center">
                <div className="text-xs font-black text-neutral-300 uppercase tracking-[0.2em] mb-4">תצוגה מקדימה</div>
                <div className="text-4xl font-black text-neutral-900 mb-2" dir="ltr">{formData.englishWord || '---'}</div>
                <div className="text-xl font-bold text-neutral-400 mb-4">{formData.hebrewTranslation || '---'}</div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="active-form"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                      className="w-6 h-6 text-indigo-600 rounded-lg border-neutral-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="active-form" className="mr-2 text-sm font-black text-neutral-600 cursor-pointer">פעיל</label>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 flex gap-4 pt-4 border-t border-neutral-50">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-8 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black hover:bg-neutral-200 transition-all active:scale-95"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-[0_8px_0_0_#4338ca] hover:shadow-[0_4px_0_0_#4338ca] hover:translate-y-[4px] active:translate-y-[8px] active:shadow-none transition-all flex items-center justify-center gap-2 group"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Check className="w-6 h-6 group-hover:scale-125 transition-transform" />
                  )}
                  <span>{editingWord ? 'עדכן מילה' : 'שמור מילה'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Words Table - Redesigned as modern List */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                  <th className="px-8 py-6 text-xs font-black text-neutral-400 uppercase tracking-widest">מילה באנגלית</th>
                  <th className="px-8 py-6 text-xs font-black text-neutral-400 uppercase tracking-widest">תרגום</th>
                  <th className="px-8 py-6 text-xs font-black text-neutral-400 uppercase tracking-widest">קטגוריה</th>
                  <th className="px-8 py-6 text-xs font-black text-neutral-400 uppercase tracking-widest text-center">רמה</th>
                  <th className="px-8 py-6 text-xs font-black text-neutral-400 uppercase tracking-widest text-center">סטטוס</th>
                  <th className="px-8 py-6 text-xs font-black text-neutral-400 uppercase tracking-widest text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredWords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Search className="w-12 h-12 text-neutral-100" />
                        <p className="text-neutral-400 font-bold">לא נמצאו מילים התואמות לחיפוש</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredWords.map((word) => (
                    <tr key={word.id} className="group hover:bg-neutral-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <span className="text-xl font-black text-neutral-800 tracking-tight" dir="ltr">{word.englishWord}</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-lg font-bold text-neutral-500">{word.hebrewTranslation}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-black">
                          <FolderOpen className="w-3 h-3 text-neutral-400" />
                          {word.category}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={`
                          inline-flex items-center justify-center w-8 h-8 rounded-xl font-black text-sm
                          ${((word as any).level ?? (word as any).difficulty) === 1 ? 'bg-indigo-50 text-indigo-600' :
                            ((word as any).level ?? (word as any).difficulty) === 2 ? 'bg-emerald-50 text-emerald-600' :
                              'bg-amber-50 text-amber-600'}
                        `}>
                          {(word as any).level ?? (word as any).difficulty}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <div className={`
                          inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                          ${word.active ? 'bg-green-50 text-green-600' : 'bg-neutral-100 text-neutral-400'}
                        `}>
                          <div className={`w-1.5 h-1.5 rounded-full ${word.active ? 'bg-green-500 animate-pulse' : 'bg-neutral-300'}`}></div>
                          {word.active ? 'פעיל' : 'כבוי'}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-left">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditWord(word)}
                            className="p-2.5 bg-white border border-neutral-100 text-neutral-400 rounded-xl hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm transition-all active:scale-90"
                            title="ערוך"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            disabled={deleting === word.id}
                            className="p-2.5 bg-white border border-neutral-100 text-neutral-400 rounded-xl hover:text-red-500 hover:border-red-100 hover:shadow-sm transition-all active:scale-90 disabled:opacity-50"
                            title="מחק"
                          >
                            {deleting === word.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
