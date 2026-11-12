import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatMoney, formatDate } from '@/lib/format';

export default function OfferList({ offers, canDecide, onDecided }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const decide = async (offer, decision) => {
    setBusyId(offer.id);
    setError('');
    try {
      await base44.functions.invoke('decideOffer', { offer_id: offer.id, decision });
      await onDecided?.();
    } catch (err) {
      setError(err.message || 'Teklif kararı tamamlanamadı.');
    } finally {
      setBusyId(null);
    }
  };

  if (!offers.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Henüz teklif yok.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-2 text-sm text-red-900">{error}</p>}
      {offers.map((offer) => (
        <div key={offer.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {offer.company_name || offer.applicant_name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {offer.project_title || 'Proje'} · {offer.applicant_email}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {offer.team_size || 1} kişi · {offer.duration_days || '—'} gün · {formatDate(offer.created_date)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <p className="text-sm font-bold text-foreground">{formatMoney(offer.amount, offer.currency)}</p>
            <StatusBadge status={offer.status} />
            {canDecide && ['submitted', 'shortlisted'].includes(offer.status) && (
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" disabled={busyId === offer.id} onClick={() => decide(offer, 'shortlist')}>
                  Kısa liste
                </Button>
                <Button size="sm" disabled title="Sözleşme, ücret, SGK ve İSG kontrolü bitmeden kabul kapalıdır.">
                  Kabul: belge kontrolü gerekli
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" disabled={busyId === offer.id} onClick={() => decide(offer, 'reject')}>
                  Reddet
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}