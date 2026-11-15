const CATEGORIES=new Set(['platform_help','project_process','supplier_matching','offer_contract','membership','international','billing','worker_rights','other']);
const STATES=new Set(['new','triaging','awaiting_details','referred','resolved','closed']);
const PRIORITIES=new Set(['low','normal','high']);
const GROUPS=new Set(['platform','commercial','technical_partner','legal_partner','finance_partner']);
const plain=(x,n)=>String(x||'').trim().slice(0,n);

export function supportRpcArgs(form={}) {
  const name=plain(form.name,100);
  const subject=plain(form.subject,140);
  const description=plain(form.description,2500);
  if(name.length<2||subject.length<5||description.length<25||!CATEGORIES.has(form.category))
    throw new Error('Destek formunun zorunlu alanlarını kontrol edin.');
  if(form.consent_confirmed!==true)throw new Error('Gizlilik bilgilendirmesini onaylayın.');
  if(form.callback_requested===true && plain(form.phone,35).length<7)
    throw new Error('Geri arama için telefon numarası gerekli.');
  return {p_name:name,p_company_name:plain(form.company_name,140),
    p_phone:plain(form.phone,35),p_category:form.category,p_subject:subject,
    p_description:description,p_callback_requested:form.callback_requested===true,
    p_consent_confirmed:true};
}

export function adminSupportArgs(ticket={},patch={}) {
  const status=patch.status??ticket.status??'new';
  const priority=patch.priority??ticket.priority??'normal';
  const group=patch.assigned_group??ticket.assigned_group??'platform';
  if(!ticket.id||!STATES.has(status)||!PRIORITIES.has(priority)||!GROUPS.has(group))
    throw new Error('Destek yönetimi alanı geçersiz.');
  const note=String(patch.internal_note??ticket.internal_note??'');
  if(note.length>2500)throw new Error('İç not fazla uzun.');
  return {p_id:ticket.id,p_status:status,p_priority:priority,
    p_assigned_group:group,p_internal_note:note};
}

export function normalizeSupportTicket(row) {
  if(!row || typeof row!=='object')return row;
  return {...row,created_date:row.created_at||row.created_date};
}
