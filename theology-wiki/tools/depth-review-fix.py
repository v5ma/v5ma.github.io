"""Fix a local illustration binding exposed by native browser verification."""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def replace(file,old,new):
 p=ROOT/file;s=p.read_text();assert s.count(old)==1,(file,s.count(old));p.write_text(s.replace(old,new))
replace('assets/js/research-tools.js',"const figure=wrapper.firstElementChild;figure.querySelector('img').loading='eager';if(second)second.before(figure);else body.append(figure);", "const illustration=wrapper.firstElementChild;illustration.querySelector('img').loading='eager';if(second)second.before(illustration);else body.append(illustration);")
replace('assets/js/research-tools.js',"onPage(event.detail).catch(e=>announce('Reader tools could not finish: '+e.message));", "onPage(event.detail).catch(e=>{announce('Reader tools could not finish: '+e.message);if(reader()?.current()?.slug===event.detail.slug){const note=document.createElement('p');note.className='wiki-error';note.textContent='Reader tools could not finish. The article text is still available; reload to retry.';$('#article-body')?.prepend(note);}});")
replace('tests/browser.py', "all('Self Aware Networks GPT' in t for t in page.locator('#page-list .depth-search-match').all_inner_texts())", "page.locator('#page-list .depth-search-match').count()>0 and all('Self Aware Networks GPT' in t for t in page.locator('#page-list .depth-search-match').all_inner_texts())")
Path(__file__).unlink()
