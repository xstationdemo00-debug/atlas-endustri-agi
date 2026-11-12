import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import OfferList from '@/components/OfferList';
import { cn } from '@/lib/utils';

export default function Offers() {
  const { user } = useAuth() || {};
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('incoming');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const page = await base44.entities.Offer.filter({}, { sort: '-created_date', limit: 200 });
      setOffers(page.items || []);
    } catch (err) {
      setOffers([]); setError(err.message || 'Teklif listesi alınamadı.');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const incoming = offers.filter((offer) => offer.request_owner_auth_user_id === user?.id);
  const outgoing = offers.filter((offer) => offer.created_by_id === user?.id);
  const current = tab === 'incoming' ? incoming : outgoing;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title="Teklifler"
        description="Kendi projelerinize gelen teklifleri değerlendirin, verdiğiniz teklifleri takip edin."
      />

      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-900">{error}</p>}
      <div className="inline-flex rounded-lg border border-border bg-card p-1">
        {[
          { key: 'incoming', label: `Gelen teklifler (${incoming.length})` },
          { key: 'outgoing', label: `Verdiğim teklifler (${outgoing.length})` },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition',
              tab === item.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Teklifler yükleniyor...</p>
        ) : current.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={tab === 'incoming' ? 'Henüz teklif almadınız' : 'Henüz teklif vermediniz'}
            description={
              tab === 'incoming'
                ? 'İş talebi açtığınızda gelen teklifler burada listelenir.'
                : 'İş talepleri sayfasından açık pozisyonlara teklif verebilirsiniz.'
            }
          />
        ) : (
          <OfferList offers={current} canDecide={tab === 'incoming'} onDecided={load} />
        )}
      </div>
    </div>
  );
}