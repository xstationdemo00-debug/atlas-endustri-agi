import { ANALYSIS_STATUS_META, meta } from '@/lib/tenderAnalysis';

export default function AnalysisList({ analyses = [], selectedId, onSelect, loading }) {
  return (
    <div className="space-y-2">
      {loading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
      {!loading && !analyses.length && (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
          Henüz analiz yok. Bir ihale dokümanı yükleyerek başlayın.
        </p>
      )}
      {analyses.map((row) => {
        const status = meta(ANALYSIS_STATUS_META, row.status);
        return (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            className={
              'block w-full rounded-xl border p-3 text-left transition ' +
              (row.id === selectedId ? 'border-amber-400 bg-amber-50' : 'border-border bg-card hover:border-amber-300')
            }
          >
            <strong className="block text-sm font-semibold text-foreground">{row.title}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              {[row.reference_no, row.buyer_name].filter(Boolean).join(' · ') || 'Referans girilmedi'}
            </span>
            <span className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
                {status.label}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {row.item_count || 0} kalem · {row.package_count || 0} paket
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}