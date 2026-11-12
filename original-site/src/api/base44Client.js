/**
 * Base44 compatibility adapter for the independent Atlas migration.
 *
 * - Neon Auth supplies a verified, short-lived JWT.
 * - Neon Data API enforces PostgreSQL row-level security.
 * - Own, newly-created records can be read/created/updated for a safe subset.
 * - Legacy Base44 records have no owner yet and remain inaccessible.
 * - Organization sharing, admin operations, and 13 cloud functions are disabled
 *   rather than pretending that a remote action succeeded.
 */
import { neonAuth } from '@/lib/neonAuthClient';
import { asLegacyCollection } from '@/lib/legacyCollection';

const DATA_API = import.meta.env.VITE_NEON_DATA_API_URL || '';
const WRITABLE_ENTITY_TYPES = new Set(['Project', 'WorkRequest', 'Offer', 'WorkerProfile', 'Team', 'Company']);
const DENY_MESSAGE = 'Bu işlemin Base44 → Render/Neon aktarımı henüz tamamlanmadı.';
const unavailable = async () => { throw new Error(DENY_MESSAGE); };

async function credentials() {
  if (!neonAuth || !DATA_API) throw new Error('Bağımsız veri API bağlantısı kurulamadı.');
  const session = await neonAuth.getSession();
  const user = session?.data?.user || session?.user;
  if (session?.error || !user?.id) throw new Error('Devam etmek için doğrulanmış hesabınızla giriş yapın.');
  if (typeof neonAuth.getJWTToken !== 'function') throw new Error('Neon Auth JWT desteklenmiyor.');
  const result = await neonAuth.getJWTToken();
  const token = typeof result === 'string' ? result : result?.data?.token || result?.token;
  if (!token || typeof token !== 'string') throw new Error('Güvenli erişim belirteci alınamadı.');
  return { token, userId: user.id };
}

async function request(method, query, body) {
  const {token} = await credentials();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Accept-Profile': 'atlas_app',
    'Content-Profile': 'atlas_app',
    Accept: 'application/json',
  };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    headers.Prefer = 'return=representation';
  }
  const response = await fetch(`${DATA_API}/entity_records${query || ''}`, {
    method,headers,credentials:'omit',cache:'no-store',
    body:body === undefined ? undefined : JSON.stringify(body),
  });
  const content = await response.text();
  let value;
  try { value = content ? JSON.parse(content) : null; } catch {value=null;}
  if (!response.ok) throw new Error(`Neon veri servisi isteği reddetti (${response.status}).`);
  return value;
}

function record(row) {
  if (!row || typeof row !== 'object') return null;
  const source = row.payload && typeof row.payload === 'object' && !Array.isArray(row.payload) ? row.payload : {};
  return {
    ...source,
    id: row.id,
    created_date: row.created_at,
    updated_date: row.updated_at,
    created_by: row.owner_auth_user_id,
    created_by_id: row.owner_auth_user_id,
  };
}

async function ownedRecords(type) {
  const result=[];
  for (let offset=0; offset<2000; offset+=100) {
    const q=`?select=id,payload,created_at,updated_at,owner_auth_user_id&entity_type=eq.${encodeURIComponent(type)}&order=created_at.desc&limit=100&offset=${offset}`;
    const page=await request('GET',q);
    if (!Array.isArray(page)) throw new Error('Beklenmeyen veri yanıtı.');
    result.push(...page.map(record));
    if(page.length<100)break;
    if (offset>=1900) throw new Error('Çok fazla kayıt var; sunucu üzerinden sayfalama gerekiyor.');
  }
  return result;
}

function matches(record, criteria={}) {
  if (!criteria || !Object.keys(criteria).length) return true;
  return Object.entries(criteria).every(([key,match])=>{
    if(key==='$or' && Array.isArray(match))return match.some(q=>matches(record,q));
    if(key==='$and' && Array.isArray(match))return match.every(q=>matches(record,q));
    const current=record[key];
    if(match && typeof match==='object' && !Array.isArray(match)) {
      if ('$in' in match) return Array.isArray(match.$in) && match.$in.includes(current);
      if ('$ne' in match) return current!==match.$ne;
      if ('$gte' in match && !(current>=match.$gte)) return false;
      if ('$lte' in match && !(current<=match.$lte)) return false;
      if ('$exists' in match) return match.$exists ? current!==undefined : current===undefined;
      return true;
    }
    return current===match;
  });
}

