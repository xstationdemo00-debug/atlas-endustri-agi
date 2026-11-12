import { base44 } from '@/api/base44Client';

export async function getMyCompany(user) {
  if (!user) return null;
  const companies = await base44.entities.Company.list();
  const owned = companies.find((company) => company.created_by_id === user.id);
  if (owned) return owned;

  const memberships = await base44.entities.CompanyMember.filter({ email: user.email });
  if (!memberships.length) return null;
  const company = await base44.entities.Company.get(memberships[0].company_id).catch(() => null);
  return company;
}

export async function notify({ email, title, body, type = 'system', link = '/' }) {
  if (!email) return null;
  return base44.entities.Notification.create({
    user_email: email,
    title,
    body,
    type,
    link,
    is_read: false,
  });
}