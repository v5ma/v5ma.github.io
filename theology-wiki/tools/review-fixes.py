"""One-time corrections from native-browser review; run before rebuilding."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def change(path, old, new):
    p=ROOT/path;s=p.read_text()
    assert s.count(old)==1,(path,'Unexpected patch baseline',s.count(old),old[:100])
    p.write_text(s.replace(old,new))
change('assets/js/research-tools.js', "body.querySelectorAll('h2')", "body.querySelectorAll('h2, h3')")
change('assets/js/research-tools.js', "while(n&&n.tagName!=='H2')", "while(n&&n.tagName!==heading.tagName)")
change('assets/js/research-tools.js', ' topActions(p);backlinks(p);', ''' topActions(p);backlinks(p);
 // The shared shell's unrelated product routers do not belong in Theology.
 for(const id of ['northstar-cluster-list','wave-absorption-read-next-list','page-companion-route-list','graph-json-read-next-list','fit-candidate-list','product-graph-read-next-list']){
  const list=document.getElementById(id);if(list){list.hidden=true;const label=list.previousElementSibling;if(label?.classList.contains('panel-label'))label.hidden=true;}
 }
 const sequence=$('#article-navigation'),path=info?.paths.find(x=>x.pages.includes(p.slug));
 if(sequence){sequence.hidden=!path;sequence.innerHTML=path?'<div class="article-navigation-context"><span>'+esc(path.title)+'</span><span>'+(path.pages.indexOf(p.slug)+1)+' of '+path.pages.length+'</span></div><div class="research-buttons">'+path.pages.filter((s,i)=>Math.abs(i-path.pages.indexOf(p.slug))===1).map(s=>a(s)).join('')+'</div>':'';}
''')
p=ROOT/'tools/build.cjs';s=p.read_text();needle=" runtime=patchOnce(runtime,'  const state = {','  let renderGeneration = 0;\\n  const state = {');"
assert s.count(needle)==1
insert=r'''
 runtime=patchOnce(runtime, `return '<a class="wiki-link" href="' + escapeHtml(localPageHref(page.slug)) + '">' + escapeHtml(label) + '</a>';`, `return '<a class="wiki-link" data-page="' + escapeHtml(page.slug) + '" href="' + escapeHtml(localPageHref(page.slug)) + '">' + escapeHtml(label) + '</a>';`);
 runtime=patchOnce(runtime, '(_match, target) => renderWikilink(target)', '(_match, target) => renderWikilink(target.replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,String.fromCharCode(34)).replace(/&#39;/g,String.fromCharCode(39)))');
'''
p.write_text(s.replace(needle,needle+insert))
change('tests/browser.py','window.TheologyReader.navigate(slug)', 'window.TheologyReader.navigate(slug, true)')
change('tests/browser.py', "page.locator('#article-body h2').count()>=3", "page.locator('#article-body h2, #article-body h3').count()>=3")
change('tests/browser.py', "'not found' in page.locator('#article-body').inner_text().lower() or 'unavailable' in page.locator('#article-body').inner_text().lower()", "page.evaluate('TheologyReader.current()===null') and 'page index does not contain' in page.locator('#article-body').inner_text().lower()")
change('tests/browser.py','TheologyReader.navigate("apocalyptic-repair-theology");setTimeout(()=>TheologyReader.navigate("religion-for-conscious-robots"),30)', 'TheologyReader.navigate("apocalyptic-repair-theology",true);setTimeout(()=>TheologyReader.navigate("religion-for-conscious-robots",true),30)')
Path(__file__).unlink()
print('Applied native-browser compatibility fixes; original conversations unchanged.')
