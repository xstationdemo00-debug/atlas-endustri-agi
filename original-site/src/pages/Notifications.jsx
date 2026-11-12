import { useEffect, useState } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export default function Notifications() {
  const { user } = useAuth() || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const page = await base44.entities.Notification.filter({}, { sort: '-created_date', limit: 50 });
    setItems(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const markRead = async (item) => {
    if (item.is_read) return;
    await base44.entities.Notification.update(item.id, { is_read: true });
    await load();
  };

  const markAll = async () => {
    await base44.entities.Notification.updateMany({ is_read: false }, { $set: { is_read: true } });
    await load();
  };

  const unread = items.filter((item) => !item.is_read).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <PageHeader
        title="Bildirimler"
        description="Teklif, ekip ve belge hareketleri."
      >
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={markAll}>Tümünü okundu işaretle</Button>
        )}
      </PageHeader>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Bildirimler yükleniyor...</p>
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="Bildirim yok" description="Yeni teklif, ekip veya belge hareketi olduğunda burada görünür." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => markRead(item)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition',
                item.is_read ? 'border-border bg-card' : 'border-accent/40 bg-accent/5'
              )}
            >
              <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', item.is_read ? 'bg-muted text-muted-foreground' : 'bg-accent/15 text-accent')}>
                {item.is_read ? <Bell size={15} /> : <BellRing size={15} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-foreground">{item.title}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatDate(item.created_date)}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.body}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}