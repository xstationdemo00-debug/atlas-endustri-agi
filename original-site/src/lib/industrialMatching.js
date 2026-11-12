// Explainable B2B manufacturing similarity. Leads are NOT verified members.
export const CAPABILITY_LABELS = {laser_cutting:'Lazer/plazma kesim',bending:'Abkant / büküm',welding:'Kaynaklı imalat',machining:'Talaşlı imalat',assembly:'Montaj',structural_steel:'Çelik konstrüksiyon',pipework:'Endüstriyel borulama',fabrication:'Metal imalat',stainless_process:'Paslanmaz proses',coating:'Kaplama / boya',material_supply:'Malzeme tedariki'};
export const MATERIAL_LABELS={carbon_steel:'Karbon çelik',stainless_steel:'Paslanmaz',aluminium:'Alüminyum',generic_metal:'Genel metal'};
export const FAMILY_LABELS={sheet_metal:'Sac metal imalat',industrial_fabrication:'Endüstriyel imalat',industrial_welding:'Kaynaklı üretim',piping_process:'Borulama / proses',material_supply:'Malzeme tedariki'};
const normal=(items)=>new Set(Array.isArray(items)?items.filter(x=>typeof x==='string'):[]);
const overlap=(a,b)=>[...a].filter(x=>b.has(x));
const location=(s)=>String(s||'').split('/')[0].trim().toLocaleLowerCase('tr');
export function scoreManufacturingMatch(source,target){
  if(!source||!target||source.id===target.id) return null;
  const a=normal(source.capability_tags),b=normal(target.capability_tags);
  const common=overlap(a,b);
  if(common.length===0)return null;
  const family=!!(source.manufacturing_family&&target.manufacturing_family&&source.manufacturing_family===target.manufacturing_family);
  const similarity=common.length/Math.max(a.size,b.size,1);
  const materials=overlap(normal(source.material_tags),normal(target.material_tags));
  const industries=overlap(normal(source.industry_tags),normal(target.industry_tags));
  const sameRegion=location(source.city)===location(target.city)&&!!location(source.city);
  const score=Math.round((family?38:0)+(similarity*37)+(materials.length>0?10:0)+(industries.length>0?10:0)+(sameRegion?5:0));
  const reasons=[
    ...(family?['Aynı üretim ailesi: '+(FAMILY_LABELS[source.manufacturing_family]||source.manufacturing_family)]:[]),
    'Ortak süreçler: '+common.map(x=>CAPABILITY_LABELS[x]||x).join(', '),
    ...(materials.length?['Ortak malzeme: '+materials.map(x=>MATERIAL_LABELS[x]||x).join(', ')]:[]),
    ...(sameRegion?['Aynı ilde üretim']:[])
  ];
  return {score,common,reasons,category:family||similarity>=0.55?'Benzer imalat':'Tamamlayıcı imalat',verification:'Web araştırması; kapasite ve işbirliği teyidi gerekli'};
}
export function rankManufacturingMatches(source,candidates,options={}){
  const {requireSameFamily=false,city='',limit=20}=options;
  return (candidates||[]).filter(x=>x?.id!==source?.id&&!x?.opt_out&&!x?.is_demo)
    .filter(x=>!requireSameFamily||x.manufacturing_family===source.manufacturing_family)
    .filter(x=>!city||location(x.city)===location(city))
    .map(company=>({company,match:scoreManufacturingMatch(source,company)}))
    .filter(x=>x.match&&x.match.score>=30)
    .sort((a,b)=>b.match.score-a.match.score||String(a.company.company_name).localeCompare(String(b.company.company_name),'tr'))
    .slice(0,limit);
}
