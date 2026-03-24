'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/map');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center silk-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <circle cx="250" cy="250" r="120" fill="none" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="250" cy="250" r="200" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 8" />
            <circle cx="250" cy="250" r="8" fill="white" />
            <circle cx="130" cy="200" r="5" fill="white" opacity="0.6" />
            <circle cx="370" cy="210" r="5" fill="white" opacity="0.6" />
            <circle cx="220" cy="380" r="5" fill="white" opacity="0.6" />
            <circle cx="350" cy="350" r="5" fill="white" opacity="0.6" />
            <circle cx="180" cy="120" r="4" fill="white" opacity="0.4" />
            <line x1="250" y1="250" x2="130" y2="200" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="250" y1="250" x2="370" y2="210" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="250" y1="250" x2="220" y2="380" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="250" y1="250" x2="350" y2="350" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="130" y1="200" x2="180" y2="120" stroke="white" strokeWidth="0.5" opacity="0.2" />
          </svg>
        </div>
        <div className="text-center text-white z-10 px-12">
          <h2 className="font-headline font-extrabold text-4xl mb-4 tracking-tight">
            Welcome back.
          </h2>
          <p className="opacity-80 text-lg max-w-sm mx-auto">
            Your map is waiting — pick up right where you left off.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md page-enter">
          <Link
            href="/"
            className="font-headline font-bold text-2xl text-on-surface tracking-tight mb-2 block"
          >
            Remember
          </Link>
          <p className="text-on-surface-variant mb-10">
            Log in to your account.
          </p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-headline font-semibold text-on-surface mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-headline font-semibold text-on-surface mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="Your password"
                required
              />
            </div>

            {error && (
              <p className="text-error text-sm font-body">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full silk-gradient text-white py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? 'Logging in…' : 'Log In'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
