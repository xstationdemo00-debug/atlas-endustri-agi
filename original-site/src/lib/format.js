export const TRADES = [
  'Çelik konstrüksiyon',
  'Betonarme',
  'Elektrik',
  'Mekanik tesisat',
  'Kaynak',
  'Montaj',
  'İskele',
  'Vinç operatörlüğü',
  'İSG uzmanı',
  'Şantiye şefi',
  'Kalıp',
  'Duvar & sıva',
  'Boya',
  'Altyapı',
  'Lojistik',
  'Diğer',
];

export const SECTORS = [
  'Enerji',
  'Altyapı',
  'Lojistik',
  'Üretim',
  'Endüstriyel tesis',
  'Konut & yapı',
  'Petrol & gaz',
  'Diğer',
];

export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'AED'];

export const COMPANY_TYPES = [
  { value: 'main_contractor', label: 'Ana yüklenici' },
  { value: 'subcontractor', label: 'Alt yüklenici' },
  { value: 'supplier', label: 'Tedarikçi' },
  { value: 'individual', label: 'Bağımsız usta' },
];

export function formatMoney(amount, currency = 'TRY') {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch (error) {
    return `${value.toLocaleString('tr-TR')} ${currency}`;
  }
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysUntil(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}