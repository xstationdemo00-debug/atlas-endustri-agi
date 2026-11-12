import { FileText, ShieldAlert } from 'lucide-react';

export default function TechnicalClausePreview({ clause }) {
  if (!clause) {
    return (
      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[11px] text-amber-900">
        Bu poz için teknik tarif kaydı eşleştirilmedi. Şartname kontrolü gerekli.
      </p>
    );
  }
  const label = clause.review_status === 'reviewed'
    ? 'Yönetici gözden geçirdi'
    : clause.review_status === 'flagged' ? 'Teknik inceleme işareti' : 'Yönetici kontrolü bekliyor';
  return (
    <details className="mt-2 rounded-lg border border-sky-200 bg-sky-50/60 text-[11px] text-slate-900">
      <summary className="cursor-pointer px-3 py-2 font-semibold">
        <span className="mr-2 inline-flex items-center gap-1"><FileText size={13} /> Teknik tarif metni</span>
        <span className="font-normal text-muted-foreground">· Kaynak s. {clause.source_page || '—'} · {label}</span>
      </summary>
      <div className="space-y-2 border-t border-sky-200 px-3 py-3">
        <p className="font-bold">{clause.source_section}</p>
        <p className="text-muted-foreground">Belge: {clause.source_file_name}</p>
        <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-white p-3 leading-5">
          {clause.source_text || 'Kaynak metin boş.'}
        </div>
        <p className="flex items-start gap-2 leading-5 text-amber-900">
          <ShieldAlert size={13} className="mt-0.5 shrink-0" />
          Poz koduna göre eşleştirilmiş kaynak alıntısıdır. Otomatik teknik uygunluk ya da mühendislik onayı değildir.
        </p>
      </div>
    </details>
  );
}
