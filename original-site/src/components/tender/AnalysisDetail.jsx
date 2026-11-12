import { base44 } from '@/api/base44Client';
import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkItemsTable from '@/components/tender/WorkItemsTable';
import WorkPackageCard from '@/components/tender/WorkPackageCard';
import NewPackageForm from '@/components/tender/NewPackageForm';
import TechnicalDocumentCard from '@/components/tender/TechnicalDocumentCard';
import { ANALYSIS_STATUS_META, formatMoney, meta } from '@/lib/tenderAnalysis';
import { AlertTriangle, CheckCheck, FileText, Loader2, RefreshCw, Download, ClipboardCheck, Search, X } from 'lucide-react';
import { itemMatchesTenderQuery, packageMatchesTenderQuery, normalizeTenderQuery } from '@/lib/tenderSearch';
import { tenderAudit, tenderAuditCSV } from '@/lib/tenderAudit';
import { getPackageReview } from '@/lib/tenderReview';

export default function AnalysisDetail({
  analysis,
  items = [],
  packages = [],
  technicalClauses = [],
  loading,
  busy,
  onItemPatch,
  onPackagePatch,
  onMoveItem,
  onCreatePackage,
  onDocumentUpdated,
  onRerun,
  onApproveAll,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [packageFilter, setPackageFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState('all');

  useEffect(() => {
    setSearchTerm('');
    setPackageFilter('all');
    setReviewFilter('all');
  }, [analysis?.id]);

  if (!analysis) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-8 text-sm text-muted-foreground">
        Soldan bir analiz seçin veya yeni bir ihale dokümanı yükleyin.
      </div>
    );
  }

  const status = meta(ANALYSIS_STATUS_META, analysis.status);
  const drafts = packages.filter((row) => row.status === 'draft').length;
  const working = busy || analysis.status === 'processing';
  const unready = packages.filter((pkg) => pkg.status === 'draft' && !getPackageReview(pkg, items).complete);
  const readyForAll = drafts > 0 && unready.length === 0 && packages.every((pkg) => pkg.status !== 'rejected');
  const confirmedCount = items.filter((item) => item.review_status === 'confirmed' && String(item.notes || '').trim()).length;
  const audit = tenderAudit(analysis, items, packages);
  const technicalByItem = new Map(technicalClauses.map((row) => [row.work_item_id, row]));
  const technicalCoverage = items.filter((item) => technicalByItem.has(item.id)).length;
  const technicalReviewCount = technicalClauses.filter((row) => row.review_status === 'reviewed').length;
  const term = normalizeTenderQuery(searchTerm);
  const itemPackageNames = new Map();
  const itemPackageIds = new Map();
  for (const pkg of packages) {
    for (const id of pkg.item_ids || []) {
      itemPackageNames.set(id, [...(itemPackageNames.get(id) || []), pkg.name]);
      itemPackageIds.set(id, [...(itemPackageIds.get(id) || []), pkg.id]);
    }
  }
  const matchesReview = (item) => reviewFilter === 'all' || item.review_status === reviewFilter;
  const matchingItems = items.filter((item) => {
    if (packageFilter !== 'all' && !(itemPackageIds.get(item.id) || []).includes(packageFilter)) return false;
    if (!matchesReview(item)) return false;
    if (!term) return true;
    return itemMatchesTenderQuery(item, term) ||
      (itemPackageNames.get(item.id) || []).some((name) => normalizeTenderQuery(name).includes(term));
  });
  const matchingPackages = packages.filter((pkg) => {
    if (packageFilter !== 'all' && pkg.id !== packageFilter) return false;
    const linked = (pkg.item_ids || []).map((id) => items.find((row) => row.id === id)).filter(Boolean);
    if (reviewFilter !== 'all' && !linked.some(matchesReview)) return false;
    if (!term) return true;
    return packageMatchesTenderQuery(pkg, term) ||
      linked.some((row) => itemMatchesTenderQuery(row, term));
  });
  const filtersActive = Boolean(searchTerm || packageFilter !== 'all' || reviewFilter !== 'all');
  const clearFilters = () => {
    setSearchTerm('');
    setPackageFilter('all');
    setReviewFilter('all');
  };

  const downloadAudit = () => {
    const csv = tenderAuditCSV(analysis, items, packages);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `Atlas_Ihale_Denetim_${analysis.reference_no || 'Kayit'}_${stamp}.csv`
      .replace(/[^a-zA-Z0-9_.-]/g, '_');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const openDocument = async () => {
    if (!analysis.document_file_uri) return;
    const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
      file_uri: analysis.document_file_uri,
    });
    window.open(signed_url, '_blank');
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">{analysis.title}</h2>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${status.className}`}>
              {working ? 'Analiz ediliyor' : status.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {[analysis.reference_no, analysis.buyer_name, analysis.document_file_name].filter(Boolean).join(' · ') || 'Doküman bilgisi yok'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openDocument}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground hover:border-accent"
          >
            <FileText size={14} className="mr-1 inline" />
            Dokümanı aç
          </button>
          <button
            type="button"
            disabled={loading || working || !items.length}
            onClick={downloadAudit}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-40"
            title="Pozlar, bağlı paketler, kontrol durumları ve teknik notları CSV indir"
          >
            <Download size={14} className="mr-1 inline" />
            Denetim CSV İndir
          </button>
          <button
            type="button"
            disabled={working}
            onClick={onRerun}
            className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-40"
          >
            {working ? <Loader2 size={14} className="mr-1 inline animate-spin" /> : <RefreshCw size={14} className="mr-1 inline" />}
            Yeniden analiz et
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['İş kalemi', analysis.item_count || items.length || 0],
          ['Alt iş paketi', analysis.package_count || packages.length || 0],
          ['Tahmini bedel', formatMoney(analysis.total_estimated, analysis.currency)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border bg-background p-3">
            <p className="text-[11px] text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-black text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <TechnicalDocumentCard key={analysis.id} analysis={analysis} disabled={working} onUpdated={onDocumentUpdated} technicalClauseCount={technicalCoverage} />

      {analysis.summary && <p className="rounded-lg bg-muted/60 p-3 text-xs leading-5 text-foreground">{analysis.summary}</p>}

      {analysis.extraction_note && (
        <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          {analysis.extraction_note}
        </p>
      )}

      <div className="rounded-lg border border-border bg-background p-3 text-xs text-foreground">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={15} />
          <strong>Atama ve veri bütünlüğü denetimi</strong>
        </div>
        <p className="mt-2">
          {audit.linkedOnce}/{audit.itemCount} kalem tam bir pakete bağlı ·
          {audit.issues.length} veri uyarısı ·
          {audit.annotated} ön inceleme notu ·
          {audit.confirmed} yönetici doğrulaması
        </p>
        {audit.issues.length === 0 ? (
          <p className="mt-1 text-muted-foreground">
            Poz atamaları ve birim alanlarında yapısal tutarsızlık görülmedi. Teknik uygunluk ayrıca doğrulanmalıdır.
          </p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-4 text-rose-700">
            {audit.issues.slice(0, 12).map((issue, index) => (
              <li key={index}>{issue.message}</li>
            ))}
            {audit.issues.length > 12 && <li>Ve {audit.issues.length - 12} başka uyarı. Tam listeyi CSV ile kontrol edin.</li>}
          </ul>
        )}
        <p className="mt-2 text-sky-800">
          Teknik tarif eşleşmesi: {technicalCoverage}/{items.length} poz ·
          Yönetici tarafından incelenmiş teknik madde: {technicalReviewCount}/{technicalClauses.length}.
        </p>
        {audit.noPrices > 0 && (
          <p className="mt-2 text-amber-700">
            {audit.noPrices} pozda geçerli birim fiyat bulunmadığı için toplam maliyet hesaplanamaz.
          </p>
        )}
      </div>
      <div className="rounded-lg border border-border bg-background p-3 text-xs text-foreground">
        <strong>Teknik kontrol durumu:</strong> {confirmedCount}/{items.length} iş kalemi notla doğrulandı.
        <p className="mt-1 text-muted-foreground">
          Teknik şartname ayrıca kontrol edilmeli; bu ekran yalnızca yönetici incelemesini kaydeder.
          Kontrol edilmeyen veya hariç bırakılan iş kalemleri bulunan paketler onaylanamaz.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={working || !readyForAll}
          onClick={onApproveAll}
          className="rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
        >
          <CheckCheck size={14} className="mr-1 inline" />
          Tüm taslak paketleri onayla
        </button>
        <p className="text-[11px] text-muted-foreground">
          {drafts ? `${drafts} paket onay bekliyor; ${unready.length} paket teknik kontrolü tamamlanmadı.` : 'Onay bekleyen taslak paket yok.'}
        </p>
      </div>

      <section className="rounded-xl border border-border bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="atlas-tender-search" className="flex items-center gap-2 text-xs font-bold text-foreground">
            <Search size={16} /> Poz ve iş paketi arama
          </label>
          {filtersActive && (
            <button type="button" onClick={clearFilters}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-semibold">
              <X size={13} /> Filtreleri temizle
            </button>
          )}
        </div>
        <input id="atlas-tender-search" type="search"
          value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Örn. GASKİ.BO.67, galvaniz, korkuluk, AISI 304"
          autoComplete="off"
          className="mt-2 block w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground"
        />
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <label className="text-[11px] font-semibold text-muted-foreground">
            İş paketi
            <select value={packageFilter} onChange={(event) => setPackageFilter(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground">
              <option value="all">Tüm iş paketleri</option>
              {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-muted-foreground">
            Teknik kontrol durumu
            <select value={reviewFilter} onChange={(event) => setReviewFilter(event.target.value)}
              className="mt-1 block w-full rounded-lg border border-border bg-card px-2 py-2 text-xs text-foreground">
              <option value="all">Tüm kalemler</option>
              <option value="pending">Kontrol bekliyor</option>
              <option value="confirmed">Yönetici doğruladı</option>
              <option value="excluded">Hariç tutuldu</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Eşleşen: {matchingItems.length}/{items.length} poz · {matchingPackages.length}/{packages.length} iş paketi.
          Arama yalnızca görünümü filtreler; kayıtları değiştirmez.
        </p>
      </section>

      <Tabs defaultValue="packages">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="packages">Alt iş paketleri ({packages.length})</TabsTrigger>
          <TabsTrigger value="items">İş kalemleri ({items.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="mt-3">
          <NewPackageForm disabled={working || analysis.status !== 'review_ready'} onCreate={onCreatePackage} />
          {loading ? (
            <p className="text-sm text-muted-foreground">Yükleniyor…</p>
          ) : matchingPackages.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {matchingPackages.map((pkg) => (
                <WorkPackageCard key={pkg.id} pkg={pkg} items={items} packages={packages} technicalByItem={technicalByItem}
                  busy={working} onPatch={onPackagePatch} onItemPatch={onItemPatch} onMoveItem={onMoveItem}
                  searchTerm={searchTerm} reviewFilter={reviewFilter} />
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              {filtersActive ? 'Arama ve filtre koşullarına uygun paket bulunamadı.' : 'Taslak paket bulunamadı. Yeniden analiz ederek paketleme adımını tekrar çalıştırın.'}
            </p>
          )}
        </TabsContent>
        <TabsContent value="items" className="mt-3">
          {loading ? <p className="text-sm text-muted-foreground">Yükleniyor…</p> : <WorkItemsTable
            items={matchingItems} totalCount={items.length} onPatch={onItemPatch} packageNamesByItemId={itemPackageNames} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}