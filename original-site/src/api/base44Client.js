// Migration compatibility layer. Base44 private entities/functions are NOT connected.
// Never fabricate admin sessions or claim that a failed write succeeded.
import { neonAuth } from '@/lib/neonAuthClient';
const unavailable = async () => { throw new Error('Bu Base44 işleminin Render/Neon aktarımı henüz tamamlanmadı.'); };
const emptyEntity = {list:async()=>[],filter:async()=>[],count:async()=>0,aggregate:async()=>[],get:async()=>null,create:unavailable,update:unavailable,updateMany:unavailable,delete:unavailable,bulkCreate:unavailable,import:unavailable};
const entities = new Proxy({}, {get:(_,key)=>key==='then'?undefined:emptyEntity});
export const base44 = {
  entities,
  functions:{invoke:unavailable},
  integrations:{Core:new Proxy({}, {get:()=>unavailable})},
  app:{getPublicSettings:async()=>({public_settings:{}})},
  auth:{
    me:async()=>{const result=await neonAuth?.getSession();const u=result?.data?.user; if(!u?.id)throw new Error('Oturum açılmamış.');return {id:u.id,email:u.email,full_name:u.name,role:'member'};},
    logout:async()=>{try{await neonAuth?.signOut();}finally{window.location.hash='#/login';}},
    isAuthenticated:async()=>{const s=await neonAuth?.getSession();return Boolean(s?.data?.user?.id);},
    redirectToLogin:()=>{window.location.hash='#/login';},
    register:unavailable, verifyOtp:unavailable, resendOtp:unavailable,
    resetPasswordRequest:unavailable,resetPassword:unavailable,
    loginWithProvider:unavailable,setToken:unavailable,
  }
};
