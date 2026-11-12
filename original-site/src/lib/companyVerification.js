export const DOCUMENT_TYPES = [
  { value: 'vergi_levhasi', label: 'Vergi levhası', required: true },
  { value: 'ticaret_sicil', label: 'Ticaret sicil gazetesi', required: true },
  { value: 'imza_sirkuleri', label: 'İmza sirküleri / yetki belgesi', required: true },
  { value: 'faaliyet_belgesi', label: 'Faaliyet / kapasite belgesi', required: false },
  { value: 'kalite_belgesi', label: 'Kalite belgesi (ISO, EN 1090 vb.)', required: false },
  { value: 'isg_belgesi', label: 'İSG belgesi', required: false },
  { value: 'diger', label: 'Diğer belge', required: false },
];

export const REQUIRED_DOCUMENT_TYPES = DOCUMENT_TYPES.filter((item) => item.required).map((item) => item.value);

export const docLabel = (value) => DOCUMENT_TYPES.find((item) => item.value === value)?.label || 'Belge';

const PROFILE_FIELDS = [
  ['legal_name', 'Ticari ünvan'],
  ['tax_number', 'Vergi no'],
  ['city', 'Şehir'],
  ['phone', 'Telefon'],
  ['email', 'E-posta'],
];

export function missingProfileFields(company) {
  if (!company) return PROFILE_FIELDS.map(([, label]) => label);
  return PROFILE_FIELDS.filter(([key]) => !String(company[key] || '').trim()).map(([, label]) => label);
}

export function verificationProgress(company, documents = []) {
  const missing = missingProfileFields(company);
  const steps = [
    { key: 'profile', label: 'Firma bilgileri', done: missing.length === 0 },
    ...REQUIRED_DOCUMENT_TYPES.map((type) => ({
      key: type,
      label: docLabel(type),
      done: documents.some((doc) => doc.type === type && doc.status !== 'rejected'),
    })),
  ];
  const doneCount = steps.filter((step) => step.done).length;
  return { steps, doneCount, total: steps.length, complete: doneCount === steps.length, missing };
}

export const VERIFICATION_COPY = {
  pending: {
    title: 'Doğrulama bekliyor',
    body: 'Firma bilgilerinizi tamamlayıp zorunlu belgeleri yükleyin, ardından başvuruyu gönderin.',
  },
  in_review: {
    title: 'Belgeler inceleniyor',
    body: 'Başvurunuz Atlas ekibine ulaştı. İnceleme tamamlandığında bildirim alacaksınız.',
  },
  verified: {
    title: 'Firma doğrulandı',
    body: 'Firmanız doğrulanmış üye olarak ağda görünür. Kapasite bilgileri ayrıca teyit edilir.',
  },
  rejected: {
    title: 'Başvuru reddedildi',
    body: 'Belgeler veya firma bilgileri yeterli bulunmadı. Gerekli düzeltmeleri yapıp yeniden gönderebilirsiniz.',
  },
};