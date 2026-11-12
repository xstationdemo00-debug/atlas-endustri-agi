import WorkItemRow from '@/components/tender/WorkItemRow';

export default function WorkItemsTable({ items = [], onPatch, packageNamesByItemId = new Map(), totalCount = items.length }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
        {totalCount ? 'Bu filtrelere uygun iş kalemi bulunamadı.' : 'Bu analiz için henüz iş kalemi yok.'}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[880px] text-left">
        <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-semibold">Poz</th>
            <th className="px-3 py-2 font-semibold">İş kalemi</th>
            <th className="px-2 py-2 font-semibold">Birim</th>
            <th className="px-2 py-2 font-semibold">Miktar</th>
            <th className="px-3 py-2 font-semibold">Paket</th>
            <th className="px-3 py-2 font-semibold">Durum</th>
            <th className="px-3 py-2 text-right font-semibold">İşlem</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <WorkItemRow key={item.id} item={item} onPatch={onPatch} packageNames={packageNamesByItemId.get(item.id) || []} />
          ))}
        </tbody>
      </table>
    </div>
  );
}