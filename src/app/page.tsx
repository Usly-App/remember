import Link from 'next/link';
import { NoddicLogo } from '@/components/logo';

export default function HomePage() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-primary-fixed-dim selection:text-on-primary-fixed">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="sticky top-0 w-full z-50 bg-[#fcf9f8]/80 backdrop-blur-xl shadow-[0_24px_24px_rgba(28,27,27,0.04)]">
        <nav className="flex justify-between items-center px-6 md:px-10 py-4 max-w-[1440px] mx-auto">
          <NoddicLogo />
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-on-surface/70 font-headline font-medium hover:text-primary transition-colors text-sm"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="silk-gradient text-white px-6 py-2.5 rounded-full font-headline font-semibold text-sm active:scale-95 transition-transform shadow-lg"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden px-6 md:px-10 py-20 md:py-0">
          <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 z-10 text-center lg:text-left">
              <h1 className="font-headline font-extrabold text-6xl md:text-7xl lg:text-7xl tracking-tighter leading-[0.9] mb-8 text-on-surface">
                A better way to{' '}
                <br className="hidden md:block" />
                <span className="text-primary italic">remember</span>{' '}
                <br className="hidden md:block" />
                who and where.
              </h1>
              <p className="text-on-surface-variant text-lg md:text-xl max-w-lg mb-12 leading-relaxed mx-auto lg:mx-0">
                Transform your social landscape into a living, visual map.
                Noddic maps your connections so you never forget a face, a
                place, or the story that links them.
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="silk-gradient text-white px-10 py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 inline-block"
                >
                  Start Mapping
                </Link>
                <Link
                  href="#how-it-works"
                  className="bg-surface-container text-on-surface px-10 py-4 rounded-full font-headline font-bold text-lg hover:bg-surface-container-high transition-all active:scale-95 inline-block"
                >
                  See How It Works
                </Link>
              </div>
            </div>

            {/* Hero visual — abstract mind map illustration */}
            <div className="lg:col-span-6 relative">
              <div className="relative w-full aspect-square max-w-2xl mx-auto">
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden bg-surface-container-low shadow-2xl flex items-center justify-center">
                  <HeroMapSVG />
                </div>

                {/* Floating node cards */}
                <div
                  className="absolute top-[12%] left-[5%] glass-panel p-4 rounded-xl shadow-2xl flex items-center gap-3 z-20 border border-white/20 animate-slide-up"
                  style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#4ECDC4]/20 flex items-center justify-center text-[#4ECDC4] font-bold text-sm">
                    JR
                  </div>
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">
                      Julian Rossi
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      Met at Design Week
                    </p>
                  </div>
                </div>

                <div
                  className="absolute top-[42%] right-[2%] glass-panel p-4 rounded-xl shadow-2xl flex items-center gap-3 z-20 border border-white/20 animate-slide-up"
                  style={{ animationDelay: '0.5s', animationFillMode: 'both' }}
                >
                  <div className="w-10 h-10 rounded-full bg-[#FF6B6B]/20 flex items-center justify-center text-[#FF6B6B] font-bold text-xs">
                    ◆
                  </div>
                  <div>
                    <p className="font-headline font-bold text-sm text-on-surface">
                      The Glass Studio
                    </p>
                    <p className="font-body text-xs text-on-surface-variant">
                      Fremantle, WA
                    </p>
                  </div>
                </div>

                <div
                  className="absolute bottom-[18%] left-[20%] glass-panel p-3 rounded-xl shadow-2xl flex items-center gap-3 z-20 border border-white/20 animate-slide-up"
                  style={{ animationDelay: '0.8s', animationFillMode: 'both' }}
                >
                  <div className="w-8 h-8 rounded-full silk-gradient flex items-center justify-center text-white text-xs font-bold">
                    ■
                  </div>
                  <p className="font-headline font-semibold text-xs text-on-surface">
                    Yoga Tuesday
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Background blobs */}
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-tertiary-container/5 rounded-full blur-[100px] pointer-events-none" />
        </section>

        {/* ── How It Works ─────────────────────────────────── */}
        <section
          id="how-it-works"
          className="py-24 md:py-32 px-6 md:px-10 bg-surface-container-low"
        >
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 md:mb-20 gap-8 text-center md:text-left">
              <div className="max-w-2xl">
                <span className="text-primary font-headline font-bold tracking-[0.2em] uppercase text-sm mb-4 block">
                  How it Works
                </span>
                <h2 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tight leading-tight">
                  Build your map,
                  <br /> follow the path.
                </h2>
              </div>
              <p className="text-on-secondary-container text-lg max-w-sm text-center md:text-left">
                Stop thinking in lists. Start seeing connections through a
                spatial, visual lens.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large card */}
              <div className="md:col-span-8 bg-surface-container-lowest rounded-3xl p-8 md:p-10 flex flex-col justify-between shadow-sm min-h-[360px]">
                <div>
                  <h3 className="font-headline font-bold text-2xl md:text-3xl mb-4">
                    You Are the Center
                  </h3>
                  <p className="text-on-surface-variant max-w-md">
                    Your map starts with you. Add the contexts of your life —
                    gym, work, neighbourhood — then branch out to the people and
                    places within each. Follow the path to remember.
                  </p>
                </div>
                <div className="mt-8 flex gap-3 flex-wrap">
                  {['You', 'Gym', 'Sarah', "Sarah's Kids"].map((label, i) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-full text-sm font-headline font-semibold text-on-surface"
                    >
                      {i > 0 && (
                        <span className="text-primary text-xs">→</span>
                      )}
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Side cards */}
              <div className="md:col-span-4 flex flex-col gap-6">
                <div className="flex-1 silk-gradient text-white rounded-3xl p-8 flex flex-col justify-end min-h-[160px]">
                  <div className="text-3xl mb-4">🔗</div>
                  <h3 className="font-headline font-bold text-xl mb-2">
                    Memory Hints
                  </h3>
                  <p className="opacity-80 text-sm">
                    Add hints to each node — &quot;tall, red hair, met through
                    Dave&quot; — so the path triggers your memory.
                  </p>
                </div>
                <div className="flex-1 bg-surface-container-highest rounded-3xl p-8 flex flex-col justify-between min-h-[160px]">
                  <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
                    Your Terminology
                  </h3>
                  <p className="text-on-surface-variant text-sm">
                    Rename &quot;nodes&quot; to whatever fits your brain —
                    connections, dots, pins, threads. Make it yours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────── */}
        <section className="py-24 md:py-32 px-6 md:px-10 text-center bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline font-extrabold text-5xl md:text-6xl mb-10 tracking-tight">
              Your world,
              <br /> beautifully mapped.
            </h2>
            <Link
              href="/signup"
              className="silk-gradient text-white px-16 py-5 rounded-full font-headline font-bold text-xl shadow-2xl hover:scale-105 transition-transform inline-block"
            >
              Get Started Free
            </Link>
            <p className="mt-10 text-on-surface-variant text-sm font-label uppercase tracking-widest">
              Free forever for personal use
            </p>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="bg-surface border-t border-surface-container">
        <div className="flex flex-col md:flex-row justify-between items-center max-w-[1440px] mx-auto gap-6 w-full py-10 px-6 md:px-10">
          <NoddicLogo size="small" />
          <div className="flex flex-wrap justify-center gap-8">
            <Link href="/privacy" className="text-xs uppercase tracking-widest text-on-surface/40 hover:text-primary transition-colors">
              Privacy Policy
            </Link>
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

