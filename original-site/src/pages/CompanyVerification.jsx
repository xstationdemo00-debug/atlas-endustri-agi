import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import CompanyReviewPanel from '@/components/company/CompanyReviewPanel';
import { ShieldAlert } from 'lucide-react';

const QUEUE_STATUSES = ['pending', 'in_review', 'rejected'];

export default function CompanyVerification() {
  const { user } = useAuth() || {};
  const isAdmin = user?.role === 'admin';
  const [queue, setQueue] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [documents, setDocuments] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, in_review: 0, verified: 0 });
  const [loading, setLoading] = useState(true);

  const selected = queue.find((item) => item.id === selectedId) || null;

  const loadQueue = async () => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const [page, pending, inReview, verified] = await Promise.all([
      base44.entities.Company.filter({ verification_status: { $in: QUEUE_STATUSES } }, { sort: '-updated_date', limit: 100 }),
      base44.entities.Company.count({ verification_status: 'pending' }),
      base44.entities.Company.count({ verification_status: 'in_review' }),
      base44.entities.Company.count({ verification_status: 'verified' }),
    ]);
    const items = page.items || [];
    setQueue(items);
    setCounts({ pending, in_review: inReview, verified });
    setSelectedId((prev) => (items.some((item) => item.id === prev) ? prev : items[0]?.id || ''));
    setLoading(false);
  };

  const loadDocuments = async (companyId) => {
    if (!companyId) {
      setDocuments([]);
      return;
    }
    const page = await base44.entities.CompanyDocument.filter({ company_id: companyId }, { limit: 100 });
    setDocuments(page.items || []);
  };

  useEffect(() => {
    if (isAdmin) loadQueue();
  }, [isAdmin]);

  useEffect(() => {
    loadDocuments(selectedId);
  }, [selectedId]);

  const refresh = async () => {
    await loadQueue();
    await loadDocuments(selectedId);
  };

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <EmptyState
          icon={ShieldAlert}
          title="Yönetici yetkisi gerekli"
          description="Firma doğrulama masası yalnızca kurumsal yöneticiler tarafından kullanılır."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5">
      <PageHeader
        title="Firma doğrulama masası"
        description="Başvuran firmaların ticari bilgilerini ve belgelerini inceleyin; her belgeyi tek tek onaylayın, sonra firmayı doğrulayın."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Bilgi bekleyen', counts.pending],
          ['İncelemede', counts.in_review],
          ['Doğrulanmış', counts.verified],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 font-heading text-2xl font-black text-foreground">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Doğrulama kuyruğu yükleniyor...</p>
      ) : queue.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="Bekleyen başvuru yok" description="Yeni firma başvuruları burada listelenir." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-2">
            {queue.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedId(company.id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${company.id === selectedId ? 'border-accent bg-accent/5' : 'border-border bg-card hover:bg-muted/40'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{company.name}</p>
                    <p className="text-[11px] text-muted-foreground">{company.city || '—'} · {company.owner_email || '—'}</p>
                  </div>
                  <StatusBadge status={company.verification_status} />
                </div>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
            {selected ? (
              <CompanyReviewPanel company={selected} documents={documents} onChanged={refresh} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">İncelemek için bir firma seçin.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}