import { useEffect, useState } from 'react';
import { itemMatchesTenderQuery, packageMatchesTenderQuery, normalizeTenderQuery } from '@/lib/tenderSearch';
import { Check, X, ChevronDown, Pencil, ArrowRightLeft, RotateCcw } from 'lucide-react';
import { getPackageReview, TECH_REVIEW_INVALID } from '@/lib/tenderReview';
import TechnicalClausePreview from '@/components/tender/TechnicalClausePreview';
import {
  PACKAGE_STATUS_META,
  PACKAGE_TYPE_LABELS,
  capabilityLabel,
  formatMoney,
  formatQty,
  meta,
} from '@/lib/tenderAnalysis';

export default function WorkPackageCard({ pkg, items = [], packages = [], technicalByItem = new Map(), busy, onPatch, onItemPatch, onMoveItem, searchTerm = '', reviewFilter = 'all' }) {
  const status = meta(PACKAGE_STATUS_META, pkg.status);
  const review = getPackageReview(pkg, items);
  const linked = review.linked;
  const editable = pkg.status === 'draft';
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(pkg.name || '');
  const [destinations, setDestinations] = useState({});
  const targets = packages.filter((other) => other.id !== pkg.id && other.status === 'draft');
  const term = normalizeTenderQuery(searchTerm);
  const nameMatches = term && packageMatchesTenderQuery(pkg, term);
  const matchingRows = linked.filter((row) =>
    (reviewFilter === 'all' || row.review_status === reviewFilter) &&
    (!term || nameMatches || itemMatchesTenderQuery(row, term))
  );

  useEffect(() => {
    if ((term.length >= 3 && !nameMatches && matchingRows.length > 0) ||
        (reviewFilter !== 'all' && matchingRows.length > 0)) {
      setExpanded(true);
    }
  }, [term, nameMatches, matchingRows.length, reviewFilter, pkg.id]);

  const saveName = async () => {
    const next = draftName.trim().slice(0, 120);
    if (next && next !== pkg.name) await onPatch(pkg, { name: next });
    setEditingName(false);
  };

  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {editingName && editable ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={draftName}
                aria-label="Paket adı"
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={120}
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-sm font-bold text-foreground"
              />
              <button type="button" disabled={busy || !draftName.trim()} onClick={saveName}
                className="rounded-md border border-border px-2 py-1 text-xs font-semibold disabled:opacity-40">Kaydet</button>
              <button type="button" onClick={() => { setDraftName(pkg.name || ''); setEditingName(false); }}
                className="rounded-md border border-border px-2 py-1 text-xs">İptal</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="min-w-0 flex-1 text-sm font-bold text-foreground">{pkg.name}</h3>
              {editable && <button type="button" onClick={() => { setDraftName(pkg.name || ''); setEditingName(true); }}
                disabled={busy} title="Paket adını değiştir" aria-label="Paket adını değiştir"
                className="rounded-md border border-border p-1.5 text-muted-foreground disabled:opacity-40">
                <Pencil size={14} />
              </button>}
            </div>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            {PACKAGE_TYPE_LABELS[pkg.work_package_type] || 'Diğer'}
            {pkg.discipline ? ` · ${pkg.discipline}` : ''}
          </p>
        </div>
        <span className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      {pkg.scope_description && <p className="mt-2 text-xs leading-5 text-muted-foreground">{pkg.scope_description}</p>}

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-foreground">
        <span>{linked.length} kalem</span>
        {pkg.quantity_summary && <span className="font-normal text-muted-foreground">{pkg.quantity_summary}</span>}
        <span className="font-normal text-muted-foreground">Tahmini bedel: {formatMoney(pkg.estimated_value, pkg.currency)}</span>
      </div>

      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-left text-xs font-bold text-foreground"
      >
        {expanded ? 'Detayları Gizle' : `Detayları Gör (${linked.length} kalem)`}
        {(term || reviewFilter !== 'all') && <span className="ml-1 text-[10px] font-medium text-muted-foreground">({matchingRows.length} eşleşen)</span>}
        <ChevronDown size={16} className={expanded ? 'rotate-180' : ''} />
      </button>
      {expanded && (
        <div className="mt-2 space-y-2">
          {matchingRows.length === 0 ? (
            <p className="rounded-md border border-amber-200 p-3 text-xs text-amber-800">Bu filtrede iş kalemi bulunamadı.</p>
          ) : matchingRows.map((row) => (
            <div key={row.id} className="rounded-lg border border-border bg-background p-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="font-bold text-foreground">{row.code || `Poz ${row.position_no || '—'}`}</span>
                <span className="font-bold tabular-nums text-foreground">{formatQty(row.quantity)} {row.unit || ''}</span>
              </div>
              <p className="mt-1 leading-5 text-foreground">{row.description}</p>
              <TechnicalClausePreview clause={technicalByItem.get(row.id)} />
              {row.category && <p className="mt-1 text-[11px] text-muted-foreground">Uzmanlık: {row.category}</p>}
              <p className="mt-2 text-[11px] font-semibold text-muted-foreground">
                Durum: {row.review_status === 'confirmed' ? 'Doğrulandı' : row.review_status === 'excluded' ? 'Hariç tutuldu' : 'Kontrol bekliyor'}
              </p>
              {editable && (
                <div className="mt-2 space-y-2 border-t border-border pt-2">
                  <label className="block text-[11px] font-semibold text-foreground">
                    Teknik kontrol notu (şartname maddesi / belge referansı)
                    <textarea
                      key={row.id}
                      rows={2}
                      defaultValue={row.notes || ''}
                      disabled={busy}
                      onBlur={(event) => {
                        const note = event.target.value.trim().slice(0, 1000);
                        if (note !== (row.notes || '')) onItemPatch(row, { notes: note, review_status: 'pending' });
                      }}
                      placeholder="Belgeye bakmadan doğrulama yapmayın. Kontrol edilen teknik maddeyi yazın."
                      className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-xs text-foreground disabled:opacity-50"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {row.review_status !== 'confirmed' ? (
                      <button type="button" disabled={busy || !String(row.notes || '').trim()}
                        onClick={() => onItemPatch(row, { review_status: 'confirmed' })}
                        className="rounded-md border border-emerald-300 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 disabled:opacity-40">
                        <Check size={12} className="mr-1 inline" />Kalemi doğrula
                      </button>
                    ) : (
                      <button type="button" disabled={busy}
                        onClick={() => onItemPatch(row, { review_status: 'pending' })}
                        className="rounded-md border border-border px-2.5 py-1.5 text-[11px] font-semibold">
                        <RotateCcw size={12} className="mr-1 inline" />Kontrolü geri al
                      </button>
                    )}
                  </div>
                  {targets.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="min-w-0 flex-1 text-[11px] font-semibold text-foreground">
                        Başka pakete taşı
                        <select value={destinations[row.id] || ''} disabled={busy}
                          onChange={(event) => setDestinations((prev) => ({ ...prev, [row.id]: event.target.value }))}
                          className="mt-1 w-full rounded-md border border-border bg-card px-2 py-2 text-xs text-foreground">
                          <option value="">Hedef paket seçin</option>
                          {targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
                        </select>
                      </label>
                      <button type="button" disabled={busy || !destinations[row.id]}
                        onClick={() => onMoveItem(pkg, row, destinations[row.id])}
                        className="self-end rounded-md border border-border px-3 py-2 text-[11px] font-bold text-foreground disabled:opacity-40">
                        <ArrowRightLeft size={12} className="mr-1 inline" />Kalem Taşı
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(pkg.required_capabilities || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {pkg.required_capabilities.map((tag) => (
            <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
              {capabilityLabel(tag)}
            </span>
          ))}
        </div>
      )}

      <p className="mt-3 rounded-lg border border-border bg-background p-2 text-[11px] font-semibold text-foreground">
        Doğrulanan: {review.confirmed}/{linked.length}
        {review.missing > 0 ? ` · ${review.missing} eksik kayıt` : ''}
        {review.excluded > 0 ? ` · ${review.excluded} hariç kalem` : ''}
        {!review.technicalNotePresent ? ' · Paket teknik kontrolü gerekli' : ''}
      </p>
      {String(pkg.admin_note || '').startsWith(TECH_REVIEW_INVALID) && (
        <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2 text-[11px] text-amber-900">
          Paketin kapsamı değişti. Önceki teknik notu yeniden inceleyin ve doğruladıktan sonra başındaki uyarıyı kaldırın.
        </p>
      )}
      <label className="mt-3 block text-[11px] font-semibold text-muted-foreground">
        Teknik şartname / paket kapsamı kontrol notu
        <textarea
          key={pkg.updated_date || pkg.id}
          defaultValue={pkg.admin_note || ''}
          rows={2}
          onBlur={(e) => {
            const next = e.target.value.slice(0, 500);
            if (next !== (pkg.admin_note || '')) onPatch(pkg, { admin_note: next });
          }}
          className="mt-1 block w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        {pkg.status !== 'approved' && (
          <button
            type="button"
            disabled={busy || !review.complete}
            title={review.complete ? 'Paketi onayla' : 'Önce kalemleri ve teknik notları doğrulayın'}
            onClick={() => {
              if (window.confirm(`"${pkg.name}" paketi içindeki ${linked.length} kalemi, miktarları ve teknik şartnameyi kontrol ederek onaylıyor musunuz?`)) {
                onPatch(pkg, { status: 'approved' });
              }
            }}
            className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
          >
            <Check size={13} className="mr-1 inline" />
            Onayla
          </button>
        )}
        {pkg.status !== 'rejected' && (
          <button
            type="button"
            disabled={busy}
            onClick={() => onPatch(pkg, { status: 'rejected' })}
            className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 disabled:opacity-40"
          >
            <X size={13} className="mr-1 inline" />
            Reddet
          </button>
        )}
      </div>
    </article>
  );
}