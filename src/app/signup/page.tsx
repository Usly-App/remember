'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push('/map');
  };

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md page-enter">
          <Link
            href="/"
            className="font-headline font-bold text-2xl text-on-surface tracking-tight mb-2 block"
          >
            Remember
          </Link>
          <p className="text-on-surface-variant mb-10">
            Create your account and start mapping.
          </p>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-headline font-semibold text-on-surface mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="How should we greet you?"
                required
              />
            </div>
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
                placeholder="At least 6 characters"
                minLength={6}
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
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* Right — decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center silk-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 500 500" className="w-full h-full">
            <circle cx="250" cy="250" r="120" fill="none" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
            <circle cx="250" cy="250" r="200" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 8" />
            <circle cx="250" cy="250" r="8" fill="white" />
            <circle cx="160" cy="170" r="5" fill="white" opacity="0.6" />
            <circle cx="340" cy="180" r="5" fill="white" opacity="0.6" />
            <circle cx="200" cy="350" r="5" fill="white" opacity="0.6" />
            <circle cx="330" cy="330" r="5" fill="white" opacity="0.6" />
            <line x1="250" y1="250" x2="160" y2="170" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="250" y1="250" x2="340" y2="180" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="250" y1="250" x2="200" y2="350" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="250" y1="250" x2="330" y2="330" stroke="white" strokeWidth="0.8" opacity="0.3" />
          </svg>
        </div>
        <div className="text-center text-white z-10 px-12">
          <h2 className="font-headline font-extrabold text-4xl mb-4 tracking-tight">
            Map your world.
          </h2>
          <p className="opacity-80 text-lg max-w-sm mx-auto">
            Every person, every place, every connection — beautifully woven into your personal map.
          </p>
        </div>
      </div>
    </div>
  );
}
