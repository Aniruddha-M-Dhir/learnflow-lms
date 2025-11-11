'use client';

import { useState, useEffect, type FormEvent } from 'react'; // <-- FIX 1: 'type FormEvent'
import { useParams, useRouter }from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link'; 
import { useAuth } from '@/store/auth'; // <-- Import useAuth

type Chapter = {
  id: number;
  title: string;
  is_public: boolean;
  course: number;
};

type Course = {
  id: number;
  title: string;
};

export default function ManageCoursePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  // --- FIX 2: Select auth state individually ---
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  // --- END FIX ---

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [error, setError] = useState('');

  const [newTitle, setNewTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    // Wait for auth to be ready
    if (!id || !ready) return;

    const courseId = Number(id);

    const fetchCourse = async () => {
      try {
        const res = await api(`/api/courses/${id}/`);
        if (!res.ok) throw new Error(`Failed to load course: ${res.status}`);
        setCourse(await res.json());
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchChapters = async () => {
      try {
        const res = await api(`/api/chapters/`);
        if (!res.ok) throw new Error(`Failed to load chapters: ${res.status}`);
        const data = await res.json();
        const allChapters: Chapter[] = data.results ?? [];
        const courseChapters = allChapters.filter(ch => ch.course === courseId);
        setChapters(courseChapters);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchCourse();
    fetchChapters();
  }, [id, ready]); // Add 'ready' to dependency array

  const handleCreateChapter = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!course) return;

    try {
      const res = await api('/api/chapters/', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          is_public: isPublic,
          course: course.id,
          content: '[]', // Start with empty JSON string content
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }

      const newChapter = await res.json();
      setChapters([...chapters, newChapter]);
      setNewTitle('');

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;
  
  // Wait for both auth and course to be ready
  if (!ready || !course) {
    return <p>Loading course...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Manage: {course.title}</h1>
      <p className="mb-6 text-gray-600">Here you can create and edit your chapters.</p>

      <h2 className="text-xl font-semibold mb-4">Chapters</h2>
      <ul className="space-y-2 mb-8">
        {chapters.length > 0 ? (
          chapters.map(ch => (
            <li key={ch.id} className="flex justify-between items-center p-4 bg-white border rounded shadow-sm">
              <div>
                <span className="font-medium">{ch.title}</span>
                <span className={`ml-3 text-sm px-2 py-0.5 rounded ${
                  ch.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {ch.is_public ? 'Public' : 'Private'}
                </span>
              </div>
              
              <Link 
                href={`/instructor/chapters/${ch.id}/edit`} 
                className="text-sm text-blue-600 hover:underline"
              >
                Edit Content
              </Link>
            </li>
          ))
        ) : (
          <p className="text-gray-500">This course has no chapters yet.</p>
        )}
      </ul>

      {/* "Create Chapter" form */}
      <form onSubmit={handleCreateChapter} className="p-4 bg-white border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Chapter</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="space-y-3">
          <input
            className="w-full border rounded p-2"
            placeholder="Chapter Title (e.g., Introduction)"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_public"
              className="h-4 w-4 rounded"
              checked={isPublic}
              onChange={e => setIsPublic(e.target.checked)}
            />
            <label htmlFor="is_public" className="ml-2">
              Mark as Public (Students can see this)
            </label>
          </div>
          <button type="submit" className="px-4 py-2 bg-black text-white rounded">
            Create Chapter
          </button>
        </div>
      </form>
    </div>
  );
}