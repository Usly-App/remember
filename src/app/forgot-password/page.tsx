'use client';

import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NoddicLogo } from '@/components/logo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center justify-center px-6 py-12">
      {/* Background graphic */}
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
          <line x1="250" y1="250" x2="160" y2="150" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="340" y2="160" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="180" y2="360" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
          <line x1="250" y1="250" x2="350" y2="340" stroke="#3525cd" strokeWidth="0.8" opacity="0.35" />
        </svg>
      </div>

      {/* Header text */}
      <div className="text-center z-10 mb-8">
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-primary tracking-tight mb-3">
          Reset your password.
        </h1>
        <p className="text-on-surface-variant text-lg max-w-md mx-auto">
          Enter your email and we&apos;ll send you a link to get back in.
        </p>
      </div>

      {/* Form card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#fcf9f8]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-surface-container-high p-8 page-enter">
          <div className="mb-6">
            <NoddicLogo />
          </div>

          {!sent ? (
            <>
              <form onSubmit={handleReset} className="space-y-4">
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
                    autoFocus
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
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-on-surface-variant">
                Remember your password?{' '}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-headline font-bold text-lg text-on-surface mb-2">
                Check your email
              </h3>
              <p className="text-on-surface-variant text-sm mb-6">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-semibold text-on-surface">{email}</span>.
                It may take a minute to arrive.
              </p>
              <Link
                href="/login"
                className="text-primary font-headline font-semibold text-sm hover:underline"
              >
                Back to login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
