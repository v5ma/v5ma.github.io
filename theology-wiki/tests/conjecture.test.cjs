
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
test('The five connected pages expose the author conditional scope',()=>{
 const cfg=json('editorial/publication.json'),pages=json('data/page-index.json');
 for(const slug of cfg.conditionalScope.pages){const p=pages.find(x=>x.slug===slug);assert(p);assert.equal(p.claimType,'Conditional philosophical conjecture');assert(p.authorialScope.includes('does not know for sure'));}
});
test('Both new expositions state uncertainty before developing the conjecture',()=>{
 for(const slug of ['computational-god-consciousness-and-theodicy','computational-god-capabilities-bridge']){
  const p=json('data/page-index.json').find(x=>x.slug===slug),text=read('content/'+p.path);
  assert(text.indexOf('I do not know for sure.')<1500);assert(text.includes('not advising readers'));assert(text.includes('Computational-Tomographic Proof of God'));assert(text.includes('Reframing Reality'));assert(text.includes('Four Pillars'));
 }
});
test('The reader renders scope as text and clears it on route changes',()=>{
 const s=read('assets/js/publication-tools.js');assert(s.includes("text.textContent=page.authorialScope"));assert(s.includes("document.getElementById('conjecture-scope')?.remove()"));
});
