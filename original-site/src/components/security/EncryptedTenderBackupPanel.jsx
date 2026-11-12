import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Download, FileCheck2, Lock, ShieldAlert, ShieldCheck, Upload, KeyRound } from 'lucide-react';

const FORMAT='ATLAS_TECHNICAL_BACKUP_V1';
const ITERATIONS=310000;
const ENCODER=new TextEncoder();
const DECODER=new TextDecoder();
const MODELS={
  TenderAnalysis:['id','title','buyer_name','reference_no','opportunity_id','city','currency','status',
    'summary','item_count','package_count','total_estimated','extraction_note','extracted_at',
    'approved_at','admin_note','is_demo','technical_file_name','document_file_name'],
  TenderWorkItem:['id','analysis_id','position_no','code','description','unit','quantity','unit_price',
    'line_total','category','review_status','notes','sort_order','is_demo'],
  TenderWorkPackage:['id','analysis_id','name','scope_description','discipline','work_package_type',
    'item_ids','item_count','quantity_summary','estimated_value','currency','required_capabilities',
    'matching_priority','status','admin_note','is_demo'],
  TenderTechnicalClause:['id','analysis_id','work_item_id','code','source_file_name','source_section',
    'source_page','source_text','match_method','review_status','review_note','extracted_at','source_status'],
};
const b64=(bytes)=>{
  let s='';
  for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
  return btoa(s);
};
const unb64=(encoded)=>Uint8Array.from(atob(encoded),x=>x.charCodeAt(0));
async function getKey(password,salt){
  const material=await crypto.subtle.importKey('raw',ENCODER.encode(password),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},
    material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function exportBackup(password){
  const data={};
  for(const [model,fields] of Object.entries(MODELS)){
    const response=await base44.entities[model].list('-created_date',500);
    const all=Array.isArray(response)?response:response?.items||[];
    if(all.length>=500)throw new Error(model+' kayıtları 500 sınırına ulaştı. Eksik yedek almamak için uzman kontrollü sayfalama gerekli.');
    data[model]=all.map(row=>Object.fromEntries(fields.filter(k=>row[k]!==undefined).map(k=>[k,row[k]])));
  }
  const plaintext={format:FORMAT,created_at:new Date().toISOString(),data,
    scope:'Teknik ihale verileri. Dosya eklerinin kendisi, kullanıcı/çalışan/firma hassas kayıtları, sırlar ve yedek dışı tablolarda saklanan kayıtlar dahil değildir.'};
  const bytes=ENCODER.encode(JSON.stringify(plaintext));
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const key=await getKey(password,salt);
  const ciphertext=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes));
  return {
    format:FORMAT,encrypted_at:plaintext.created_at,algorithm:'AES-256-GCM',
    kdf:'PBKDF2-SHA256',iterations:ITERATIONS,
    salt:b64(salt),iv:b64(iv),ciphertext:b64(ciphertext),
    counts:Object.fromEntries(Object.entries(data).map(([name,rows])=>[name,rows.length])),
  };
}
async function inspectBackup(file,password){
  if(file.size>16*1024*1024)throw new Error('Bu dosya 16 MB sınırını aşıyor.');
  const backup=JSON.parse(await file.text());
  if(backup.format!==FORMAT||backup.algorithm!=='AES-256-GCM'||backup.kdf!=='PBKDF2-SHA256'||backup.iterations!==ITERATIONS)
    throw new Error('Dosya formatı tanınmıyor veya şifreleme yöntemi beklenenden farklı.');
  const salt=unb64(backup.salt),iv=unb64(backup.iv),ciphertext=unb64(backup.ciphertext);
  if(salt.length!==16||iv.length!==12)throw new Error('Dosyanın güvenlik parametreleri geçersiz.');
  const key=await getKey(password,salt);
  const opened=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,ciphertext);
  const payload=JSON.parse(DECODER.decode(opened));
  if(payload.format!==FORMAT||!payload.data||Object.keys(MODELS).some(n=>!Array.isArray(payload.data[n])))
    throw new Error('Çözümlenen dosyanın beklenen alanları eksik.');
  return {date:payload.created_at,counts:Object.fromEntries(Object.keys(MODELS).map(n=>[n,payload.data[n].length]))};
}
export default function EncryptedTenderBackupPanel(){
  const {user}=useAuth()||{};
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [file,setFile]=useState(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const admin=user?.role==='admin';
  const run=async(action)=>{
    setError('');setMessage('');
    if(!admin){setError('Bu işlem yalnızca yöneticilere açıktır.');return;}
    if(password.length<16){setError('En az 16 karakterlik, tahmin edilmesi güç bir yedekleme parolası gerekli.');return;}
    if(!globalThis.crypto?.subtle){setError('Güvenli tarayıcı şifrelemesi desteklenmiyor.');return;}
    if(action==='export'&&password!==confirm){setError('Parola tekrarını kontrol edin.');return;}
    if(action==='verify'&&!file){setError('Doğrulamak için şifreli dosyayı seçin.');return;}
    setBusy(true);
    try{
      if(action==='export'){
        const output=await exportBackup(password);
        const url=URL.createObjectURL(new Blob([JSON.stringify(output)],{type:'application/json'}));
        const anchor=document.createElement('a');
        anchor.href=url;
        anchor.download='atlas-teknik-yedek-'+new Date().toISOString().slice(0,10)+'.atlas.enc.json';
        document.body.appendChild(anchor);anchor.click();anchor.remove();
        setTimeout(()=>URL.revokeObjectURL(url),2000);
        setMessage('Şifreli teknik yedek oluşturuldu ve indirme başlatıldı. Tarayıcıda dosyanın indiğini ayrıca kontrol edin. Parolayı güvenli bir yerde saklayın. Ayrı ve güvenilir bir konuma kopyalamadan bağımsız yedek tamamlanmış sayılmaz.');
      }else{
        const check=await inspectBackup(file,password);
        setMessage('Dosya belirtilen parolayla başarıyla açıldı. Kayıt sayıları: '+Object.entries(check.counts).map(([k,n])=>k+': '+n).join(' · ')+'. Bu doğrulama veritabanına geri yükleme yapmaz.');
      }
    }catch(e){
      setError(action==='verify'?'Dosya açılamadı. Parola yanlış, dosya hasarlı veya format geçersiz olabilir.':'Teknik yedek oluşturulamadı: '+(e?.message||'Kontrol hatası'));
    }finally{setBusy(false);setPassword('');setConfirm('');}
  };
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-base font-extrabold"><Lock size={19}/> Şifreli teknik veri yedeği — pilot</h2>
      <p className="mt-2 text-xs leading-6 text-muted-foreground">
        Yalnız yöneticiler, ihale analizi / teknik şartname / poz / iş paketi kayıtlarının şifreli JSON
        kopyasını kendi cihazına indirebilir. AES-256-GCM şifrelemesi cihazda yapılır; parola sunucuya gönderilmez.
        Bu <strong>tam veritabanı yedeği değildir.</strong> Ekli Word/PDF dosyalarının kendisi, firma ve çalışan
        verileri veya güvenlik anahtarları dosyaya alınmaz.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold">Yedekleme parolası (en az 16 karakter)
          <input type="password" autoComplete="new-password" value={password}
            onChange={e=>setPassword(e.target.value)} minLength={16}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
        </label>
        <label className="text-xs font-bold">Yeni dosya için parolayı tekrar yaz
          <input type="password" autoComplete="new-password" value={confirm}
            onChange={e=>setConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-normal"/>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={()=>run('export')} disabled={!admin||busy}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40">
          <Download size={15}/> Şifreli teknik yedeği indir
        </button>
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs font-bold"><FileCheck2 size={16}/> İndirilen yedeği test et (dosya sunucuya yüklenmez)</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Dosyayı seç, üstteki parola alanına o dosyanın parolasını yaz ve doğrula.
          Dosya tamamen tarayıcıda açılıp kontrol edilir; kayıtların veritabanına geri yüklenmesi yapılmaz.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="file" accept=".json,application/json" onChange={e=>setFile(e.target.files?.[0]||null)}
            className="max-w-full text-xs"/>
          <button type="button" onClick={()=>run('verify')} disabled={!admin||busy||!file}
            className="rounded-lg border border-border px-3 py-2 text-xs font-bold disabled:opacity-40">
            <Upload size={14} className="mr-1 inline"/> Şifreyi ve dosyayı doğrula
          </button>
        </div>
      </div>
      {error&&<p role="alert" className="mt-3 rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-900">{error}</p>}
      {message&&<p role="status" className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">{message}</p>}
      <p className="mt-3 flex items-start gap-2 text-[11px] leading-5 text-amber-800">
        <ShieldAlert className="mt-0.5 shrink-0" size={15}/>
        Parolayı kaybederseniz dosya geri açılamaz. Şifreli dosyayı ayrı ve güvenli depolama alanında tutun.
        Üretim için otomatik ve tam veri yedekleme ile geri yükleme testi ayrıca planlanmalıdır.
      </p>
    </section>
  );
}
