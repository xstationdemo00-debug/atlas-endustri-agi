import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

export default function OfferFeed({ offers }) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div>
          <h3 className="font-heading text-sm font-bold text-foreground">Teklif akışı</h3>
          <p className="text-xs text-muted-foreground">Son 24 saatte gelen teklifler</p>
        </div>
        <Link to="/teklifler" className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
          Tümü <ArrowRight size={13} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {offers.map((offer) => (
          <div key={offer.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{offer.company}</p>
              <p className="truncate text-xs text-muted-foreground">{offer.project}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-foreground">{offer.amount}</p>
              <StatusBadge status={offer.status} className="mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}