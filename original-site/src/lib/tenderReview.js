export const TECH_REVIEW_INVALID = '[KAPSAM DEĞİŞTİ - TEKNİK KONTROLÜ YENİLEYİN]';

export function getPackageReview(pkg, items = []) {
  const linkedIds = Array.isArray(pkg.item_ids) ? pkg.item_ids : [];
  const byId = new Map(items.map((item) => [item.id, item]));
  const linked = linkedIds.map((id) => byId.get(id)).filter(Boolean);
  const confirmed = linked.filter((item) => item.review_status === 'confirmed' && String(item.notes || '').trim()).length;
  const excluded = linked.filter((item) => item.review_status === 'excluded').length;
  const missing = linkedIds.length - linked.length;
  const technicalNote = String(pkg.admin_note || '').trim();
  const technicalNotePresent = Boolean(technicalNote && !technicalNote.startsWith(TECH_REVIEW_INVALID));
  return {
    linked,
    confirmed,
    excluded,
    missing,
    technicalNotePresent,
    complete: linkedIds.length > 0 && !missing && !excluded && confirmed === linked.length && technicalNotePresent,
  };
}
