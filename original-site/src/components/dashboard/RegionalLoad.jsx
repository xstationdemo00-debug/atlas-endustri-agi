export default function RegionalLoad({ regions }) {
  const max = Math.max(...regions.map((region) => region.value));

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="font-heading text-sm font-bold text-foreground">Bölgesel iş gücü yoğunluğu</h3>
      <p className="text-xs text-muted-foreground">Aktif ekip havuzu dağılımı</p>
      <div className="mt-4 space-y-3">
        {regions.map((region) => (
          <div key={region.name}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-foreground/80">{region.name}</span>
              <span className="text-muted-foreground">{region.value}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${Math.round((region.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}