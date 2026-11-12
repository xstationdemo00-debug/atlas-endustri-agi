import { Bell } from 'lucide-react';

export default function NotificationFeed({ notifications }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Bell size={15} className="text-accent" />
        <h3 className="font-heading text-sm font-bold text-foreground">Bildirimler</h3>
      </div>
      <div className="mt-3 space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-lg border border-border/70 bg-muted/40 p-2.5">
            <p className="text-xs font-semibold text-foreground">{item.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.body}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/70">{item.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}