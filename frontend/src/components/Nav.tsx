'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth'; // Import the auth store

const links = [
  { href: '/', label: 'Home' },
  { href: '/courses', label: 'Courses' },
  { href: '/dashboard', label: 'Dashboard' },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  // --- THIS IS THE FIX ---
  // We must select each piece of state individually
  // to avoid the "infinite loop" error.
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const ready = useAuth((s) => s.ready);
  // --- END FIX ---

  const handleLogout = () => {
    logout();
    router.push('/'); // Go to home page after logout
  };

  return (
    <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/" className="font-semibold">LearnFlow</Link>
        <ul className="flex items-center gap-4">
          
          {/* Map over the standard links */}
          {links.map((l) => {
            const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`px-3 py-1.5 rounded ${
                    active ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}

          {/* Conditionally show Login or Logout */}
          {/* Only render auth status when store is 'ready' */}
          {ready && (
            <>
              {user ? (
                // --- If logged IN ---
                <>
                  <li className="text-sm text-gray-500">
                    Hello, {user.username}
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1.5 rounded text-zinc-700 hover:bg-zinc-100"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                // --- If logged OUT ---
                <li>
                  <Link
                    href="/login"
                    className={`px-3 py-1.5 rounded ${
                      pathname === '/login' ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    Login
                  </Link>
                </li>
              )}
            </>
          )}

        </ul>
      </nav>
    </header>
  );
}