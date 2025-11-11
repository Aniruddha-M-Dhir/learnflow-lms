'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth'; 

type Chapter = {
  id: number;
  title: string;
  is_public: boolean;
  course: number;
};
type Course = {
  id: number;
  title: string;
  description: string;
};
type Enrollment = {
  id: number;
  course: number;
  user: number;
};

export default function CourseDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  
  // FIX: Select state individually to avoid infinite loop
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);

  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [joined, setJoined] = useState(false);
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // This useEffect fetches all data
  useEffect(() => {
    if (!id || !ready) return;
    
    const courseId = Number(id);
    
    const fetchData = async () => {
      try {
        // 1. Get course details
        const courseRes = await api(`/api/courses/${id}/`);
        if (!courseRes.ok) throw new Error(`Failed to load course: ${courseRes.status}`);
        setCourse(await courseRes.json());

        // 2. Get chapters
        const chapRes = await api(`/api/chapters/`);
        if (chapRes.ok) {
          const chapData = await chapRes.json();
          const allChapters: Chapter[] = chapData.results ?? [];
          const publicChapters = allChapters.filter(ch => ch.course === courseId && ch.is_public);
          setChapters(publicChapters);
        }

        // 3. Check enrollment
        if (user) { 
          const enrRes = await api('/api/enrollments/');
          if (enrRes.ok) {
            const enrData = await enrRes.json();
            const enrollments: Enrollment[] = enrData.results ?? [];
            const isEnrolled = enrollments.some(enr => enr.course === courseId);
            setJoined(isEnrolled);
          }
        }
        
      } catch (e: any) {
        setErr(e.message || 'Error loading page');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
  }, [id, user, ready]); 


  const join = async () => {
    if (joined) return; 
    setErr(''); 
    
    const res = await api(`/api/enrollments/`, { 
      method: 'POST',
      body: JSON.stringify({
        course: Number(id)
      })
    });
    if (res.ok) {
      setJoined(true);
    } else {
      setErr("Failed to join. You may already be enrolled.");
    }
  };

  if (isLoading || !ready) {
    return <p className="p-8">Loading...</p>;
  }

  if (err) return <p className="p-8 text-red-600">{err}</p>;
  if (!course) return <p className="p-8">Course not found.</p>;
  
  return (
    <div>
      <h1 className="text-2xl font-semibold">{course.title}</h1>
      <p className="text-gray-600 mb-4">{course.description}</p>

      <button 
        onClick={join} 
        disabled={!ready || joined}
        className="px-3 py-1.5 bg-black text-white rounded disabled:bg-gray-400"
      >
        {joined ? 'Joined' : 'Join course'}
      </button>

      <h2 className="text-xl font-semibold mt-8 mb-2">Public Chapters</h2>
      <ul className="space-y-2">
        {chapters.map(ch => (
          <li key={ch.id}>
            <a className="text-blue-600" href={`/chapters/${ch.id}`}>{ch.title}</a>
          </li>
        ))}
        {chapters.length === 0 && (
          <li className="text-gray-500">No public chapters yet.</li>
        )}
      </ul>
    </div>
  );
}