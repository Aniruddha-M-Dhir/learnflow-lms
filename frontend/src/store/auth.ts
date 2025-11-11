// src/store/auth.ts
import { create } from 'zustand';
// FIX: We need functions from 'lib/api' AND 'lib/auth'
import { api } from '@/lib/api';
import { saveTokens, clearTokens, getAccessToken } from '@/lib/auth';

type Role = 'instructor' | 'student' | null;
type User = { id: number; username: string; role: Role } | null;

type AuthState = {
  user: User;
  ready: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => Promise<void>;
};

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false, // This starts as 'false' on a new tab

  login: async (username, password) => {
    // This login function is correct
    const res = await fetch(`${BASE}/api/token/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) throw new Error('Invalid credentials');
    const { access, refresh } = await res.json();
    saveTokens(access, refresh); // Save tokens to localStorage

    const me = await api('/api/me/');
    if (!me.ok) throw new Error('Failed to fetch user profile');
    
    const user = await me.json();
    set({ user, ready: true }); // Set user and mark as ready
  },

  logout: () => {
    clearTokens(); // Clear localStorage
    set({ user: null, ready: true });
  },

  // --- THIS IS THE FIX FOR THE "NEW TAB" PROBLEM ---
  hydrate: async () => {
    // 1. Check if a token exists in localStorage
    const token = getAccessToken();

    if (token) {
      // 2. If token exists, validate it by fetching the user
      try {
        const me = await api('/api/me/');
        if (me.ok) {
          // 3. If token is valid, set the user
          set({ user: await me.json() });
        } else {
          // 4. If token is invalid (expired), clear it
          set({ user: null });
          clearTokens();
        }
      } catch (e) {
        // Network error, etc.
        set({ user: null });
        clearTokens();
      }
    }
    // 5. Mark the app as 'ready' so it can show the page
    set({ ready: true });
  },
  // --- END FIX ---
}));