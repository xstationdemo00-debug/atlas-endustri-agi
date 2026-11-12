import { Link, useLocation } from 'react-router-dom';
import { Globe2, LogOut, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { NAV_GROUPS, ADMIN_ONLY_PATHS } from '@/lib/nav';
import { cn } from '@/lib/utils';

export default function Sidebar({ onNavigate, onClose }) {
  const { pathname } = useLocation();
  const auth = useAuth() || {};
  const user = auth.user;
  const initials = (user?.full_name || user?.email || 'AT')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 px-5 py-5">
        <Link to="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent font-heading text-sm font-extrabold text-accent-foreground">
            A
          </span>
          <span className="leading-tight">
            <span className="block font-heading text-sm font-extrabold tracking-wide text-sidebar-foreground">
              ATLAS ENDÜSTRİ AĞI
            </span>
            <span className="block text-[11px] text-sidebar-foreground/55">Proje · Tedarik · İşbirliği</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded-md p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
              {group.title}
            </p>
            <div className="space-y-0.5">
              {group.items.filter(item => !ADMIN_ONLY_PATHS.includes(item.to) || user?.role === 'admin').map((item) => {
                const active = item.to === '/' ? pathname === '/' : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                      active
                        ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-accent' : ''} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-[11px] text-sidebar-foreground/60">
          <Globe2 size={14} />
          <span>Türkiye · Türkçe · TRY</span>
        </div>
        <div className="mt-1 flex items-center gap-2.5 rounded-lg px-2 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground">
              {user?.full_name || 'ATLAS kullanıcısı'}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">{user?.email || '—'}</p>
          </div>
          <button
            onClick={() => base44.auth.logout('/login')}
            title="Çıkış yap"
            className="rounded-md p-1.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}