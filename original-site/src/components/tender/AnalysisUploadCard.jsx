import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FileUp, Loader2 } from 'lucide-react';

const MAX_MB = 20;
const SUPPORTED = ['pdf', 'csv', 'txt', 'json', 'png', 'jpg', 'jpeg'];
const NEEDS_CONVERSION = ['xlsx', 'xls', 'ods', 'doc', 'docx', 'rtf', 'ppt', 'pptx'];

const fileExtension = (name) => (String(name || '').split('.').pop() || '').toLowerCase();

const readFile = (picked) => {
  if (!picked) return { file: null, error: '' };
  const ext = fileExtension(picked.name);
  if (SUPPORTED.includes(ext)) return { file: picked, error: '' };
  if (NEEDS_CONVERSION.includes(ext)) {
    return {
      file: null,
      error:
        'Excel ve Word dosyaları doğrudan okunamıyor. Dosyayı "Farklı Kaydet" ile PDF veya CSV olarak dışa aktarın, sonra buraya yükleyin.',
    };
  }
  return { file: null, error: 'Desteklenen formatlar: PDF, CSV, TXT veya tablo görseli (PNG/JPG).' };
};

export default function AnalysisUploadCard({ onCreated }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', buyer_name: '', reference_no: '' });
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    if (!file || phase) return;
    setError('');
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Dosya boyutu ${MAX_MB} MB sınırını aşıyor.`);
      return;
    }
    setPhase('Doküman yükleniyor');
    let analysisId = '';
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const created = await base44.entities.TenderAnalysis.create({
        title: form.title.trim() || file.name.replace(/\.[^.]+$/, ''),
        buyer_name: form.buyer_name.trim(),
        reference_no: form.reference_no.trim(),
        document_file_uri: file_uri,
        document_file_name: file.name,
        status: 'uploaded',
      });
      analysisId = created.id;
      setPhase('İş kalemleri ve miktarlar çıkarılıyor');
      const response = await base44.functions.invoke('analyzeTenderDocument', { analysis_id: created.id });
      const result = response?.data || {};
      if (result.ok === false) throw new Error(result.error || 'Analiz tamamlanamadı.');
      setFile(null);
      setForm({ title: '', buyer_name: '', reference_no: '' });
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err?.message || 'Analiz tamamlanamadı. Lütfen tekrar deneyin.');
    } finally {
      setPhase('');
      if (analysisId) await onCreated?.(analysisId);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="text-base font-bold text-foreground">İhale dokümanı yükle</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        PDF, CSV, TXT veya tablo görseli (PNG/JPG) · en fazla {MAX_MB} MB · dosyalar özel olarak saklanır (stored privately).
        Excel/Word dosyalarını önce PDF veya CSV olarak dışa aktarın.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-muted-foreground">
          İhale başlığı
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Boş bırakılırsa dosya adı kullanılır"
            maxLength={180}
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          İdare / müşteri
          <input
            value={form.buyer_name}
            onChange={(e) => setForm((prev) => ({ ...prev, buyer_name: e.target.value }))}
            maxLength={140}
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="text-xs font-semibold text-muted-foreground">
          İKN / referans
          <input
            value={form.reference_no}
            onChange={(e) => setForm((prev) => ({ ...prev, reference_no: e.target.value }))}
            maxLength={60}
            className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:border-accent">
          <FileUp size={16} />
          {file ? file.name : 'Doküman seç'}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.csv,.txt,.json,.png,.jpg,.jpeg,.xlsx,.xls,.ods,.doc,.docx,.rtf,.ppt,.pptx"
            className="hidden"
            disabled={!!phase}
            onChange={(e) => {
              const outcome = readFile(e.target.files?.[0]);
              setFile(outcome.file);
              setError(outcome.error);
            }}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={!file || !!phase}
          className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-bold text-white disabled:opacity-40"
        >
          {phase ? <Loader2 size={15} className="mr-1 inline animate-spin" /> : null}
          {phase || 'Analizi başlat'}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-900">{error}</p>}
    </section>
  );
}