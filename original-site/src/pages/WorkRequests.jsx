import { useEffect, useMemo, useState } from 'react';
import { Search, ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import OfferDialog from '@/components/OfferDialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatMoney, TRADES } from '@/lib/format';

export default function WorkRequests() {
  const { user } = useAuth() || {};
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [trade, setTrade] = useState('all');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const page = await base44.entities.WorkRequest.filter({}, { sort: '-created_date', limit: 100 });
      setRequests(page.items || []);
    } catch (err) {
      setRequests([]); setError(err.message || 'İş talepleri alınamadı.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        const matchesTrade = trade === 'all' || request.trade === trade;
        const text = `${request.trade} ${request.project_title} ${request.company_name} ${request.city}`.toLowerCase();
        return matchesTrade && text.includes(query.toLowerCase());
      }),
    [requests, query, trade]
  );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <PageHeader
        title="İş talepleri"
        description="Açık pozisyonlar, günlük ücretler ve aranan yeterlilikler."
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Meslek, proje veya şehir ara" className="pl-9" />
        </div>
        <Select value={trade} onValueChange={setTrade}>
          <SelectTrigger className="sm:w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm meslekler</SelectItem>
            {TRADES.map((item) => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">İş talepleri yükleniyor...</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Açık iş talebi yok"
          description="Proje detayından yeni iş talebi ekleyebilirsin."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((request) => {
            const filled = request.filled_count || 0;
            const headcount = request.headcount || 0;
            const percent = headcount ? Math.min(100, Math.round((filled / headcount) * 100)) : 0;
            const isMine = request.created_by_id === user?.id || (!!request.owner_email && request.owner_email === user?.email);
            const published = request.is_public_listing === true;

            return (
              <div key={request.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-heading text-sm font-bold text-foreground">{request.trade}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {request.project_title || 'Proje'} · {request.company_name || 'Firma'}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Şehir: <b className="text-foreground/80">{request.city || '—'}</b></span>
                  <span>Günlük: <b className="text-foreground/80">{formatMoney(request.daily_rate, request.currency)}</b></span>
                  <span>Başlangıç: <b className="text-foreground/80">{formatDate(request.start_date)}</b></span>
                  <span>Kadro: <b className="text-foreground/80">{filled}/{headcount}</b></span>
                </div>

                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>

                {request.certificates_required?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {request.certificates_required.map((cert) => (
                      <span key={cert} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground/70">
                        {cert}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    {isMine ? 'Kendi talebiniz · yayın için firma/proje onayı gerekir' : published ? 'Onaylı iş talebi · teklif verebilirsiniz' : 'Onay bekliyor'}
                  </span>
                  {!isMine && published && <OfferDialog request={request} user={user} onCreated={load} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}