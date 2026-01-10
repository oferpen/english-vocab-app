'use client';

import { useState, useEffect } from 'react';
import { getAllChildren, createChild, updateChild, deleteChild, setActiveChild } from '@/app/actions/children';
import { useRouter } from 'next/navigation';

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

  const handleDelete = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק ילד זה?')) {
      await deleteChild(id);
      loadChildren();
      router.refresh();
    }
  };

  const handleSetActive = async (id: string) => {
    const child = children.find(c => c.id === id);
    await setActiveChild(id);
    await loadChildren();
    // Show success message
    const message = child 
      ? `${child.name} הוגדר/ה כפעיל/ה`
      : 'ילד/ה הוגדר/ה כפעיל/ה';
    alert(message);
    router.refresh();
  };

  if (loading) {
    return <div className="p-4 text-center">טוען...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">ניהול ילדים</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ name: '', avatar: '👶', age: '', grade: '' });
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + הוסף ילד
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-4">
          <h3 className="text-xl font-bold mb-4">{editing ? 'ערוך ילד' : 'הוסף ילד'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">שם</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">אימוג'י</label>
              <input
                type="text"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                className="w-full p-2 border rounded-lg text-2xl text-center"
                maxLength={2}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">גיל</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-2 border rounded-lg"
                min="1"
                max="18"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">כיתה</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full p-2 border rounded-lg"
                placeholder="א'"
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

      <div className="space-y-3">
        {children.map((child) => (
          <div
            key={child.id}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{child.avatar || '👶'}</span>
              <div>
                <div className="font-bold text-lg">{child.name}</div>
                {child.age && <div className="text-sm text-gray-600">גיל: {child.age}</div>}
                {child.grade && <div className="text-sm text-gray-600">כיתה: {child.grade}</div>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetActive(child.id)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
              >
                פעיל
              </button>
              <button
                onClick={() => handleEdit(child)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                ערוך
              </button>
              <button
                onClick={() => handleDelete(child.id)}
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
