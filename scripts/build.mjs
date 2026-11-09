import {cpSync,existsSync,mkdirSync,readFileSync,readdirSync,rmSync,statSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const src=path.join(root,'frontend'), dest=path.join(root,'dist');
const must=['index.html','assets/app.js','assets/styles.css'];
for(const file of must){if(!existsSync(path.join(src,file)))throw new Error(`Eksik dosya: ${file}`)}
const html=readFileSync(path.join(src,'index.html'),'utf8');
for(const marker of ['ENDÜSTRİ AĞI','/api/inquiries','kvkk-consent']){if(!html.includes(marker))throw new Error('Sayfa işareti eksik: '+marker)}
if(!process.argv.includes('--check')){
 rmSync(dest,{recursive:true,force:true});mkdirSync(dest,{recursive:true});cpSync(src,dest,{recursive:true});
 const paths=[];const visit=(d)=>{for(const name of readdirSync(d)){const f=path.join(d,name);if(statSync(f).isDirectory())visit(f);else paths.push(path.relative(dest,f))}};visit(dest);
 console.log(`BUILD_OK: ${paths.length} dosya -> dist/ (${paths.join(', ')})`);
}else{console.log('BUILD_CHECK_OK: kaynak dosyaları ve sayfa işaretleri doğrulandı')}
