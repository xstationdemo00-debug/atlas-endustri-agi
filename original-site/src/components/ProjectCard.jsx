import { Link } from 'react-router-dom';
import { MapPin, CalendarDays, Building2 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';
import { formatDate } from '@/lib/format';

export default function ProjectCard({ project }) {
  const needed = project.headcount_needed || 0;
  const filled = project.headcount_filled || 0;
  const percent = needed ? Math.min(100, Math.round((filled / needed) * 100)) : 0;

  return (
    <Link
      to={`/projeler/${project.id}`}
      className="block rounded-xl border border-border bg-card p-4 shadow-sm transition hover:border-accent/60 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold text-foreground">{project.title}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Building2 size={12} /> {project.company_name || 'Firma belirtilmedi'}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} /> {project.city || '—'}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={12} /> {formatDate(project.start_date)}
        </span>
        {project.trade && (
          <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/70">{project.trade}</span>
        )}
      </div>

      {needed > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {filled} / {needed} personel
            </span>
            <span className="font-semibold text-foreground/80">{percent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}
    </Link>
  );
}