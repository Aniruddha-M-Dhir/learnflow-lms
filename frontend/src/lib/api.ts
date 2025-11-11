'use client';

import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './auth';

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? ''; 
// Keep BASE = '' if you're using Next.js rewrites to /api/* -> Django

async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const r = await fetch(`${BASE}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!r.ok) {
    clearTokens();
    return null;
  }
  const data = await r.json(); // { access: '...' }
  if (data?.access) {
    saveTokens(data.access);
    return data.access as string;
  }
  return null;
}




export async function api(path: string, init: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  const headers = new Headers(init.headers || {});
  const access = getAccessToken();

  if (access) headers.set('Authorization', `Bearer ${access}`);
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  let res = await fetch(url, { ...init, headers });

  // If unauthorized, try one refresh then retry once
  if (res.status === 401) {
    const newAccess = await refreshToken();
    if (newAccess) {
      headers.set('Authorization', `Bearer ${newAccess}`);
      res = await fetch(url, { ...init, headers });
    }
  }

  return res;
}
