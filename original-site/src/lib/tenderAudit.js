// İhale iş kalemleri için değişiklik yapmayan denetim ve CSV dışa aktarma.
const safeCSV = (value) => {
  const original = String(value ?? '').replace(/\r?\n/g, ' ');
  // E-tablo açılırken formül çalıştırılmasını önle.
  const protectedValue = /^[\s]*[=+@-]/.test(original) ? "'" + original : original;
  return '"' + protectedValue.replace(/"/g, '""') + '"';
};

export function tenderAudit(analysis, items = [], packages = []) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const owners = new Map();
  const issues = [];

  for (const pkg of packages) {
    const ids = Array.isArray(pkg.item_ids) ? pkg.item_ids : [];
    if (Number(pkg.item_count) !== ids.length) {
      issues.push({ kind: 'count', message: `${pkg.name}: kayıtlı paket sayısı ve bağlı kalem sayısı farklı` });
    }
    if (!ids.length) {
      issues.push({ kind: 'empty', message: `${pkg.name}: pakette iş kalemi yok` });
    }
    for (const id of ids) {
      if (!byId.has(id)) {
        issues.push({ kind: 'dangling', message: `${pkg.name}: bulunamayan iş kalemi bağlantısı (${id})` });
        continue;
      }
      const destinations = owners.get(id) || [];
      destinations.push(pkg.name);
      owners.set(id, destinations);
    }
  }
  for (const item of items) {
    const count = (owners.get(item.id) || []).length;
    if (count === 0) issues.push({ kind: 'missing', message: `${item.code || item.id}: pakete atanmamış` });
    if (count > 1) issues.push({ kind: 'duplicate', message: `${item.code || item.id}: ${count} pakete birden atanmış` });
    if (!item.unit || item.quantity === null || item.quantity === undefined || !Number.isFinite(Number(item.quantity))) {
      issues.push({ kind: 'unit', message: `${item.code || item.id}: miktar veya birim kontrolü gerekli` });
    }
  }

  const confirmed = items.filter((x) => x.review_status === 'confirmed' && String(x.notes || '').trim()).length;
  const annotated = items.filter((x) => String(x.notes || '').trim()).length;
  const noPrices = items.filter((x) => !Number.isFinite(Number(x.unit_price)) || Number(x.unit_price) <= 0).length;
  const unapproved = packages.filter((x) => x.status !== 'approved').length;
  return { owners, issues, confirmed, annotated, noPrices, unapproved,
    linkedOnce: items.filter((x) => (owners.get(x.id) || []).length === 1).length,
    itemCount: items.length, packageCount: packages.length,
  };
}

export function tenderAuditCSV(analysis, items = [], packages = []) {
  const audit = tenderAudit(analysis, items, packages);
  const rows = [[
    'İhale', 'İKN', 'Poz kodu', 'İş kalemi açıklaması', 'Miktar', 'Birim',
    'Atandığı paket', 'Atama sayısı', 'Kontrol durumu', 'Teknik inceleme notu',
    'Birim fiyat', 'Toplam bedel'
  ]];
  for (const item of items) {
    const names = audit.owners.get(item.id) || [];
    rows.push([
      analysis?.title || '', analysis?.reference_no || '', item.code || '',
      item.description || '', item.quantity ?? '', item.unit || '',
      names.join(' | '), names.length,
      item.review_status === 'confirmed' ? 'Yönetici onaylı' : item.review_status === 'excluded' ? 'Hariç' : 'Kontrol bekliyor',
      item.notes || '', Number(item.unit_price) > 0 ? item.unit_price : '',
      Number(item.line_total) > 0 ? item.line_total : ''
    ]);
  }
  const body = rows.map((row) => row.map(safeCSV).join(';')).join('\r\n');
  return '\uFEFF' + body;
}
