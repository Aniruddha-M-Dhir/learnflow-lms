'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAuth } from '@/store/auth';
import Link from 'next/link';
import { api } from '@/lib/api';

type Course = {
  id: number;
  title: string;
  code: string;
  description: string; // Added description for student view
  instructor: number;
};

// --- NEW: Add a type for our enrollments ---
type Enrollment = {
  id: number;
  course: number;
  user: number;
};

// This is the (working) component for instructors
function InstructorDashboard() {
  const user = useAuth((s) => s.user);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!user) return;
    const fetchCourses = async () => {
      try {
        const res = await api(`/api/courses/?search=${user.username}`);
        if (!res.ok) throw new Error('Failed to fetch courses');
        const data = await res.json();
        const allCourses: Course[] = data.results ?? [];
        setMyCourses(allCourses);
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchCourses();
  }, [user]);

  const handleCreateCourse = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api('/api/courses/', {
        method: 'POST',
        body: JSON.stringify({ title, code, description }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(JSON.stringify(errData));
      }
      const newCourse = await res.json();
      setMyCourses([...myCourses, newCourse]);
      setTitle('');
      setCode('');
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Courses</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <ul className="space-y-2 mb-8">
        {myCourses.length > 0 ? (
          myCourses.map(course => (
            <li key={course.id}>
              <Link
                href={`/instructor/courses/${course.id}`}
                className="block p-4 bg-white border rounded shadow-sm hover:bg-gray-50"
              >
                <h3 className="font-medium">{course.title} ({course.code})</h3>
                <span className="text-sm text-blue-600">Manage Course & Chapters</span>
              </Link>
            </li>
          ))
        ) : (
          <p className="text-gray-500">You have not created any courses yet.</p>
        )}
      </ul>
      <form onSubmit={handleCreateCourse} className="p-4 bg-white border rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
        <div className="space-y-3">
          <input
            className="w-full border rounded p-2"
            placeholder="Course Title (e.g., Introduction to Python)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
          />
          <input
            className="w-full border rounded p-2"
            placeholder="Course Code (e.g., CS101)"
            value={code}
            onChange={e => setCode(e.target.value)}
            required
          />
          <textarea
            className="w-full border rounded p-2"
            placeholder="Course Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button type="submit" className="px-4 py-2 bg-black text-white rounded">
            Create Course
          </button>
        </div>
      </form>
    </div>
  );
}

// This is the component for students
function StudentDashboard() {
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        // 1. Get the user's enrollments
        const enrRes = await api('/api/enrollments/');
        if (!enrRes.ok) throw new Error('Could not fetch enrollments');
        const enrData = await enrRes.json();
        const enrollments: Enrollment[] = enrData.results ?? [];
        
        // 2. Get the list of course IDs they are enrolled in
        const enrolledCourseIds = new Set(enrollments.map(e => e.course));
        
        // 3. Get all courses
        const courseRes = await api('/api/courses/');
        if (!courseRes.ok) throw new Error('Could not fetch courses');
        const courseData = await courseRes.json();
        const allCourses: Course[] = courseData.results ?? [];

        // 4. Filter all courses to find the ones they are enrolled in
        const enrolledCourses = allCourses.filter(c => enrolledCourseIds.has(c.id));
        setMyCourses(enrolledCourses);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Enrolled Courses</h2>
      
      {isLoading && <p>Loading your courses...</p>}
      {error && <p className="text-red-600">{error}</p>}
      
      {!isLoading && myCourses.length > 0 && (
        <ul className="grid sm:grid-cols-2 gap-4">
          {myCourses.map(c => (
            <li key={c.id} className="border rounded p-4 bg-white">
              <h2 className="font-medium">{c.title}</h2>
              <p className="text-sm text-gray-600">{c.description}</p>
              <Link href={`/courses/${c.id}`} className="text-blue-600 mt-2 inline-block">
                View
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && myCourses.length === 0 && !error && (
        <p>You have not joined any courses yet.
          <Link href="/courses" className="text-blue-600 hover:underline ml-2">
            Browse all courses
          </Link>
        </p>
      )}
    </div>
  );
}


// Main Page Component (Modified)
export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const ready = useAuth((s) => s.ready);

  if (!ready) {
    return <p>Loading...</p>;
  }

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2">
          Please <Link href="/login" className="text-blue-600 hover:underline">log in</Link> to view your dashboard.
        </p>
      </div>
    );
  }


  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      {user.role === 'instructor' ? (
        <InstructorDashboard />
      ) : (
        <StudentDashboard />
      )}
    </div>
  );
}