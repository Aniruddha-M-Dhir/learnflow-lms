'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';

export default function LoginPage() {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const login = useAuth(s => s.login);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');

    // --- NEW DEBUGGING STEP ---
    // Check your browser's console to make sure this is what you expect.
    console.log('Attempting login with:', { username: u, password: p });
    // --- END DEBUGGING STEP ---

    try {
      await login(u, p);
      router.push('/courses'); // default after login
    } catch (e: any) {
      setErr(e.message || 'Login failed');
    }
  };

  return (
    <main className="max-w-sm mx-auto pt-24">
      <h1 className="text-2xl font-semibold mb-6">Login</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Username"
          value={u}
          onChange={e => setU(e.target.value)}
        />
        <input
          className="w-full border rounded p-2"
          placeholder="Password"
          type="password"
          value={p}
          onChange={e => setP(e.target.value)}
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button className="px-4 py-2 bg-black text-white rounded">Sign in</button>
      </form>
    </main>
  );
}