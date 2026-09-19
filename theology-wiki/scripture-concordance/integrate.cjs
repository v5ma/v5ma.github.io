/* Explicit, idempotent integration of reviewed supplements into two canonical articles. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),blob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const rows=[['trump-first-beast-of-revelation','first-beast-supplement.md','a3fb7a6b240c10db797a54fd280b1b7ea84ec133'],['antichrist-as-a-pattern-of-conduct','conduct-supplement.md','87a990f289ad2bd16d37a2c93bd4bb342fe36d24']];
const receipt=[];
for(const[slug,supplement,expected]of rows){const file=path.join(root,'editorial/authorial-articles',slug+'.md'),a=fs.readFileSync(file),b=fs.readFileSync(path.join(__dirname,supplement));let original=a;
 if(a.subarray(a.length-b.length).equals(b))original=a.subarray(0,a.length-b.length);
 if(blob(original)!==expected)throw Error('Canonical source changed: '+slug);
 const output=Buffer.concat([original,b]);if(!a.equals(output))fs.writeFileSync(file,output);
 receipt.push({slug,originalGitBlob:expected,originalBytes:original.length,supplement,integratedGitBlob:blob(output)});
}
const metaPath=path.join(root,'editorial/authorial.json'),meta=JSON.parse(fs.readFileSync(metaPath));
if(meta.updated<='2026-09-17'){meta.version='2026.09.17-scripture-concordance-1';meta.updated='2026-09-17';}
for(const p of meta.articles){if(!rows.some(r=>r[0]===p.slug))continue;p.updated='2026-09-17';p.summary=p.slug==='trump-first-beast-of-revelation'?'The attributed First Beast interpretation with dated cases, Butler reception, shared imagery and a source-linked 148-passage concordance.':'Conduct, typology, recurring forms and historical reception, with distinctions among individuals, public personae, institutions and claimed final fulfillment.';}
fs.writeFileSync(metaPath,JSON.stringify(meta,null,2)+'\n');
const sentence='\nThe September 17 scripture-concordance edition integrates the Butler reception and shared-imagery records into the existing First Beast article, and develops typology and historical comparisons in the Antichrist-as-conduct article. The [148-passage concordance](scripture-concordance/index.html) supplies 128 biblical verses and 20 wider-corpus sections with explicit actors, translated sources and documentary questions; it assigns no leader scores or match totals. Canonical source additions are in scripture-concordance/*-supplement.md and the two integrated authorial article bodies. Main reader, search and listening derivatives are regenerated without changing original conversations or forecast dates.\n';
const readme=path.join(root,'README.md');let text=fs.readFileSync(readme,'utf8');if(!text.includes('The September 17 scripture-concordance edition'))fs.writeFileSync(readme,text+sentence);
fs.writeFileSync(path.join(__dirname,'integration-receipt.json'),JSON.stringify({schema_version:1,edition_date:'2026-09-17',articles:receipt,method:'Append-only canonical supplements; preserved prefixes verified by original Git blob identity. Main derivatives rebuilt separately.'},null,2)+'\n');
console.log(JSON.stringify({integrated:receipt.map(r=>r.slug)}));
