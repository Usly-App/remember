import Link from 'next/link';
import { NoddicLogo } from '@/components/logo';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-xl shadow-[0_24px_24px_rgba(28,27,27,0.04)]">
        <nav className="flex justify-between items-center px-6 md:px-10 py-4 max-w-[1440px] mx-auto">
          <NoddicLogo />
          <Link
            href="/"
            className="text-on-surface/70 font-headline font-medium hover:text-primary transition-colors text-sm"
          >
            Back to home
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 page-enter">
        <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-on-surface-variant text-sm mb-12">
          Last updated: March 2026
        </p>

        <div className="prose prose-lg max-w-none text-on-surface-variant space-y-8">
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              What we collect
            </h2>
            <p className="leading-relaxed">
              Noddic collects the minimum data needed to provide the service: your email address,
              display name, and the nodes you create within your map. All map data is private
              to your account and is never shared with third parties.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              How we store your data
            </h2>
            <p className="leading-relaxed">
              Your data is stored securely using Supabase (built on PostgreSQL) with row-level
              security policies ensuring that only you can access your own data. Passwords are
              hashed and never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Your rights
            </h2>
            <p className="leading-relaxed">
              You can export or delete all of your data at any time from the Settings page.
              When you delete your data, it is permanently removed from our servers. You may
              also delete your entire account by contacting us.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Cookies
            </h2>
            <p className="leading-relaxed">
              Noddic uses essential cookies only — for authentication and session management.
              We do not use tracking cookies, advertising cookies, or any third-party analytics.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Contact
            </h2>
            <p className="leading-relaxed">
              If you have questions about this policy, please contact us at{' '}
              <a href="mailto:hello@noddic.com" className="text-primary hover:underline">
                hello@noddic.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-surface border-t border-surface-container">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto gap-6 w-full py-10 px-6 md:px-10">
          <NoddicLogo size="small" />
          <div className="flex flex-wrap justify-center gap-8">
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Privacy Policy
            </span>
            <Link href="/terms" className="text-xs uppercase tracking-widest text-on-surface/40 hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
          <div className="text-xs uppercase tracking-widest text-on-surface/40">
            © 2026 Noddic
          </div>
        </div>
      </footer>
    </div>
  );
}