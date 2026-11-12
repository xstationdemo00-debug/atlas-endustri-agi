// Panelin ilk açılışında gösterilen yerel örnek veriler (demo verisi).
// Gerçek kayıtlar bağlandıkça bu dosya kullanımdan kalkacak.

export const DEMO_STATS = {
  openProjects: 24,
  openPositions: 87,
  incomingOffers: 213,
  poolWorkers: 1240,
  pendingCompanies: 5,
};

export const DEMO_PROJECTS = [
  {
    id: 'PRJ-2401',
    title: 'Anadolu Rüzgar Enerji Sahası — Faz II',
    city: 'Eskişehir',
    sector: 'Enerji',
    status: 'matching',
    filled: 42,
    needed: 60,
    trade: 'Çelik konstrüksiyon',
    start: '12 Kas 2026',
  },
  {
    id: 'PRJ-2398',
    title: 'Marmara Lojistik Merkezi',
    city: 'Kocaeli',
    sector: 'Lojistik',
    status: 'open',
    filled: 18,
    needed: 45,
    trade: 'Betonarme',
    start: '20 Kas 2026',
  },
  {
    id: 'PRJ-2387',
    title: 'İzmir Metro İstasyon Yenileme',
    city: 'İzmir',
    sector: 'Altyapı',
    status: 'staffed',
    filled: 88,
    needed: 95,
    trade: 'Elektrik & mekanik',
    start: '05 Kas 2026',
  },
  {
    id: 'PRJ-2379',
    title: 'Gaziantep Gıda Fabrikası Montaj',
    city: 'Gaziantep',
    sector: 'Üretim',
    status: 'draft',
    filled: 0,
    needed: 32,
    trade: 'Montaj',
    start: '01 Ara 2026',
  },
];

export const DEMO_OFFERS = [
  { id: 'TKF-1042', company: 'Kaya Mühendislik', project: 'Anadolu RES Faz II', amount: '₺ 4.850.000', status: 'shortlisted' },
  { id: 'TKF-1041', company: 'Beta Yapı Grubu', project: 'Marmara Lojistik', amount: '₺ 2.310.000', status: 'submitted' },
  { id: 'TKF-1038', company: 'Yıldız Elektrik', project: 'İzmir Metro', amount: '₺ 1.740.000', status: 'accepted' },
  { id: 'TKF-1035', company: 'Doruk Endüstri', project: 'Gaziantep Gıda', amount: '₺ 980.000', status: 'rejected' },
];

export const DEMO_NOTIFICATIONS = [
  { id: 1, title: 'Ekip kadrosu tamamlandı', body: 'İzmir Metro projesinde 95/95 personel onaylandı.', time: '12 dk önce' },
  { id: 2, title: 'Yeni teklif alındı', body: 'Kaya Mühendislik, Anadolu RES Faz II için teklif verdi.', time: '1 sa önce' },
  { id: 3, title: 'Belge süresi yaklaşıyor', body: '8 çalışanın İSG sertifikası 30 gün içinde doluyor.', time: '3 sa önce' },
];

export const DEMO_REGIONS = [
  { name: 'İstanbul', value: 320 },
  { name: 'Ankara', value: 210 },
  { name: 'İzmir', value: 180 },
  { name: 'Bursa', value: 120 },
  { name: 'Kocaeli', value: 95 },
];