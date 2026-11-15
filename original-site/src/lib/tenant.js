import { base44 } from '@/api/base44Client';
import { memberCompany } from '@/lib/neonCompanyMembers';

export async function getMyCompany(user) {
  if (!user) return null;
  const companies = await base44.entities.Company.list();
  const owned = companies.find((company) => company.created_by_id === user.id);
  if (owned) return owned;

  const invitations = await base44.functions.invoke('myCompanyInvitations', {});
  return memberCompany(invitations);
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