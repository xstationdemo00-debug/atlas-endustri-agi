// Preview-only compatibility layer: not a backend implementation.
// Explicitly blocks mutations and never returns private Base44 records.
const unavailable=async()=>{throw new Error('Bu işlem yalnızca orijinal Base44 arayüz önizlemesinde kullanılamaz. Render/Neon taşıması tamamlanınca açılacaktır.');};
const emptyEntity={list:async()=>[],filter:async()=>[],count:async()=>0,aggregate:async()=>[],get:async()=>null,create:unavailable,update:unavailable,updateMany:unavailable,delete:unavailable,bulkCreate:unavailable,import:unavailable};
const entities=new Proxy({}, {get:(_,key)=>key==='then'?undefined:emptyEntity});
const stub={entities,functions:{invoke:unavailable},integrations:{Core:new Proxy({}, {get:()=>unavailable})},app:{getPublicSettings:async()=>({public_settings:{}})},auth:{me:async()=>({id:'preview-only',email:'preview@example.invalid',full_name:'Önizleme',role:'admin'}),logout:()=>{},redirectToLogin:()=>{throw new Error('Gerçek kimlik doğrulama henüz taşınmadı.')},register:unavailable,verifyOtp:unavailable,resendOtp:unavailable,resetPasswordRequest:unavailable,resetPassword:unavailable,loginWithProvider:unavailable,setToken:()=>{throw new Error('Bu sadece önizleme.')},isAuthenticated:async()=>true}};
export const base44=stub;
