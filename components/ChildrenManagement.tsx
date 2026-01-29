import { useState, useEffect } from 'react';
import { getAllChildren, createChild, updateChild, deleteChild, setActiveChild } from '@/app/actions/children';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, UserCheck, X, Check, Baby, GraduationCap, Calendar, Smile } from 'lucide-react';

const AVATAR_OPTIONS = ['👶', '🧒', '👦', '👧', '🦁', '🐯', '🐼', '🐨', '🦄', '🦖', '🚀', '🎨', '⚽', '🎮'];

export default function ChildrenManagement() {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    avatar: '👶',
    age: '',
    grade: '',
  });
  const router = useRouter();

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setLoading(true);
    const kids = await getAllChildren();
    setChildren(kids);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateChild(editing.id, {
          ...formData,
          age: formData.age ? parseInt(formData.age) : undefined,
        });
      } else {
        await createChild({
          ...formData,
          age: formData.age ? parseInt(formData.age) : undefined,
        });
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ name: '', avatar: '👶', age: '', grade: '' });
      loadChildren();
      router.refresh();
    } catch (error) {
      alert('שגיאה בשמירה');
    }
  };

  const handleEdit = (child: any) => {
    setEditing(child);
    setFormData({
      name: child.name,
      avatar: child.avatar || '👶',
      age: child.age?.toString() || '',
      grade: child.grade || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את ${name}?`)) {
      await deleteChild(id);
      loadChildren();
      router.refresh();
    }
  };

  const handleSetActive = async (id: string, name: string) => {
    await setActiveChild(id);
    await loadChildren();
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">ניהול ילדים</h2>
          <p className="text-neutral-500 font-bold mt-1">נהל את הפרופילים של הילדים והגדר את הילד הפעיל</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditing(null);
              setFormData({ name: '', avatar: '👶', age: '', grade: '' });
            }}
            className="group flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl text-lg font-black shadow-[0_8px_0_0_#4338ca] active:translate-y-2 active:shadow-none transition-all"
          >
            <Plus className="w-6 h-6 transform group-hover:rotate-90 transition-transform" />
            <span>הוסף ילד</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-neutral-100 p-8 md:p-10 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-neutral-800">{editing ? 'עריכת פרופיל' : 'פרופיל חדש'}</h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">שם הילד</label>
                <div className="relative">
                  <Baby className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-6 pr-12 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800"
                    placeholder="לדוגמה: עופר"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">בחירת דמות (אימוג'י)</label>
                <div className="bg-neutral-50 p-4 rounded-3xl border-2 border-neutral-50 grid grid-cols-5 gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: emoji })}
                      className={`
                        w-12 h-12 flex items-center justify-center text-2xl rounded-xl transition-all
                        ${formData.avatar === emoji
                          ? 'bg-white shadow-md scale-110 border-2 border-indigo-500'
                          : 'hover:bg-white/50 hover:scale-105'
                        }
                      `}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">גיל</label>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      className="w-full pl-3 pr-11 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800"
                      placeholder="7"
                      min="1"
                      max="18"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-neutral-500 mb-2 mr-1">כיתה</label>
                  <div className="relative">
                    <GraduationCap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-300" />
                    <input
                      type="text"
                      value={formData.grade}
                      onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                      className="w-full pl-3 pr-11 py-4 bg-neutral-50 border-2 border-neutral-50 rounded-2xl focus:border-indigo-500 focus:bg-white focus:outline-none transition-all font-bold text-neutral-800"
                      placeholder="ב'"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center h-full bg-indigo-50/30 rounded-3xl p-6 border-2 border-dashed border-indigo-100">
                <div className="text-5xl mb-3 animate-bounce-subtle">{formData.avatar}</div>
                <div className="text-lg font-black text-neutral-800">{formData.name || 'שם הילד'}</div>
                <div className="text-xs font-bold text-indigo-400 mt-1 uppercase tracking-wider">תצוגה מקדימה</div>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditing(null); }}
                className="flex-1 px-8 py-4 bg-neutral-100 text-neutral-600 rounded-2xl font-black hover:bg-neutral-200 transition-all active:scale-95"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-[0_8px_0_0_#4338ca] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center gap-2 group"
              >
                <Check className="w-6 h-6 group-hover:scale-125 transition-transform" />
                <span>שמור פרופיל</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((child) => {
          const isActive = child.isActive; // Assuming you might add this or handle it via a parent ID check
          // In the current schema, isActive is determined by ParentAccount.lastActiveChildId
          // But here we can check if it's the one currently active.

          return (
            <div
              key={child.id}
              className={`
                group bg-white rounded-[2rem] p-6 flex flex-col items-center gap-6 border-b-8 transition-all duration-300 relative overflow-hidden
                ${child.isActive
                  ? 'border-green-500 shadow-lg shadow-green-100 scale-[1.02] z-10'
                  : 'border-neutral-100 hover:border-indigo-200 shadow-sm hover:shadow-md'
                }
              `}
            >
              {child.isActive && (
                <div className="absolute top-0 right-0 left-0 h-1.5 bg-green-500 animate-pulse"></div>
              )}

              <div className="flex items-center gap-6 w-full">
                <div className={`
                  w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-inner relative
                  ${child.isActive ? 'bg-green-50 animate-bounce-subtle' : 'bg-neutral-50'}
                `}>
                  {child.avatar || '👶'}
                  {child.isActive && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 border-4 border-white shadow-sm">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-xl font-black text-neutral-800">{child.name}</h3>
                  <div className="flex flex-wrap gap-x-4 mt-1">
                    {child.age && (
                      <div className="flex items-center gap-1.5 text-sm text-neutral-400 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>גיל {child.age}</span>
                      </div>
                    )}
                    {child.grade && (
                      <div className="flex items-center gap-1.5 text-sm text-neutral-400 font-bold">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>כיתה {child.grade}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full">
                <button
                  onClick={() => handleSetActive(child.id, child.name)}
                  disabled={child.isActive}
                  className={`
                    flex flex-col items-center justify-center gap-1 py-3 rounded-2xl transition-all font-black text-xs
                    ${child.isActive
                      ? 'bg-green-50 text-green-600 border border-green-100'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100'
                    }
                  `}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{child.isActive ? 'פעיל' : 'הפוך לפעיל'}</span>
                </button>
                <button
                  onClick={() => handleEdit(child)}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border border-neutral-100 transition-all font-black text-xs"
                >
                  <Pencil className="w-4 h-4" />
                  <span>ערוך</span>
                </button>
                <button
                  onClick={() => handleDelete(child.id, child.name)}
                  className="flex flex-col items-center justify-center gap-1 py-3 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 border border-red-100 transition-all font-black text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>מחק</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {children.length === 0 && !showForm && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-neutral-100">
          <Baby className="w-16 h-16 text-neutral-200 mx-auto mb-4" />
          <h3 className="text-xl font-black text-neutral-400">עדיין אין ילדים רשומים</h3>
          <p className="text-neutral-300 font-bold mt-2">לחץ על "הוסף ילד" כדי להתחיל</p>
        </div>
      )}
    </div>
  );
}
