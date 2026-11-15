/** Memberships are not proof of firm ownership. Only verified invitations
 * accepted by an authenticated user create a read-only member view.
 */
export function normalizeMembershipRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
}
export function memberCompany(value) {
  const row = normalizeMembershipRows(value).find(x =>
    x?.status === 'active' && x?.company && typeof x.company.id === 'string');
  return row ? { ...row.company, is_member_view: true, company_member_role: row.role } : null;
}
export function canManageCompany(company, user) {
  return Boolean(company?.id && user?.id && !company.is_member_view &&
    company.created_by_id === user.id);
}
