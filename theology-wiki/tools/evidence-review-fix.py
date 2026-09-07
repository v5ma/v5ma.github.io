"""Keep comparison URL choices distinct and inspect real accessible layouts."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/js/evidence-core.js';s=p.read_text()
old="const first=params.get('claim'),second=params.get('compare');return {first:ids.has(first)?first:(ids.has('jt-knowledge')?'jt-knowledge':data.claims[0]?.id||''),second:ids.has(second)&&second!==first?second:''"
new="const requested=params.get('claim'),second=params.get('compare'),first=ids.has(requested)?requested:(ids.has('jt-knowledge')?'jt-knowledge':data.claims[0]?.id||'');return {first,second:ids.has(second)&&second!==first?second:''"
assert s.count(old)==1;s=s.replace(old,new)
old="invalid:Boolean(first&&!ids.has(first)||second&&!ids.has(second))";new="invalid:Boolean(requested&&!ids.has(requested)||second&&!ids.has(second))"
assert s.count(old)==1;p.write_text(s.replace(old,new))
p=root/'tests/evidence.test.cjs';s=p.read_text();s+="\ntest('Fallback first selection cannot duplicate a requested second claim',()=>{const s=C.selection(d,new URLSearchParams({claim:'unknown',compare:'jt-knowledge'}));assert(s.invalid);assert.equal(s.first,'jt-knowledge');assert.equal(s.second,'');const normal=C.selection(d,new URLSearchParams({claim:'jt-knowledge',compare:'jt-knowledge'}));assert.equal(normal.second,'');});\n";p.write_text(s)
p=root/'tests/evidence_checks.py';s=p.read_text()
old="    page.locator('#evidence-workspace').scroll_into_view_if_needed();page.screenshot(path=str(OUT/'evidence-desktop.png'))"
new="""    page.locator('#evidence-search').focus();page.keyboard.press('Tab')
    check('Keyboard traversal reaches the next labeled filter',page.locator('#evidence-topic').evaluate('(el)=>el===document.activeElement'))
    for selector in ['#evidence-workspace h2','.evidence-card p','.evidence-card a','.evidence-kicker','#evidence-search']:
        ratio=page.locator(selector).first.evaluate(r'''(el)=>{
          const rgb=s=>(s.match(/[\\d.]+/g)||[]).map(Number);
          const lum=c=>c.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
          const fg=rgb(getComputedStyle(el).color);let node=el,bg=[255,255,255];
          while(node){const c=rgb(getComputedStyle(node).backgroundColor);if(c.length===3||c[3]===1){bg=c;break;}node=node.parentElement;}
          const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        }''')
        check('Comparison text contrast is at least 4.5:1: '+selector,ratio>=4.5)
    page.locator('#evidence-workspace h2').evaluate('(el)=>el.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/'evidence-desktop.png'))
    page.locator('#evidence-cards').evaluate('(el)=>el.scrollIntoView({block:"start"})');page.screenshot(path=str(OUT/'evidence-comparison-desktop.png'))"""
assert s.count(old)==1;p.write_text(s.replace(old,new))
Path(__file__).unlink()