function order(rows,sort='-created_date') {
  if(typeof sort!=='string' || !sort) return rows;
  const reverse=sort.startsWith('-');
  const column=reverse?sort.slice(1):sort;
  return rows.sort((a,b)=>{
    const l=a?.[column]??'',r=b?.[column]??'';
    const delta=typeof l==='number'&&typeof r==='number'?l-r:String(l).localeCompare(String(r),'tr');
    return reverse?-delta:delta;
  });
}

function entity(type) {
  const readOwn=async()=>ownedRecords(type);
  return {
    list:async(sort='-created_date',limit=100)=>asLegacyCollection(order(await readOwn(),sort).slice(0,Number(limit)||100)),
    filter:async(q={},opts={})=>asLegacyCollection(order((await readOwn()).filter(x=>matches(x,q)),opts?.sort||'-created_date').slice(0,Number(opts?.limit)||100)),
    count:async(q={})=>(await readOwn()).filter(x=>matches(x,q)).length,
    get:async(id)=>{const rows=await readOwn();const row=rows.find(x=>x.id===id);if(!row)throw new Error('Kayıt bulunamadı veya erişim yetkiniz yok.');return row;},
    aggregate:async({query={},groupBy}={})=>{
      const list=(await readOwn()).filter(x=>matches(x,query));
      if(!groupBy)return[];
      const groups=new Map();
      for(const x of list) groups.set(x[groupBy]||'Belirtilmedi',(groups.get(x[groupBy]||'Belirtilmedi')||0)+1);
      return [...groups].map(([key,count])=>({_id:key,count}));
    },
    create:async(data)=>{
      if(!WRITABLE_ENTITY_TYPES.has(type))throw new Error(DENY_MESSAGE);
      const {userId}=await credentials();
      const payload={...data};
      for(const key of ['id','created_date','updated_date','created_by'])delete payload[key];
      const rows=await request('POST','?select=*',[{entity_type:type,owner_auth_user_id:userId,payload}]);
      const result=Array.isArray(rows)?rows[0]:rows;
      if(!result?.id)throw new Error('Kayıt doğrulanamadı.');
      return record(result);
    },
    update:async(id,data)=>{
      if(!WRITABLE_ENTITY_TYPES.has(type))throw new Error(DENY_MESSAGE);
      const existing=await ownedRecords(type);
      const source=existing.find(x=>x.id===id);
      if(!source)throw new Error('Kayıt size ait değil veya bulunamadı.');
      const merged={...source,...data};
      for(const key of ['id','created_date','updated_date','created_by'])delete merged[key];
      const rows=await request('PATCH',`?id=eq.${encodeURIComponent(id)}&entity_type=eq.${encodeURIComponent(type)}&select=*`,{payload:merged});
      const result=Array.isArray(rows)?rows[0]:rows;
      if(!result?.id)throw new Error('Güncelleme reddedildi veya kayıt bulunamadı.');
      return record(result);
    },
    delete:unavailable, updateMany:unavailable,bulkCreate:unavailable,import:unavailable,
  };
}
const entities=new Proxy({}, {get:(_,type)=>type==='then'?undefined:entity(String(type))});
export const base44={
  entities,
  functions:{invoke:unavailable},
  integrations:{Core:new Proxy({}, {get:()=>unavailable})},
  app:{getPublicSettings:async()=>({public_settings:{}})},
  auth:{
    me:async()=>{const data=await neonAuth?.getSession();const u=data?.data?.user;if(!u?.id)throw new Error('Giriş yapılmadı.');return{id:u.id,email:u.email,full_name:u.name,role:'member'};},
    logout:async()=>{try{await neonAuth?.signOut();}finally{window.location.hash='#/login';}},
    isAuthenticated:async()=>{const s=await neonAuth?.getSession();return Boolean(s?.data?.user?.id);},
    redirectToLogin:()=>{window.location.hash='#/login';},
    register:unavailable,verifyOtp:unavailable,resendOtp:unavailable,
    resetPasswordRequest:unavailable,resetPassword:unavailable,
    loginWithProvider:unavailable,setToken:unavailable,
  }
};
