import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/StatusBadge';
import { DOCUMENT_TYPES, docLabel } from '@/lib/companyVerification';
import { ExternalLink, FileText, Loader2, Trash2, Upload } from 'lucide-react';

export default function CompanyDocumentsPanel({ company, documents = [], onChanged }) {
  const [busyType, setBusyType] = useState('');
  const [error, setError] = useState('');

  const upload = async (type, file) => {
    if (!file || !company?.id) return;
    setError('');
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu 10 MB sınırını aşıyor.');
      return;
    }
    setBusyType(type);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      await base44.entities.CompanyDocument.create({
        company_id: company.id,
        company_name: company.name,
        owner_email: company.email,
        type,
        name: docLabel(type),
        file_uri,
        file_name: file.name,
      });
      await onChanged?.();
    } catch (err) {
      setError('Belge yüklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setBusyType('');
    }
  };

  const openFile = async (fileUri) => {
    if (!fileUri) return;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri });
    window.open(signed_url, '_blank');
  };

  const remove = async (doc) => {
    await base44.entities.CompanyDocument.delete(doc.id);
    await onChanged?.();
  };

  return (
    <div className="space-y-2">
      {DOCUMENT_TYPES.map((item) => {
        const doc = documents.find((entry) => entry.type === item.value);
        const busy = busyType === item.value;
        return (
          <div key={item.value} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-foreground">
                {item.label}
                {item.required && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Zorunlu</span>}
              </p>
              {doc ? (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <FileText size={12} /> <span className="truncate">{doc.file_name || docLabel(doc.type)}</span>
                </p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">Henüz yüklenmedi</p>
              )}
              {doc?.status === 'rejected' && doc.note && (
                <p className="mt-1 text-[11px] font-medium text-destructive">Red gerekçesi: {doc.note}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {doc && <StatusBadge status={doc.status} />}
              {doc && (
                <>
                  <button onClick={() => openFile(doc.file_uri)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground" title="Belgeyi aç">
                    <ExternalLink size={14} />
                  </button>
                  <button onClick={() => remove(doc)} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-destructive" title="Belgeyi sil">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-accent disabled:opacity-50">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {doc ? 'Değiştir' : 'Yükle'}
                <input
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={busy || !company?.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    upload(item.value, file);
                  }}
                />
              </label>
            </div>
          </div>
        );
      })}
      <p className="text-xs text-muted-foreground">
        PDF, JPG, PNG veya WEBP · en fazla 10 MB · belgeler özel olarak saklanır, yalnızca yetkili kullanıcılar görüntüler.
      </p>
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}