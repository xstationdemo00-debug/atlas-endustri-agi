import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, MessageCircle, RotateCcw, Send, ShieldAlert, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const START={role:'assistant',text:'Merhaba, Atlas Endüstri Ağı süreç asistanıyım. Benzer üretim yapan firma eşleştirmesi, proje açma, taahhüt, tedarik ve teklif süreçlerinde yardımcı olabilirim. Hangi konuda ilerleyelim?',link:'',label:''};
const QUICK=['Sistem nasıl çalışır, nereden başlamalıyım?','Benzer imalat yapan firmaları eşleştir','Proje veya taahhüt iş paketi açmak istiyorum','Tedarikçi için teklif nasıl alınır?','İnsan desteğine nasıl ulaşabilirim?'];
export default function IndustryAssistant(){
  const {user}=useAuth();
  const location=useLocation();
  const [open,setOpen]=useState(false);
  const [messages,setMessages]=useState([START]);
  const [input,setInput]=useState('');
  const [busy,setBusy]=useState(false);
  const bottom=useRef(null);
  const count=useRef(0);
  useEffect(()=>{if(open)bottom.current?.scrollIntoView({behavior:'smooth',block:'end'});},[open,messages,busy]);
  async function ask(value){
    const message=String(value||'').trim();
    if(busy||message.length<2||message.length>650)return;
    const history=messages.slice(-4).map(x=>({role:x.role,text:x.text}));
    setMessages(x=>[...x,{role:'user',text:message}]);
    setInput('');setBusy(true);
    count.current++;
    const requestNumber=count.current;
    try{
      let result;
      if(user?.id){
        const raw=await base44.functions.invoke('industryGuide',{message,history});
        result=raw?.data??raw;
      }else{
        const response=await fetch('/functions/industryGuide',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,history})});
        result=await response.json();
        if(!response.ok)throw new Error(result.error||'Yanıt alınamadı.');
      }
      if(requestNumber!==count.current)return;
      if(!result?.ok||!result.answer)throw new Error(result?.error||'Asistan yanıtı yok.');
      const link=typeof result.link==='string'&&result.link.startsWith('/')?result.link:'';
      setMessages(x=>[...x,{role:'assistant',text:String(result.answer).slice(0,2000),link,label:String(result.label||'').slice(0,70)}]);
    }catch(error){
      if(requestNumber!==count.current)return;
      setMessages(x=>[...x,{role:'assistant',text:'Şu anda çevrimiçi yanıt alınamadı. Tekrar deneyebilir veya ilgili hizmet talebini doğrudan gönderebilirsiniz.',link:'/hizmetler#teklif',label:'Hizmet talebi'}]);
    }finally{if(requestNumber===count.current)setBusy(false);}
  }
  function reset(){count.current++;setBusy(false);setMessages([START]);setInput('');}
  return <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end sm:bottom-6 sm:right-6">
    {open&&<section className="mb-3 flex h-[min(640px,76dvh)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Atlas Endüstri Ağı süreç asistanı">
      <div className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
        <div className="flex items-center gap-3"><span className="rounded-lg bg-amber-500 p-2 text-slate-950"><Bot size={20}/></span><div><p className="text-sm font-extrabold">Atlas Asistan</p><p className="text-[11px] text-slate-300">Proje · Üretim · Tedarik · Teklif</p></div></div>
        <div className="flex items-center gap-1"><button onClick={reset} aria-label="Görüşmeyi temizle" title="Görüşmeyi temizle" className="rounded-md p-2 hover:bg-slate-800"><RotateCcw size={16}/></button><button onClick={()=>setOpen(false)} aria-label="Asistanı kapat" className="rounded-md p-2 hover:bg-slate-800"><X size={18}/></button></div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4" role="log" aria-live="polite">
        {messages.map((m,i)=><div key={i} className={'flex '+(m.role==='user'?'justify-end':'justify-start')}>
          <div className={'max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-6 shadow-sm '+(m.role==='user'?'rounded-br-md bg-slate-950 text-white':'rounded-bl-md border border-slate-200 bg-white text-slate-800')}>
            {m.text}
            {m.link&&<Link onClick={()=>setOpen(false)} to={m.link} className="mt-2 block rounded-lg bg-amber-100 px-3 py-2 text-center text-xs font-extrabold text-amber-900 underline">{m.label||'İlgili bölümü aç'}</Link>}
          </div>
        </div>)}
        {messages.length===1&&<div className="grid gap-2 pt-1">{QUICK.map((x,i)=><button key={i} type="button" onClick={()=>ask(x)} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs font-semibold text-amber-950 hover:bg-amber-100">{x}</button>)}</div>}
        {busy&&<div className="rounded-xl bg-white px-3 py-2 text-xs text-slate-500">İşlem değerlendiriliyor...</div>}
        <div ref={bottom}/>
      </div>
      <div className="border-t border-slate-200 bg-white p-3">
        <form onSubmit={e=>{e.preventDefault();ask(input);}} className="flex items-end gap-2">
          <label className="sr-only" htmlFor="industry-assistant-input">Asistana sor</label>
          <textarea id="industry-assistant-input" rows={2} value={input} maxLength={650} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(input);}}} placeholder="İmalat veya proje sorunuzu yazın..." className="min-h-[64px] flex-1 resize-none rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-amber-500"/>
          <button type="submit" disabled={busy||input.trim().length<2} className="rounded-xl bg-slate-950 p-3 text-white disabled:opacity-40" aria-label="Asistana gönder"><Send size={17}/></button>
        </form>
        <Link to="/destek" onClick={()=>setOpen(false)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 underline">Destek Merkezi</Link>
        <p className="mt-2 flex gap-1.5 text-[10px] leading-4 text-slate-500"><ShieldAlert size={13} className="shrink-0"/>Süreç yönlendirmesi sunar; firma, sertifika ve işbirliği doğrulaması yapmaz. Kimlik, sağlık veya finansal bilgi paylaşmayın.</p>
      </div>
    </section>}
    <button type="button" onClick={()=>setOpen(x=>!x)} title="Atlas Asistan" className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400 bg-slate-950 text-white shadow-xl hover:bg-slate-800" aria-label={open?'Asistanı kapat':'Atlas Asistanı aç'}>
      {open?<X size={20}/>:<MessageCircle size={20}/>}
    </button>
  </div>;
}