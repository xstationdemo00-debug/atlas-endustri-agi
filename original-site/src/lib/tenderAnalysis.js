export const ANALYSIS_STATUS_META = {
  uploaded: { label: 'Yüklendi', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  processing: { label: 'Analiz ediliyor', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  review_ready: { label: 'Onay bekliyor', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Arşivlendi', className: 'bg-slate-100 text-slate-500 border-slate-200' },
  failed: { label: 'Analiz başarısız', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const PACKAGE_STATUS_META = {
  draft: { label: 'Taslak', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  approved: { label: 'Onaylandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Reddedildi', className: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const ITEM_STATUS_META = {
  pending: { label: 'Kontrol bekliyor', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  confirmed: { label: 'Doğrulandı', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  excluded: { label: 'Hariç', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const PACKAGE_TYPE_LABELS = {
  industrial_fabrication: 'Endüstriyel imalat',
  material_supply: 'Malzeme tedariki',
  mechanical_installation: 'Mekanik montaj',
  turnkey_project: 'Anahtar teslim',
  maintenance_shutdown: 'Bakım / duruş',
  industrial_logistics: 'Endüstriyel lojistik',
  other: 'Diğer',
};

export const CAPABILITY_LABELS = {
  laser_cutting: 'Lazer kesim',
  bending: 'Büküm',
  welding: 'Kaynak',
  machining: 'Talaşlı imalat',
  assembly: 'Montaj',
  structural_steel: 'Çelik konstrüksiyon',
  pipework: 'Boru hattı',
  fabrication: 'İmalat',
  stainless_process: 'Paslanmaz proses',
  coating: 'Kaplama / boya',
  material_supply: 'Malzeme tedariki',
  installation: 'Saha montajı',
  logistics: 'Lojistik',
};

export const ANALYSIS_STATUS_OPTIONS = Object.keys(ANALYSIS_STATUS_META);

export function meta(map, key) {
  return map[key] || { label: key || '—', className: 'bg-slate-100 text-slate-600 border-slate-200' };
}

export function formatMoney(value, currency = 'TRY') {
  const amount = Number(value || 0);
  if (!amount) return '—';
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY', maximumFractionDigits: 0 }).format(amount);
}

export function formatQty(value) {
  const amount = Number(value || 0);
  if (!amount) return '—';
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(amount);
}

export function capabilityLabel(tag) {
  return CAPABILITY_LABELS[tag] || tag;
}