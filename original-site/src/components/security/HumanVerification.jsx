import { useEffect, useRef, useState } from 'react';

const SCRIPT_URL='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let captchaScriptPromise;
function loadCaptchaScript(){
  if(window.turnstile)return Promise.resolve();
  if(!captchaScriptPromise){
    captchaScriptPromise=new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=SCRIPT_URL; script.async=true; script.defer=true;
      script.onload=resolve;
      script.onerror=()=>{captchaScriptPromise=null;reject(new Error('Bot doğrulama servisi yüklenemedi.'));};
      document.head.appendChild(script);
    });
  }
  return captchaScriptPromise;
}

/** Turnstile is active only after both site and secret keys are set on the backend. */
export default function HumanVerification({action,onToken}){
  const container=useRef(null);
  const widget=useRef(null);
  const callback=useRef(onToken);
  const [config,setConfig]=useState(null);
  const [error,setError]=useState('');
  useEffect(()=>{callback.current=onToken;},[onToken]);
  useEffect(()=>{
    let alive=true;
    fetch('/functions/publicCaptchaConfig',{method:'POST',cache:'no-store'})
      .then(response=>{if(!response.ok)throw new Error('Bot doğrulama durumu alınamadı.');return response.json();})
      .then(data=>{if(alive)setConfig(data);})
      .catch(()=>{if(alive)setError('Bot doğrulama kontrolü yapılamadı. Tekrar deneyin.');});
    return ()=>{alive=false;};
  },[]);
  useEffect(()=>{
    if(!config?.enabled||!container.current)return;
    let active=true;
    setError('');
    loadCaptchaScript().then(()=>{
      if(!active||!container.current||!window.turnstile)return;
      if(widget.current!==null)return;
      widget.current=window.turnstile.render(container.current,{
        sitekey:config.site_key,action,theme:'auto',size:'normal',
        callback:token=>callback.current?.(token),
        'expired-callback':()=>callback.current?.(''),
        'error-callback':()=>{callback.current?.('');setError('Doğrulama başarısız; yeniden deneyin.');},
      });
    }).catch(e=>{if(active)setError(e.message||'Doğrulama yüklenemedi.');});
    return ()=>{
      active=false;
      if(widget.current!==null&&window.turnstile){
        try{window.turnstile.remove(widget.current);}catch{}
        widget.current=null;
      }
    };
  },[action,config?.enabled,config?.site_key]);
  return (
    <div className="space-y-2">
      {config?.enabled&&(
        <>
          <p className="text-xs font-semibold">Otomatik başvuruları engellemek için insan doğrulamasını tamamlayın.</p>
          <div ref={container}/>
        </>
      )}
      {error&&<p role="alert" className="text-xs font-semibold text-rose-700">{error}</p>}
    </div>
  );
}
