import { cn } from '@/lib/utils';

export default function StatCard({ icon: Icon, label, value, hint, tone = 'default' }) {
  const toneClass = {
    default: 'bg-primary/5 text-primary',
    accent: 'bg-accent/10 text-accent',
    success: 'bg-emerald-50 text-emerald-600',
    warning: 'bg-amber-50 text-amber-600',
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-heading text-2xl font-bold leading-none text-foreground sm:text-3xl">
            {value}
          </p>
        </div>
        {Icon && (
          <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneClass)}>
            <Icon className="h-4.5 w-4.5" size={18} />
          </span>
        )}
      </div>
      {hint && <p className="mt-3 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}