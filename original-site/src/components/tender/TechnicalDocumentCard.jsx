import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, FileUp, ExternalLink, ShieldAlert } from 'lucide-react';

const ALLOWED = ['pdf', 'docx', 'doc', 'txt', 'csv'];
const MAX_BYTES = 20 * 1024 * 1024;

export default function TechnicalDocumentCard({ analysis, disabled, onUpdated, technicalClauseCount = 0 }) {
  const picker = useRef(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [matchPreview, setMatchPreview] = useState(null);
  const [matching, setMatching] = useState(false);

  useEffect(() => { setMatchPreview(null); }, [analysis.id, analysis.technical_file_uri]);

  const chooseFile = (candidate) => {
    setError('');
    setMessage('');
    if (!candidate) { setFile(null); return; }
    const ext = String(candidate.name || '').split('.').pop().toLowerCase();
    if (!ALLOWED.includes(ext) || candidate.size > MAX_BYTES) {
      setFile(null);
      setError('Teknik belge PDF, Word, TXT veya CSV olmalı; en fazla 20 MB.');
      if (picker.current) picker.current.value = '';
      return;
    }
    setFile(candidate);
  };

  const openTechnical = async () => {
    setError('');
    if (!analysis.technical_file_uri) return;
    try {
      const result = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: analysis.technical_file_uri,
      });
      const signed = result?.signed_url;
      if (!signed) throw new Error('Güvenli bağlantı alınamadı.');
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError('Teknik şartname açılamadı. Yetkilerinizi ve dosyayı kontrol edin.');
    }
  };

  const attach = async () => {
    if (!file || disabled || saving) return;
    if (analysis.technical_file_uri &&
      !window.confirm('Mevcut teknik şartnamenin bu analizdeki bağlantısını yeni dosyayla değiştirmek istiyor musunuz? Ön inceleme notları otomatik olarak onaylanmaz.')) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const upload = await base44.integrations.Core.UploadPrivateFile({ file });
      if (!upload?.file_uri) throw new Error('Dosya yükleme tamamlanamadı.');
      await base44.entities.TenderAnalysis.update(analysis.id, {
        technical_file_uri: upload.file_uri,
        technical_file_name: file.name.slice(0, 180),
        technical_uploaded_at: new Date().toISOString(),
      });
      setFile(null);
      setMatchPreview(null);
      if (picker.current) picker.current.value = '';
      await onUpdated?.();
      setMessage('Teknik belge özel depoda bu ihaleye bağlandı. Otomatik teknik analiz yapılmadı; kalemler onay bekliyor.');
    } catch (err) {
      setError('Teknik belge bağlanamadı. Eski bağlantı korunmuş olabilir; sayfayı yenileyip kontrol edin.');
    } finally {
      setSaving(false);
    }
  };

  const matchTechnical = async (mode) => {
    if (disabled || matching || !analysis.technical_file_uri) return;
    if (mode === 'import' &&
      !window.confirm('Önizlemede görülen yeni teknik maddeler eşleştirilecek. İş kalemleri veya onayları değişmeyecek. Devam edilsin mi?')) return;
    setMatching(true);
    setError('');
    setMessage('');
    try {
      const response = await base44.functions.invoke('linkTenderTechnicalDocument', {
        analysis_id: analysis.id,
        mode,
        ...(mode === 'import' ? { confirm: true } : {}),
      });
      const result = response?.data || {};
      if (result.ok !== true) throw new Error(result.error || 'Eşleştirme yapılamadı.');
      setMatchPreview(mode === 'preview' ? result.summary : null);
      if (mode === 'import') {
        await onUpdated?.();
        setMessage(`${result.imported || 0} yeni teknik tarif kaydı eklendi. Hepsi yönetici kontrolü bekliyor.`);
      }
    } catch (err) {
      setError(err?.message || 'Teknik madde eşleştirmesi tamamlanamadı.');
    } finally {
      setMatching(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground">
            <FileText size={16} /> Teknik şartname / birim fiyat tarifi
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {analysis.technical_file_name ? 'Bağlı belge: ' + analysis.technical_file_name : 'Bu ihaleye henüz teknik belge bağlanmamış.'}
          </p>
        </div>
        {analysis.technical_file_uri && (
          <button type="button" onClick={openTechnical}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground">
            <ExternalLink size={14} className="mr-1 inline" /> Teknik belgeyi aç
          </button>
        )}
      </div>
      {technicalClauseCount > 0 && !analysis.technical_file_uri && (
        <p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-2.5 text-xs text-sky-950">
          {technicalClauseCount} poz için teknik tarif kaynak metni sisteme aktarıldı.
          Ancak özgün Word/PDF dosyasının kendisi henüz bu ihalenin özel dosya alanına bağlanmadı;
          gerektiğinde aşağıdan aynı kaynak dosyayı yükleyebilirsiniz.
          Aktarılan alıntılar yönetici onayı sayılmaz.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-card px-3 py-2 text-xs font-semibold">
          <FileUp size={15} /> {file ? file.name : 'Teknik dosya seç'}
          <input ref={picker} type="file" accept=".pdf,.docx,.doc,.txt,.csv"
            disabled={disabled || saving} onChange={(event) => chooseFile(event.target.files?.[0])}
            className="hidden" />
        </label>
        <button type="button" disabled={disabled || saving || !file} onClick={attach}
          className="rounded-lg bg-slate-900 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-40">
          {saving ? 'Kaydediliyor...' : 'İhaleye bağla'}
        </button>
      </div>
      {analysis.technical_file_uri && (
        <div className="mt-3 rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-bold text-foreground">Poz koduna göre teknik metin eşleştirme</p>
          <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
            DOCX, TXT veya CSV belgelerindeki GASKİ.BO.xx başlıklarını tam poz koduyla eşleştirir.
            PDF için bu özellik henüz desteklenmiyor. İşlem yapay zekâ kredisi kullanmaz ve teknik onay üretmez.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" disabled={disabled || matching}
              onClick={() => matchTechnical('preview')}
              className="rounded-md border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40">
              {matching ? 'İnceleniyor...' : 'Eşleşmeleri Önizle'}
            </button>
            {matchPreview && matchPreview.eligible_for_import > 0 && (
              <button type="button" disabled={disabled || matching}
                onClick={() => matchTechnical('import')}
                className="rounded-md bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">
                {matchPreview.eligible_for_import} yeni maddeyi içe aktar
              </button>
            )}
          </div>
          {matchPreview && (
            <div className="mt-2 rounded-md bg-muted/60 p-3 text-xs leading-5 text-foreground">
              Belgede {matchPreview.clauses_found} poz ·
              mevcut kalemlerle {matchPreview.matched_to_items} eşleşme ·
              {matchPreview.eligible_for_import} yeni kaynak bağlantısı.
              {matchPreview.already_imported > 0 && <p>Önceden eşleştirilen {matchPreview.already_imported} madde korunacak.</p>}
              {matchPreview.unmatched_codes?.length > 0 && (
                <p className="mt-1 text-amber-800">Eşleşmeyen kaynak kodları: {matchPreview.unmatched_codes.join(', ')}</p>
              )}
              {matchPreview.duplicate_source_codes?.length > 0 && (
                <p className="mt-1 text-rose-700">Kaynakta tekrar: {matchPreview.duplicate_source_codes.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-muted-foreground">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        Dosya özel depoda tutulur. Yüklemek teknik şartnamenin otomatik okunduğu veya pozların doğrulandığı anlamına gelmez.
        Doğrulama ve paket onayı yönetici kontrolünde kalır.
      </p>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}
      {message && <p role="status" className="mt-2 text-xs font-semibold text-emerald-700">{message}</p>}
    </section>
  );
}
