'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Editor from '@/components/Editor'; // <-- default export
import type { Value } from 'platejs';

type Chapter = {
  id: number;
  title: string;
  content: string; // JSON string from the DB
  course: number;
};

export default function EditChapterPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [content, setContent] = useState<Value>([]); // Plate value
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Loading...');

  // 1) Fetch chapter data
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await api(`/api/chapters/${id}/`);
        if (!res.ok) throw new Error(`Failed to load chapter: ${res.status}`);
        const data: Chapter = await res.json();
        setChapter(data);
        setStatus('Loaded');
      } catch (err: any) {
        setError(err.message || 'Failed to load');
        setStatus('Error');
      }
    })();
  }, [id]);

  // 2) Save handler
  const handleSave = async () => {
    if (!id) return;
    setStatus('Saving...');
    try {
      const res = await api(`/api/chapters/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: JSON.stringify(content), // store as JSON string
        }),
      });

      if (!res.ok) {
        let errMsg = `Save failed: ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = JSON.stringify(errData);
        } catch {}
        throw new Error(errMsg);
      }

      setStatus('Saved!');
      if (chapter) {
        router.push(`/instructor/courses/${chapter.course}`);
      }
    } catch (err: any) {
      setError(err.message || 'Save failed');
      setStatus('Error');
    }
  };

  // 3) If you want local state initialized from DB content (optional)
  useEffect(() => {
    if (chapter?.content) {
      try {
        const parsed = JSON.parse(chapter.content) as Value;
        setContent(parsed);
      } catch {
        setContent([{ type: 'p', children: [{ text: chapter.content }] }]);
      }
    }
  }, [chapter]);

  if (status === 'Loading...') return <p>{status}</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Edit: {chapter?.title}</h1>

      <div className="rounded-lg bg-white p-6 shadow-md">
        {chapter?.content != null && (
          <Editor
            initialValue={chapter.content} // pass the DB JSON string
            onChange={(newValue) => setContent(newValue)}
          />
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={status === 'Saving...'}
        className="mt-4 rounded bg-black px-6 py-2 text-white disabled:bg-gray-400"
      >
        {status === 'Saving...' ? 'Saving...' : 'Save and Close'}
      </button>
      {status === 'Saved!' && <span className="ml-4 text-green-600">Saved!</span>}
    </div>
  );
}
