import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import PageHeader from '@/components/PageHeader';
import AnalysisUploadCard from '@/components/tender/AnalysisUploadCard';
import AnalysisList from '@/components/tender/AnalysisList';
import AnalysisDetail from '@/components/tender/AnalysisDetail';
import { getPackageReview, TECH_REVIEW_INVALID } from '@/lib/tenderReview';
import { AlertTriangle, FileSearch, RefreshCw, ShieldAlert } from 'lucide-react';

export default function TenderAnalysisEngine() {
  const { user } = useAuth();
  const admin = user?.role === 'admin';
  const [analyses, setAnalyses] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [items, setItems] = useState([]);
  const [packages, setPackages] = useState([]);
  const [technicalClauses, setTechnicalClauses] = useState([]);
  const [counts, setCounts] = useState({ items: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const loadAnalyses = useCallback(
    async (preferredId) => {
      if (!admin) {
        setLoading(false);
        return;
      }
      setError('');
      try {
        const rows = await base44.entities.TenderAnalysis.list('-created_date', 80);
        const list = Array.isArray(rows) ? rows : rows?.items || [];
        setAnalyses(list);
        const [itemTotal, draftTotal] = await Promise.all([
          base44.entities.TenderWorkItem.count({}),
          base44.entities.TenderWorkPackage.count({ status: 'draft' }),
        ]);
        setCounts({ items: itemTotal || 0, drafts: draftTotal || 0 });
        setSelectedId((current) => {
          const next = preferredId || current;
          return list.some((row) => row.id === next) ? next : list[0]?.id || '';
        });
      } catch (err) {
        setError('Analiz kayıtları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    },
    [admin]
  );

  const loadDetail = useCallback(async (id) => {
    if (!id) {
      setItems([]);
      setPackages([]);
      setTechnicalClauses([]);
      return;
    }
    setDetailLoading(true);
    try {
      const [itemRows, packageRows, technicalRows] = await Promise.all([
        base44.entities.TenderWorkItem.filter({ analysis_id: id }, { sort: 'sort_order', limit: 200 }),
        base44.entities.TenderWorkPackage.filter({ analysis_id: id }, { limit: 30 }),
        base44.entities.TenderTechnicalClause.filter({ analysis_id: id }, { limit: 200 }),
      ]);
      setItems(Array.isArray(itemRows) ? itemRows : itemRows?.items || []);
      setPackages(Array.isArray(packageRows) ? packageRows : packageRows?.items || []);
      setTechnicalClauses(Array.isArray(technicalRows) ? technicalRows : technicalRows?.items || []);
    } catch (err) {
      setError('Analiz detayı yüklenemedi.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalyses();
  }, [loadAnalyses]);

  useEffect(() => {
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const current = analyses.find((row) => row.id === selectedId) || null;

  const handleCreated = async (id) => {
    await loadAnalyses(id);
    await loadDetail(id);
  };

  const rerun = async () => {
    if (!current || busy) return;
    if (technicalClauses.length) {
      setError('Bu ihalede teknik şartname kaynak eşleştirmeleri var. Yeniden analiz poz kimliklerini değiştirip kaynak bağlantılarını bozabilir. Mevcut analizi koruyun; yeni cetvel için ayrı bir analiz kaydı açın.');
      return;
    }
    if (current.status === 'approved') {
      setError('Onaylanmış ihale yeniden analiz edilemez.');
      return;
    }
    if (!window.confirm('Yeniden analiz mevcut iş kalemlerini, paketleri ve kontrol notlarını SİLER. Devam etmek istiyor musunuz?')) return;
    setBusy(true);
    setError('');
    try {
      const response = await base44.functions.invoke('analyzeTenderDocument', { analysis_id: current.id });
      const result = response?.data || {};
      if (result.ok === false) setError(result.error || 'Analiz tamamlanamadı.');
    } catch (err) {
      setError('Analiz yeniden çalıştırılamadı.');
    } finally {
      await loadAnalyses(current.id);
      await loadDetail(current.id);
      setBusy(false);
    }
  };

  const patchItem = async (item, patch) => {
    if (busy || packages.some((pkg) => pkg.status === 'approved' && (pkg.item_ids || []).includes(item.id))) {
      setError('Onaylı paketteki iş kalemi değiştirilemez.');
      return;
    }
    if (patch.review_status === 'confirmed' && !String(patch.notes ?? item.notes ?? '').trim()) {
      setError('Kalemi doğrulamadan önce teknik şartname / belge kontrol notu yazın.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await base44.entities.TenderWorkItem.update(item.id, patch);
      setItems((rows) => rows.map((row) => (row.id === item.id ? { ...row, ...patch } : row)));
    } catch (err) {
      setError('Kalem güncellenemedi. Tekrar deneyin.');
    } finally {
      setBusy(false);
    }
  };

  const createPackage = async (form) => {
    if (!current || busy || current.status !== 'review_ready') {
      setError('Yalnızca kontrol aşamasındaki ihaleye taslak paket eklenebilir.');
      return false;
    }
    const name = String(form.name || '').trim().slice(0, 120);
    const workPackageType = String(form.work_package_type || 'other');
    const allowedTypes = [
      'industrial_fabrication', 'material_supply', 'mechanical_installation',
      'turnkey_project', 'maintenance_shutdown', 'industrial_logistics', 'other',
    ];
    if (!name || !allowedTypes.includes(workPackageType)) {
      setError('Paket adı ve türü geçerli olmalı.');
      return false;
    }
    if (packages.some((row) => row.name.trim().toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) {
      setError('Bu isimle bir paket zaten var.');
      return false;
    }
    setBusy(true);
    setError('');
    try {
      const existing = await base44.entities.TenderWorkPackage.filter({ analysis_id: current.id }, { limit: 200 });
      const currentPackages = Array.isArray(existing) ? existing : existing?.items || [];
      if (currentPackages.some((row) => row.name.trim().toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'))) {
        throw new Error('Bu isimle paket zaten var. Sayfayı yenileyin.');
      }
      await base44.entities.TenderWorkPackage.create({
        analysis_id: current.id,
        name,
        scope_description: String(form.scope_description || '').trim().slice(0, 600),
        discipline: String(form.discipline || '').trim().slice(0, 80),
        work_package_type: workPackageType,
        item_ids: [],
        item_count: 0,
        quantity_summary: '',
        estimated_value: 0,
        currency: current.currency || 'TRY',
        required_capabilities: workPackageType === 'industrial_logistics' ? ['logistics'] : [],
        matching_priority: workPackageType === 'industrial_logistics' ? 'related_process' : 'open',
        status: 'draft',
        is_demo: !!current.is_demo,
      });
      const all = await base44.entities.TenderWorkPackage.filter({ analysis_id: current.id }, { limit: 200 });
      const count = (Array.isArray(all) ? all : all?.items || []).length;
      await base44.entities.TenderAnalysis.update(current.id, { package_count: count });
      setAnalyses((rows) => rows.map((row) => row.id === current.id ? { ...row, package_count: count } : row));
      await loadDetail(current.id);
      const draftTotal = await base44.entities.TenderWorkPackage.count({ status: 'draft' });
      setCounts((previous) => ({ ...previous, drafts: draftTotal || 0 }));
      return true;
    } catch (err) {
      setError(err?.message || 'Taslak paket oluşturulamadı. Kayıtları kontrol edin.');
      await loadDetail(current.id);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const moveItem = async (source, item, targetId) => {
    if (busy || !current || !targetId || source.id === targetId) return;
    const target = packages.find((pkg) => pkg.id === targetId);
    if (!target || source.status !== 'draft' || target.status !== 'draft' ||
        !(source.item_ids || []).includes(item.id) || (target.item_ids || []).includes(item.id)) {
      setError('Kalem taşınamadı. Kaynak ve hedef paketler taslak olmalı.');
      return;
    }
    if (!window.confirm(`${item.code || item.description} kalemini "${source.name}" paketinden "${target.name}" paketine taşımak istiyor musunuz?`)) return;

    setBusy(true);
    setError('');
    let targetWritten = false;
    let sourceWritten = false;
    let originalTarget = null;
    try {
      // İşlem öncesinde sunucudaki kayıtları yeniden kontrol et.
      const [freshSource, freshTarget] = await Promise.all([
        base44.entities.TenderWorkPackage.get(source.id),
        base44.entities.TenderWorkPackage.get(target.id),
      ]);
      if (freshSource.status !== 'draft' || freshTarget.status !== 'draft' ||
          !(freshSource.item_ids || []).includes(item.id) || (freshTarget.item_ids || []).includes(item.id)) {
        throw new Error('Paket kayıtları değişmiş; sayfa yenilenmeli.');
      }
      const sourceIds = freshSource.item_ids.filter((rowId) => rowId !== item.id);
      const targetIds = [...freshTarget.item_ids, item.id];
      originalTarget = freshTarget;
      if (item.review_status === 'confirmed') {
        // Taşınan kalemin önceki teknik doğrulaması yeni pakete aktarılmaz.
        await base44.entities.TenderWorkItem.update(item.id, { review_status: 'pending' });
      }
      const packagePatch = (ids, prior) => {
        const selected = ids.map((rowId) => items.find((row) => row.id === rowId)).filter(Boolean);
        return {
          item_ids: ids,
          item_count: ids.length,
          quantity_summary: [...new Set(selected.map((row) => row.unit).filter(Boolean))].slice(0, 3).join(' · '),
          estimated_value: Number(selected.reduce((sum, row) => sum + (Number(row.line_total) || 0), 0).toFixed(2)),
          // Paket kapsamı değişince önceki teknik kontrol notu geçerli sayılmaz.
          admin_note: String(prior.admin_note || '').startsWith(TECH_REVIEW_INVALID)
            ? prior.admin_note
            : `${TECH_REVIEW_INVALID}\n${prior.admin_note || ''}`,
        };
      };
      // Önce hedefe ekle, ardından kaynaktan çıkar; hata halinde hedefi geri al.
      await base44.entities.TenderWorkPackage.update(target.id, packagePatch(targetIds, freshTarget));
      targetWritten = true;
      await base44.entities.TenderWorkPackage.update(source.id, packagePatch(sourceIds, freshSource));
      sourceWritten = true;
      await loadDetail(current.id);
    } catch (err) {
      if (targetWritten && !sourceWritten && originalTarget) {
        try {
          await base44.entities.TenderWorkPackage.update(target.id, {
            item_ids: originalTarget.item_ids,
            item_count: originalTarget.item_count,
            quantity_summary: originalTarget.quantity_summary,
            estimated_value: originalTarget.estimated_value,
          });
        } catch (rollbackError) {
          setError('Kalem taşımada hata oluştu ve geri alma tamamlanamadı. Paketleri kontrol edin.');
        }
      }
      await loadDetail(current.id);
      setError((previous) => previous || 'Kalem taşıma tamamlanamadı. Güncel kayıtları kontrol edin.');
    } finally {
      setBusy(false);
    }
  };

  const patchPackage = async (pkg, patch) => {
    if (busy) return;
    if (patch.status === 'approved' && !getPackageReview(pkg, items).complete) {
      setError('Paket onayı için bütün kalemlerin belgeli kontrolü ve paket teknik notu gerekiyor.');
      return;
    }
    const data = { ...patch };
    if (patch.status === 'approved') {
      data.approved_at = new Date().toISOString();
      data.approved_by_email = user?.email || '';
    }
    await base44.entities.TenderWorkPackage.update(pkg.id, data);
    const next = packages.map((row) => (row.id === pkg.id ? { ...row, ...data } : row));
    setPackages(next);

    if (current && next.length && next.every((row) => row.status === 'approved')) {
      const approval = {
        status: 'approved',
        approved_at: data.approved_at || new Date().toISOString(),
        approved_by_email: user?.email || '',
      };
      await base44.entities.TenderAnalysis.update(current.id, approval);
      setAnalyses((rows) => rows.map((row) => (row.id === current.id ? { ...row, ...approval } : row)));
    }

    const draftTotal = await base44.entities.TenderWorkPackage.count({ status: 'draft' });
    setCounts((prev) => ({ ...prev, drafts: draftTotal || 0 }));
  };

  const approveAll = async () => {
    if (!current || busy) return;
    const drafts = packages.filter((pkg) => pkg.status === 'draft');
    if (!drafts.length || packages.some((pkg) => pkg.status === 'rejected') ||
        drafts.some((pkg) => !getPackageReview(pkg, items).complete)) {
      setError('Toplu onay için bütün taslak paketlerin teknik incelemesi bitmeli; reddedilmiş paket olmamalı.');
      return;
    }
    if (!window.confirm(`${drafts.length} taslak paketin tüm poz, miktar ve teknik şartname kontrollerini tamamladığınızı onaylıyor musunuz?`)) return;
    setBusy(true);
    setError('');
    try {
      const approvedAt = new Date().toISOString();
      await base44.entities.TenderWorkPackage.updateMany(
        { analysis_id: current.id, status: 'draft' },
        { $set: { status: 'approved', approved_at: approvedAt, approved_by_email: user?.email || '' } }
      );
      await base44.entities.TenderAnalysis.update(current.id, {
        status: 'approved',
        approved_at: approvedAt,
        approved_by_email: user?.email || '',
      });
    } catch (err) {
      setError('Paketler onaylanamadı. Lütfen tekrar deneyin.');
    } finally {
      await loadAnalyses(current.id);
      await loadDetail(current.id);
      setBusy(false);
    }
  };

  if (!admin) {
    return (
      <div className="rounded-xl border border-border bg-card p-8">
        <ShieldAlert className="text-amber-600" />
        <h1 className="mt-3 font-heading text-xl font-bold text-foreground">İhale analiz motoru</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bu alan yalnızca yetkili yöneticiye açıktır.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <PageHeader
        title="İhale analiz motoru"
        description="İhale dokümanını yükleyin; iş kalemleri ve miktarlar çıkarılır, taslak alt iş paketleri hazırlanır. Paketler yönetici onayı olmadan eşleştirmeye açılmaz."
        badge={
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
            <FileSearch size={12} className="mr-1 inline" />
            Yönetici alanı
          </span>
        }
      >
        <button
          type="button"
          onClick={() => loadAnalyses(selectedId)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground"
        >
          <RefreshCw size={15} className="mr-1 inline" />
          Yenile
        </button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ['Analiz edilen ihale', analyses.length],
          ['Çıkarılan iş kalemi', counts.items],
          ['Onay bekleyen paket', counts.drafts],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
          </div>
        ))}
      </div>

      <p className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        Otomatik çıkarım taslaktır. Miktar, birim ve kapsamı resmî ihale dokümanından doğrulamadan hiçbir paketi onaylamayın.
        Sistem fiyat, süre veya katılım yeterliği üretmez; taranmış görüntü PDF'lerde tablo okunamayabilir.
      </p>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
          {error}
        </p>
      )}

      <AnalysisUploadCard onCreated={handleCreated} />

      <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
        <AnalysisList analyses={analyses} selectedId={selectedId} onSelect={setSelectedId} loading={loading} />
        <AnalysisDetail
          analysis={current}
          items={items}
          packages={packages}
          technicalClauses={technicalClauses}
          loading={detailLoading}
          busy={busy}
          onItemPatch={patchItem}
          onPackagePatch={patchPackage}
          onMoveItem={moveItem}
          onCreatePackage={createPackage}
          onDocumentUpdated={() => loadAnalyses(selectedId)}
          onRerun={rerun}
          onApproveAll={approveAll}
        />
      </div>
    </div>
  );
}