import { Link } from 'react-router-dom';
import { MapPin, CalendarDays, ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function PriorityProjects({ projects }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground">Öncelikli projeler</h3>
          <p className="text-xs text-muted-foreground">Kadro açığı en yüksek sahalar</p>
        </div>
        <Link to="/projeler" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
          Tümü <ArrowRight size={13} />
        </Link>
      </div>

      <div className="divide-y divide-border">
        {projects.map((project) => {
          const percent = Math.min(100, Math.round((project.filled / project.needed) * 100));
          return (
            <div key={project.id} className="px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-sm text-foreground">{project.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {project.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} /> {project.start}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground/70">{project.trade}</span>
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {project.filled} / {project.needed} personel
                  </span>
                  <span className="font-semibold text-foreground/80">{percent}%</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}