import Link from 'next/link';
import { NoddicLogo } from '@/components/logo';

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-on-surface-variant text-sm mb-12">
          Last updated: March 2026
        </p>

        <div className="prose prose-lg max-w-none text-on-surface-variant space-y-8">
          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Acceptance of terms
            </h2>
            <p className="leading-relaxed">
              By creating an account or using Noddic, you agree to these terms. If you do not
              agree, please do not use the service.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              The service
            </h2>
            <p className="leading-relaxed">
              Noddic is a personal mind-mapping tool for remembering people and places. We
              provide the platform as-is and make no guarantees about uptime or availability,
              though we do our best to keep things running smoothly.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Your content
            </h2>
            <p className="leading-relaxed">
              You own everything you put into Noddic. We do not claim any rights to your
              data, nodes, or maps. You grant us only the permissions needed to store and
              display your content back to you.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Acceptable use
            </h2>
            <p className="leading-relaxed">
              You agree not to use Noddic for anything illegal, harmful, or abusive. We
              reserve the right to suspend accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Account termination
            </h2>
            <p className="leading-relaxed">
              You can delete your account and all associated data at any time. We may also
              terminate accounts that violate these terms, with notice where possible.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Liability
            </h2>
            <p className="leading-relaxed">
              Noddic is provided &quot;as is&quot; without warranties of any kind. We are not
              liable for any data loss, damages, or issues arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Changes to terms
            </h2>
            <p className="leading-relaxed">
              We may update these terms from time to time. Continued use of Noddic after
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="font-headline font-bold text-xl text-on-surface mb-3">
              Contact
            </h2>
            <p className="leading-relaxed">
              Questions? Reach us at{' '}
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
            <Link href="/privacy" className="text-xs uppercase tracking-widest text-on-surface/40 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">
              Terms of Service
            </span>
          </div>
          <div className="text-xs uppercase tracking-widest text-on-surface/40">
            © 2026 Noddic
          </div>
        </div>
      </footer>
    </div>
  );
}