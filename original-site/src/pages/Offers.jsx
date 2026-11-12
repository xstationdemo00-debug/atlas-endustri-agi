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
  const [tab, setTab] = useState('incoming');

  const load = async () => {
    const page = await base44.entities.Offer.filter({}, { sort: '-created_date', limit: 200 });
    setOffers(page.items || []);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const incoming = offers.filter((offer) => offer.owner_email === user?.email);
  const outgoing = offers.filter((offer) => offer.applicant_email === user?.email || offer.created_by_id === user?.id);
  const current = tab === 'incoming' ? incoming : outgoing;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title="Teklifler"
        description="Kendi projelerinize gelen teklifleri değerlendirin, verdiğiniz teklifleri takip edin."
      />

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