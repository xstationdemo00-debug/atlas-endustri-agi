// Türkçe karakterleri hesaba katarak ihale pozlarında arama yap.
export const normalizeTenderQuery = (value) =>
  String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const itemMatchesTenderQuery = (item, query) => {
  const needle = normalizeTenderQuery(query);
  if (!needle) return true;
  const searchable = [
    item.code, item.position_no, item.description,
    item.category, item.unit, item.notes,
  ].filter(Boolean).join(' ');
  return normalizeTenderQuery(searchable).includes(needle);
};

export const packageMatchesTenderQuery = (pkg, query) => {
  const needle = normalizeTenderQuery(query);
  if (!needle) return true;
  return normalizeTenderQuery([
    pkg.name, pkg.work_package_type, pkg.discipline, pkg.scope_description,
  ].filter(Boolean).join(' ')).includes(needle);
};