function HeroMapSVG() {
  return (
    <svg viewBox="0 0 500 500" className="w-[85%] h-[85%] opacity-60">
      {/* Connection lines */}
      <line x1="250" y1="250" x2="120" y2="130" stroke="#3525cd" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.35" />
      <line x1="250" y1="250" x2="390" y2="200" stroke="#3525cd" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.35" />
      <line x1="250" y1="250" x2="170" y2="380" stroke="#3525cd" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.35" />
      <line x1="250" y1="250" x2="370" y2="370" stroke="#3525cd" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.35" />
      <line x1="120" y1="130" x2="60" y2="80" stroke="#4ECDC4" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
      <line x1="120" y1="130" x2="80" y2="200" stroke="#4ECDC4" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
      <line x1="390" y1="200" x2="440" y2="130" stroke="#FF6B6B" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />
      <line x1="370" y1="370" x2="430" y2="420" stroke="#4ECDC4" strokeWidth="1" strokeDasharray="3 4" opacity="0.3" />

      {/* Center node */}
      <circle cx="250" cy="250" r="28" fill="#fcf9f8" stroke="#3525cd" strokeWidth="2.5" />
      <circle cx="250" cy="250" r="6" fill="#3525cd" opacity="0.7" />

      {/* Context nodes */}
      <circle cx="120" cy="130" r="20" fill="#fcf9f8" stroke="#4f46e5" strokeWidth="2" />
      <rect x="113" y="123" width="14" height="14" rx="3" fill="#4f46e5" opacity="0.5" />

      <circle cx="390" cy="200" r="20" fill="#fcf9f8" stroke="#FF6B6B" strokeWidth="2" />
      <polygon points="390,188 398,204 382,204" fill="#FF6B6B" opacity="0.5" />

      <circle cx="170" cy="380" r="20" fill="#fcf9f8" stroke="#4f46e5" strokeWidth="2" />
      <rect x="163" y="373" width="14" height="14" rx="3" fill="#4f46e5" opacity="0.5" />

      <circle cx="370" cy="370" r="20" fill="#fcf9f8" stroke="#4ECDC4" strokeWidth="2" />
      <circle cx="370" cy="370" r="5" fill="#4ECDC4" opacity="0.5" />

      {/* Leaf nodes */}
      <circle cx="60" cy="80" r="12" fill="#fcf9f8" stroke="#4ECDC4" strokeWidth="1.5" />
      <circle cx="80" cy="200" r="12" fill="#fcf9f8" stroke="#4ECDC4" strokeWidth="1.5" />
      <circle cx="440" cy="130" r="12" fill="#fcf9f8" stroke="#FF6B6B" strokeWidth="1.5" />
      <circle cx="430" cy="420" r="12" fill="#fcf9f8" stroke="#4ECDC4" strokeWidth="1.5" />
    </svg>
  );
}