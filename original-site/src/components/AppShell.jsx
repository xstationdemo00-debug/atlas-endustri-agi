import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, Menu, Search } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { NAV_GROUPS } from '@/lib/nav';

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const items = NAV_GROUPS.flatMap((group) => group.items);
  const active =
    items.find((item) => item.to === pathname) ||
    items
      .filter((item) => item.to !== '/')
      .find((item) => pathname.startsWith(item.to));

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-sidebar shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-border p-2 text-foreground lg:hidden"
              aria-label="Menüyü aç"
            >
              <Menu size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-heading text-sm font-bold text-foreground sm:text-base">
                {active?.label || 'Atlas Endüstri Ağı'}
              </h2>
              <p className="hidden text-xs text-muted-foreground sm:block">
                Kurumsal yönetim alanı · Türkiye operasyonu
              </p>
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-sm text-muted-foreground md:flex">
              <Search size={15} />
              <input
                placeholder="Proje, firma veya usta ara"
                className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>

            <Link
              to="/bildirimler"
              className="relative rounded-lg border border-border p-2 text-foreground hover:bg-muted"
              aria-label="Bildirimler"
            >
              <Bell size={17} />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}