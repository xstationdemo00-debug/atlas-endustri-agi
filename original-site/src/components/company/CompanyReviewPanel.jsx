import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { notify } from '@/lib/tenant';
import { DOCUMENT_TYPES, docLabel, verificationProgress } from '@/lib/companyVerification';
import { Check, ExternalLink, X } from 'lucide-react';

export default function CompanyReviewPanel({ company, documents = [], onChanged }) {
  const [note, setNote] = useState(company?.verification_note || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNote(company?.verification_note || '');
  }, [company?.id]);

  const openFile = async (fileUri) => {
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    window.open(signed_url, '_blank');
  };

  const decideDocument = async (doc, status) => {
    setBusy(true);
    try {
      await base44.entities.CompanyDocument.update(doc.id, { status });
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const decide = async (status) => {
    setBusy(true);
    try {
      await base44.entities.Company.update(company.id, { verification_status: status, verification_note: note });
      await notify({
        email: company.owner_email,
        title: status === 'verified' ? 'Firmanız doğrulandı' : 'Firma doğrulama başvurusu reddedildi',
        body: status === 'verified'
          ? `${company.name} doğrulanmış üye olarak ağda görünür.`
          : `${company.name} başvurusu reddedildi. ${note || 'Belgeleri düzeltip yeniden gönderin.'}`,
        type: 'system',
        link: '/firma-kayit',
      });
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  const progress = verificationProgress(company, documents);
  const requiredDocs = DOCUMENT_TYPES.filter((item) => item.required);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-extrabold text-foreground">{company.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {company.legal_name || 'Ticari ünvan yok'} · {company.city || '—'} · {company.email || '—'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Yetkili: {company.owner_email || '—'} · Vergi no: {company.tax_number || '—'} {company.tax_office ? `(${company.tax_office})` : ''}
          </p>
        </div>
        <StatusBadge status={company.verification_status} />
      </div>

      {company.about && <p className="rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">{company.about}</p>}

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <p><span className="text-muted-foreground">Telefon:</span> {company.phone || '—'}</p>
        <p><span className="text-muted-foreground">Web:</span> {company.website || '—'}</p>
        <p><span className="text-muted-foreground">Çalışan:</span> {company.employee_count || 0}</p>
        <p><span className="text-muted-foreground">Başvuru:</span> {company.verification_submitted_at ? new Date(company.verification_submitted_at).toLocaleDateString('tr-TR') : '—'}</p>
      </div>

      {(company.capability_tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {company.capability_tags.map((tag) => (
            <span key={tag} className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/70">{tag}</span>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-border p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Zorunlu belgeler · {progress.doneCount}/{progress.total} adım tamam
        </p>
        <div className="mt-2 space-y-2">
          {requiredDocs.map((item) => {
            const doc = documents.find((entry) => entry.type === item.value);
            return (
              <div key={item.value} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{doc ? doc.file_name || 'Yüklendi' : 'Yüklenmedi'}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {doc && <StatusBadge status={doc.status} />}
                  {doc && (
                    <>
                      <button onClick={() => openFile(doc.file_uri)} className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground" title="Belgeyi aç">
                        <ExternalLink size={13} />
                      </button>
                      <button disabled={busy} onClick={() => decideDocument(doc, 'verified')} className="rounded-md border border-emerald-200 p-1.5 text-emerald-700" title="Belgeyi onayla">
                        <Check size={13} />
                      </button>
                      <button disabled={busy} onClick={() => decideDocument(doc, 'rejected')} className="rounded-md border border-rose-200 p-1.5 text-rose-700" title="Belgeyi reddet">
                        <X size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {documents.filter((doc) => !requiredDocs.some((item) => item.value === doc.type)).length > 0 && (
          <div className="mt-2 space-y-1">
            {documents
              .filter((doc) => !requiredDocs.some((item) => item.value === doc.type))
              .map((doc) => (
                <button key={doc.id} onClick={() => openFile(doc.file_uri)} className="flex w-full items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground">
                  <span>{docLabel(doc.type)} · {doc.file_name}</span>
                  <ExternalLink size={12} />
                </button>
              ))}
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Değerlendirme notu (firmaya iletilir)</Label>
        <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Eksik belge, kapsam düzeltmesi veya ret gerekçesi" className="mt-1" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={busy} onClick={() => decide('verified')}>
          <Check size={14} className="mr-1" /> Firmayı doğrula
        </Button>
        <Button size="sm" variant="outline" disabled={busy} className="text-destructive" onClick={() => decide('rejected')}>
          <X size={14} className="mr-1" /> Reddet
        </Button>
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => decide('in_review')}>
          İncelemede bırak
        </Button>
      </div>
    </div>
  );
}