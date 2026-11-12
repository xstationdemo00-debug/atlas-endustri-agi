import { useEffect, useState } from 'react';
import { ShieldCheck, Download, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import CertificateDialog from '@/components/CertificateDialog';
import { formatDate, daysUntil } from '@/lib/format';
import { getMyCompany } from '@/lib/tenant';

const TYPE_LABELS = { mesleki: 'Mesleki yeterlilik', isg: 'İSG', saglik: 'Sağlık raporu', diger: 'Diğer' };

export default function Documents() {
  const { user } = useAuth() || {};
  const [certificates, setCertificates] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [page, myCompany] = await Promise.all([
      base44.entities.Certificate.filter({}, { sort: '-created_date', limit: 100 }),
      getMyCompany(user),
    ]);
    setCertificates((page.items || []).filter((item) => item.user_email === user?.email));
    setCompany(myCompany);
    setLoading(false);
  };

  useEffect(() => {
    if (user) load();
  }, [user?.id]);

  const openFile = async (fileUri) => {
    if (!fileUri) return;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    window.open(signed_url, '_blank');
  };

  const expiring = certificates.filter((cert) => {
    const days = daysUntil(cert.valid_until);
    return days !== null && days <= 60;
  });

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5">
      <PageHeader
        title="Belgeler & İSG"
        description="Mesleki yeterlilik, İSG ve sağlık belgelerinizi yönetin; süresi yaklaşanları takip edin."
      >
        <CertificateDialog user={user} company={company} onSaved={load} />
      </PageHeader>

      {expiring.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            {expiring.length} belgenin süresi 60 gün içinde doluyor. Sahaya çıkışta geçerli belge zorunludur.
          </p>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Belgeler yükleniyor...</p>
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Kayıtlı belge yok"
          description="Sahada çalışabilmek için mesleki yeterlilik ve İSG belgelerinizi yükleyin."
        />
      ) : (
        <div className="space-y-2">
          {certificates.map((cert) => {
            const days = daysUntil(cert.valid_until);
            const warning = days !== null && days <= 60;
            return (
              <div key={cert.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{cert.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {TYPE_LABELS[cert.type] || cert.type} · {cert.issuer || 'Kurum belirtilmedi'} · Geçerlilik: {formatDate(cert.valid_until)}
                  </p>
                  {cert.status === 'rejected' && cert.note && (
                    <p className="mt-1 text-[11px] font-medium text-destructive">{cert.note}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {warning && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      {days < 0 ? 'Süresi doldu' : `${days} gün kaldı`}
                    </span>
                  )}
                  <StatusBadge status={cert.status} />
                  {cert.file_uri && (
                    <button
                      onClick={() => openFile(cert.file_uri)}
                      className="flex max-w-[180px] items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      title="Belgeyi aç"
                    >
                      <Download size={13} className="shrink-0" />
                      <span className="truncate">{cert.file_name || 'Belgeyi aç'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}