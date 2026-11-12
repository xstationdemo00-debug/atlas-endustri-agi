/** Sanitized, owner-controlled workflow adapters for the original Base44 UI. */
export function mergeById(...groups) {
  const byId=new Map();
  for(const group of groups)for(const row of Array.isArray(group)?group:[]) {
    if(row?.id!=null&&!byId.has(String(row.id)))byId.set(String(row.id),row);
  }
  return [...byId.values()];
}
export function normalizePublicWorkRequest(row={}) {
  // Never copy the whole database row: this is the explicitly published listing.
  return {
    id:String(row.id||''),project_id:String(row.project_id||''),
    project_title:String(row.project_title||''),
    company_name:String(row.company_name||''),
    trade:String(row.trade||''),city:String(row.city||''),
    country:String(row.country||'Türkiye'),description:String(row.description||''),
    headcount:Number(row.headcount)||0,filled_count:Number(row.filled_count)||0,
    daily_rate:row.daily_rate==null?null:Number(row.daily_rate),
    currency:String(row.currency||'TRY'),
    start_date:String(row.start_date||''),end_date:String(row.end_date||''),
    certificates_required:Array.isArray(row.certificates_required)?row.certificates_required:[],
    status:'open',publication_status:'approved',created_date:row.created_at||null,
    is_public_listing:true,
  };
}
export function normalizeIncomingOffer(row={}) {
  const payload=row.payload&&typeof row.payload==='object'&&!Array.isArray(row.payload)?row.payload:{};
  return {...payload,id:row.id,created_date:row.created_at,updated_date:row.updated_at,
    created_by_id:row.owner_auth_user_id,
    request_owner_auth_user_id:row.request_owner_auth_user_id,
    publication_status:row.status};
}
export function offerRpcArgs(data={}) {
  const name=String(data.applicant_name||'').trim();
  const type=data.applicant_type||'individual';
  if(!data.work_request_id||name.length<2||name.length>140)
    throw new Error('Teklif için geçerli iş talebi ve teklif sahibi gerekli.');
  const amount=Number(data.amount);
  if(!Number.isFinite(amount)||amount<1||amount>100000000000)
    throw new Error('Geçerli bir teklif tutarı gerekli.');
  const teamSize=Number(data.team_size||1), days=Number(data.duration_days||0);
  if(!Number.isInteger(teamSize)||teamSize<1||teamSize>100
    ||!Number.isInteger(days)||days<0||days>3650)throw new Error('Ekip büyüklüğü veya süre geçersiz.');
  if(!['company','team','individual'].includes(type))throw new Error('Geçersiz teklif türü.');
  if(type==='company'&&!data.company_id)throw new Error('Firma teklifi için doğrulanmış firmanızı seçin.');
  return {
    p_work_request_id:String(data.work_request_id),
    p_amount:amount,
    p_applicant_name:name,
    p_applicant_type:type,
    p_duration_days:days,
    p_team_size:teamSize,
    p_notes:String(data.notes||'').slice(0,1500),
    p_company_id:type==='company'?(data.company_id||null):null
  };
}
