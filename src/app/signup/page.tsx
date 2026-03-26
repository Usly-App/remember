'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NoddicLogo } from '@/components/logo';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const showMismatch = confirmPassword.length > 0 && !passwordsMatch;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

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
    <div className="min-h-screen silk-gradient relative overflow-hidden flex flex-col items-center justify-center px-6 py-12">
      {/* Background graphic — enlarged */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg viewBox="0 0 500 500" className="w-[1400px] h-[1400px] opacity-[0.2]">
          <circle cx="250" cy="250" r="80" fill="none" stroke="white" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="250" cy="250" r="140" fill="none" stroke="white" strokeWidth="0.8" strokeDasharray="5 7" />
          <circle cx="250" cy="250" r="210" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 8" />
          <circle cx="250" cy="250" r="10" fill="white" />
          <circle cx="160" cy="150" r="6" fill="white" opacity="0.7" />
          <circle cx="340" cy="160" r="6" fill="white" opacity="0.7" />
          <circle cx="180" cy="360" r="6" fill="white" opacity="0.7" />
          <circle cx="350" cy="340" r="6" fill="white" opacity="0.7" />
          <circle cx="110" cy="260" r="5" fill="white" opacity="0.5" />
          <circle cx="390" cy="270" r="5" fill="white" opacity="0.5" />
          <circle cx="250" cy="110" r="5" fill="white" opacity="0.5" />
          <circle cx="260" cy="390" r="5" fill="white" opacity="0.5" />
          <line x1="250" y1="250" x2="160" y2="150" stroke="white" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="340" y2="160" stroke="white" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="180" y2="360" stroke="white" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="350" y2="340" stroke="white" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="110" y2="260" stroke="white" strokeWidth="0.6" opacity="0.25" />
          <line x1="250" y1="250" x2="390" y2="270" stroke="white" strokeWidth="0.6" opacity="0.25" />
          <line x1="160" y1="150" x2="110" y2="260" stroke="white" strokeWidth="0.4" opacity="0.15" />
          <line x1="340" y1="160" x2="390" y2="270" stroke="white" strokeWidth="0.4" opacity="0.15" />
        </svg>
      </div>

      {/* Header text */}
      <div className="text-center z-10 mb-8">
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-white tracking-tight mb-3">
          Map your world.
        </h1>
        <p className="text-white/70 text-lg max-w-md mx-auto">
          Every person, every place, every connection — beautifully woven into your personal map.
        </p>
      </div>

      {/* Floating glass form card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/40 p-8 page-enter">
          <div className="mb-6">
            <NoddicLogo />
            <p className="text-on-surface-variant text-sm mt-2">
              Create your account and start mapping.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Your name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="How should we greet you?"
                required
              />
            </div>
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
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-white text-on-surface font-body focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                placeholder="At least 6 characters"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-headline font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-on-surface font-body focus:outline-none focus:ring-2 transition ${
                  showMismatch
                    ? 'border-error focus:ring-error/30 focus:border-error'
                    : confirmPassword.length > 0 && passwordsMatch
                    ? 'border-[#059669] focus:ring-[#059669]/30 focus:border-[#059669]'
                    : 'border-outline-variant focus:ring-primary/30 focus:border-primary'
                }`}
                placeholder="Re-enter your password"
                minLength={6}
                required
              />
              {showMismatch && (
                <p className="text-error text-xs font-body mt-1">Passwords do not match</p>
              )}
              {confirmPassword.length > 0 && passwordsMatch && (
                <p className="text-[#059669] text-xs font-body mt-1">Passwords match</p>
              )}
            </div>

            {error && (
              <p className="text-error text-sm font-body">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || showMismatch}
              className="w-full silk-gradient text-white py-3.5 rounded-xl font-headline font-bold text-base shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}