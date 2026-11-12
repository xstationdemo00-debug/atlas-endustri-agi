// Atlas Verimlilik Motoru: yalnızca karşılaştırma ve sözleşme inceleme ön hesabı.
// Hukuki hakediş, ücret, vergi, kamu ödemesi veya otomatik transfer oluşturmaz.
export const DEFAULT_SHARES = Object.freeze({
  employer: 40, workers: 30, contractor: 20, atlas: 10,
});
export const SAVING_GATES = Object.freeze([
  {key:'scope_verified',label:'İşin kapsamı, kabul miktarı ve kalite hedefi başlangıçla eşdeğer'},
  {key:'quality_accepted',label:'Kalite, test, teknik şartname ve teslim/kabul kontrolleri tamam'},
  {key:'hse_verified',label:'İSG ve güvenli çalışma yükümlülükleri karşılandı'},
  {key:'wages_paid_verified',label:'Çalışanların temel ücretleri ve zorunlu hakları tam ödendi'},
  {key:'overtime_paid_verified',label:'Fazla mesai, prim ve ilgili hak edişler ayrıca ödendi'},
  {key:'evidence_verified',label:'Başlangıç ve gerçekleşen bütün maliyetler belgeli'},
  {key:'agreement_verified',label:'Paylaşım sözleşmesi, taraflar ve yasal/vergisel inceleme tamam'},
]);

export function calculateEfficiency(input) {
  const number = (value) => value === '' || value === null || value === undefined
    ? NaN : Number(value);
  const baseline = number(input.baseline_total_cost);
  const actual = number(input.actual_total_cost);
  const plannedDays = number(input.planned_days);
  const actualDays = number(input.actual_days);
  const shares = {
    employer: number(input.employer_share_pct),
    workers: number(input.workers_share_pct),
    contractor: number(input.contractor_share_pct),
    atlas: number(input.atlas_share_pct),
  };
  const totalShare = Object.values(shares).reduce((sum, x) => sum + x, 0);
  const shareValid = Object.values(shares).every(x => Number.isFinite(x) && x >= 0 && x <= 100)
    && Math.abs(totalShare - 100) < 0.001;
  const validCosts = Number.isFinite(baseline) && baseline > 0 &&
    Number.isFinite(actual) && actual > 0;
  const validDays = Number.isFinite(plannedDays) && plannedDays > 0 &&
    Number.isFinite(actualDays) && actualDays > 0;
  const rawSaving = validCosts ? baseline - actual : null;
  const positiveSaving = validCosts ? Math.max(0, rawSaving) : 0;
  const daysSaved = validDays ? plannedDays - actualDays : null;
  const durationChangePercent = validDays ? (daysSaved / plannedDays) * 100 : null;
  const missingGates = SAVING_GATES.filter(x => input[x.key] !== true);
  const publicProject = input.employer_type === 'public_institution';
  const isDemo = input.is_demo === true;
  const validWorkerCount = Number.isInteger(number(input.worker_count)) && number(input.worker_count) > 0;
  const reviewEligible = validCosts && validDays && validWorkerCount && shareValid &&
    positiveSaving > 0 && missingGates.length === 0 && !publicProject && !isDemo;
  // Bunlar sadece olası sözleşme paylarıdır. Hiçbiri otomatik kazanılmış veya ödenmiş para değildir.
  const projections = validCosts && shareValid && positiveSaving > 0 && !publicProject
    ? Object.fromEntries(Object.entries(shares).map(([key, percent]) =>
      [key, Math.round(positiveSaving * percent * 100) / 100]))
    : null;

  return {
    validCosts, validDays, validWorkerCount, shareValid, shareSum:totalShare,
    rawSaving, positiveSaving, daysSaved, durationChangePercent,
    missingGates, reviewEligible, projections, publicProject, isDemo,
    unallocated: projections
      ? Math.round((positiveSaving - Object.values(projections).reduce((a,b)=>a+b,0))*100)/100
      : null,
  };
}
