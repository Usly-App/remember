'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Settings, Map, LogOut } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="h-screen flex flex-col bg-surface overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 flex justify-between items-center px-5 md:px-8 py-3.5 bg-surface/80 backdrop-blur-xl border-b border-surface-container z-50">
        <div className="flex items-center gap-8">
          <Link
            href="/map"
            className="font-headline font-bold text-xl text-on-surface tracking-tight"
          >
            Remember
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/map"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-headline font-medium transition-colors ${
                pathname === '/map'
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface/60 hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <Map size={16} />
              My Map
            </Link>
            <Link
              href="/settings"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-headline font-medium transition-colors ${
                pathname === '/settings'
                  ? 'bg-primary/10 text-primary'
                  : 'text-on-surface/60 hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              <Settings size={16} />
              Settings
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {/* Mobile nav */}
          <div className="flex md:hidden items-center gap-1">
            <Link
              href="/map"
              className={`p-2 rounded-xl transition-colors ${
                pathname === '/map' ? 'bg-primary/10 text-primary' : 'text-on-surface/60'
              }`}
            >
              <Map size={20} />
            </Link>
            <Link
              href="/settings"
              className={`p-2 rounded-xl transition-colors ${
                pathname === '/settings' ? 'bg-primary/10 text-primary' : 'text-on-surface/60'
              }`}
            >
              <Settings size={20} />
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-headline text-on-surface/50 hover:text-error hover:bg-error/5 transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Log out</span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
