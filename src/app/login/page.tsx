'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NoddicLogo } from '@/components/logo';

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
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center px-6 py-12">
      {/* Background graphic — blue version on white */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 500 500" className="w-[1400px] h-[1400px] opacity-[0.15]">
          <circle cx="250" cy="250" r="80" fill="none" stroke="#3525cd" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="250" cy="250" r="140" fill="none" stroke="#3525cd" strokeWidth="0.8" strokeDasharray="5 7" />
          <circle cx="250" cy="250" r="210" fill="none" stroke="#3525cd" strokeWidth="0.5" strokeDasharray="4 8" />
          <circle cx="250" cy="250" r="10" fill="#3525cd" />
          <circle cx="160" cy="150" r="6" fill="#3525cd" opacity="0.7" />
          <circle cx="340" cy="160" r="6" fill="#3525cd" opacity="0.7" />
          <circle cx="180" cy="360" r="6" fill="#3525cd" opacity="0.7" />
          <circle cx="350" cy="340" r="6" fill="#3525cd" opacity="0.7" />
          <circle cx="110" cy="260" r="5" fill="#3525cd" opacity="0.5" />
          <circle cx="390" cy="270" r="5" fill="#3525cd" opacity="0.5" />
          <circle cx="250" cy="110" r="5" fill="#3525cd" opacity="0.5" />
          <circle cx="260" cy="390" r="5" fill="#3525cd" opacity="0.5" />
          <line x1="250" y1="250" x2="160" y2="150" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="340" y2="160" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="180" y2="360" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="350" y2="340" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="110" y2="260" stroke="#3525cd" strokeWidth="0.6" opacity="0.25" />
          <line x1="250" y1="250" x2="390" y2="270" stroke="#3525cd" strokeWidth="0.6" opacity="0.25" />
          <line x1="160" y1="150" x2="110" y2="260" stroke="#3525cd" strokeWidth="0.4" opacity="0.15" />
          <line x1="340" y1="160" x2="390" y2="270" stroke="#3525cd" strokeWidth="0.4" opacity="0.15" />
        </svg>
      </div>

      {/* Header text — blue on white */}
      <div className="text-center z-10 mb-8">
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-primary tracking-tight mb-3">
          Welcome back.
        </h1>
        <p className="text-on-surface-variant text-lg max-w-md mx-auto">
          Your map is waiting — pick up right where you left off.
        </p>
      </div>

      {/* Form card — glass style popping off the background */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#fcf9f8]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-surface-container-high p-8 page-enter">
          <div className="mb-6">
            <NoddicLogo />
            <p className="text-on-surface-variant text-sm mt-2">
              Log in to your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
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

          <p className="mt-6 text-center text-sm text-on-surface-variant">
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
