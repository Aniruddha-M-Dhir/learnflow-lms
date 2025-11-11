'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/store/auth';

type Course = { id: number; title: string; description: string };

export default function CoursesPage() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [err, setErr] = useState<string>(''); // Keep error state for debugging
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api('/api/courses/');
        if (!res.ok) { 
          setErr(`Request failed: ${res.status}`); // Still set error, but won't be displayed as red text below
          return; 
        }
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setCourses(list);
        setErr(''); // Clear any previous error on success
      } catch (e: any) {
        setErr(e.message || 'Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  if (!ready) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Courses</h1>
        <p className="mt-2">
          Please <Link href="/login" className="text-blue-600 hover:underline">log in</Link> to view courses.
        </p>
      </div>
    );
  }
  
  // This part is for logged-in users only
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Courses</h1>
      
      {/* Check if still loading */}
      {isLoading && <p>Loading courses...</p>}

      {/* If loading is complete, check the result */}
      {!isLoading && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {courses.length > 0 ? (
            // Display courses
            courses.map((c) => (
              <li key={c.id} className="border rounded p-4 bg-white">
                <h2 className="font-medium">{c.title}</h2>
                <p className="text-sm text-gray-600">{c.description}</p>
                <Link href={`/courses/${c.id}`} className="text-blue-600 mt-2 inline-block">
                  View
                </Link>
              </li>
            ))
          ) : (
            // Display the custom message when no courses are found (or fetch failed)
            <li className="text-gray-500">
              There are no courses uploaded yet.
            </li>
          )}
        </ul>
      )}
    </div>
  );
}