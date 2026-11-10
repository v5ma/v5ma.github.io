#!/usr/bin/env python3
"""Build an additive, evidence-bearing reading graph. Original sources are read-only."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, parse_qs, unquote
from collections import Counter, defaultdict
import hashlib, html, json, re, sys, unicodedata
from functools import lru_cache

HERE = Path(__file__).resolve().parent
WIKI = HERE.parent
MAXIMUM = 100
BASE = 'https://v5ma.github.io/theology-wiki/'
inputs = {}
def read(path):
    p = WIKI / path
    b = p.read_bytes()
    inputs[path] = hashlib.sha256(b).hexdigest()
    return b.decode('utf-8-sig')
def data(path): return json.loads(read(path))
@lru_cache(maxsize=None)
def norm(s):
    s = unicodedata.normalize('NFKD', str(s)).casefold()
    return re.sub(r'[^\w]+', ' ', ''.join(c for c in s if not unicodedata.combining(c))).strip()
def compact(s): return re.sub(r'\s+', ' ', s).strip()
def clean_md(text):
    text = re.sub(r'^---\s*\n.*?\n---\s*\n', '', text, flags=re.S)
    text = re.sub(r'<!-- NINE-WIKI-[\s\S]*?<!-- NINE-WIKI-[^\n]*?:END -->', '', text)
    text = re.sub(r'<!--.*?-->', '', text, flags=re.S)
    text = re.split(r'^## (?:Reader Link Routes|Graph Read Next|Related Graph Routes|Source conversations|External sources and access notes|Recovery Use)\b', text, flags=re.M)[0]
    return text
def plain_md(text):
    text = re.sub(r'\[\[([^]|]+)\|([^]]+)\]\]', r'\2', text)
    text = re.sub(r'\[\[([^]]+)\]\]', r'\1', text)
    text = re.sub(r'\[([^]]+)\]\([^)]+\)', r'\1', text)
    return compact(re.sub(r'[`*#_]', '', text))

class Prose(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack=[]; self.parts=[]; self.links=[]; self.title=[]; self.h1=[]; self.description=''; self.heading=[]; self.skip_section=False; self.subheadings=[]; self.parabuffer=[]; self.paragraphs=[]
    def handle_starttag(self, tag, attrs):
        a=dict(attrs); parent=self.stack[-1][1] if self.stack else False
        if tag=='h2':self.heading=[];self.skip_section=False
        skip=parent or tag in {'head','script','style','nav','footer','aside','noscript','svg'} or a.get('aria-hidden')=='true'
        if tag=='meta' and a.get('name')=='description': self.description=a.get('content','')
        if tag not in {'meta','link','img','br','hr','input','source','wbr','area','base','embed','param','track'}:
            self.stack.append((tag,skip))
        if not skip and not self.skip_section and tag=='a' and a.get('href'): self.links.append(a['href'])
    def handle_endtag(self,tag):
        if tag in {'p','li','tr','blockquote'} and self.parabuffer:self.paragraphs.append(compact(' '.join(self.parabuffer)));self.parabuffer=[]
        if tag=='h2' and re.match(r'^(?:selected |external |primary |further )?(?:sources|references|bibliography|works cited|reading|related|read next)\b',compact(' '.join(self.heading)),re.I):self.skip_section=True
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag: self.stack=self.stack[:i]; break
    def handle_data(self,text):
        tags=[x[0] for x in self.stack]
        if 'title' in tags:self.title.append(text)
        if 'h1' in tags:self.h1.append(text)
        if 'h2' in tags:self.heading.append(text)
        if any(t in tags for t in ['h2','h3','h4']) and not self.skip_section:self.subheadings.append(text)
        if (not self.stack or not self.stack[-1][1]) and not self.skip_section:self.parts.append(text);self.parabuffer.append(text)

index=data('data/page-index.json')
proposal=data('connections/editorial-links.json')
cues=data('connections/topic-cues.json')
read('research-expansion-20260918/board-peace-followup/register.json')
registry={}; bodies={}; authored={}; headings={}; evidence_sources={}; paragraph_sets={}
for p in index:
    pid='reader:'+p['slug']; source='content/'+p['path']; md=clean_md(read(source))
    prose=plain_md(md)
    if p.get('sourceFile'):
        preview=re.split(r'^## Source Preview\s*',md,flags=re.M)
        preview=plain_md(preview[-1]) if len(preview)>1 else ''
        excerpt=p.get('primaryExcerpt','')
        # One preview only: a summary and its duplicate excerpt are not independent occurrences.
        prose=max([preview,excerpt],key=len)
    headings[pid]=p['title']+' '+ ' '.join(re.findall(r'^#{1,4} (.+)$',md,re.M))
    evidence_sources[pid]=source
    if p.get('sourceFile'):
        archive='../theology-sources/chats/'+p['sourceFile']
        if not (WIKI/archive).exists():raise ValueError('Full archive missing: '+archive)
        prose=read(archive);evidence_sources[pid]=archive
    paragraph_sets[pid]=list(dict.fromkeys(compact(x) for x in re.split(r'\n\s*\n|\n(?=[#*-] )',prose) if len(compact(x))>=30))
    registry[pid]={'id':pid,'title':p['title'],'url':'san-reader.html?page='+p['slug'],'kind':p.get('kind','Wiki page'),'source':source,'summary':''}
    bodies[pid]=prose
    authored[pid]=[] if p.get('sourceFile') else re.findall(r'\[\[([^]|#]+)(?:#[^]|]*)?(?:\|[^]]*)?\]\]',md)

static_paths=data('connections/static-paths.json')
for path in static_paths:
    parser=Prose();parser.feed(read(path)); title=compact(' '.join(parser.h1)) or compact(' '.join(parser.title)).split('|')[0].strip() or path
    pid='static:'+path
    registry[pid]={'id':pid,'title':title,'url':path,'kind':'Published study' if path in {'research-reports/hyksos-avaris-20260922/index.html','comparative-religion/hexagram-star-of-david/index.html','research-expansion-20260918/board-peace-followup/index.html'} else 'Published guide' if Path(path).name in {'index.html','sources.html','directory.html','comparisons.html','claim-audit.html'} else 'Published study','source':path,'summary':''}
    bodies[pid]=compact(' '.join(parser.parts));authored[pid]=parser.links
    headings[pid]=title+' '+' '.join(parser.subheadings);evidence_sources[pid]=path
    paragraph_sets[pid]=list(dict.fromkeys(compact(x) for x in (parser.paragraphs or parser.parts) if len(compact(x))>=30))

aliases=data('connections/canonical-aliases.json')
for alias,target in aliases.items():
    if alias not in registry or target not in registry:raise ValueError('Invalid canonical alias')
    registry.pop(alias);bodies.pop(alias);authored.pop(alias)
# Use the title verified in the actual page while retaining the editorial relationship evidence.
def excluded(pid):
    p=registry[pid]
    return p['source'].startswith('content/clusters/') or 'repair' in p['source'] and p['kind']=='Legacy research note'
def no_semantics(pid):
    p=registry[pid]
    return excluded(pid) or p['kind'] in {'Navigator','Topic collection','Library home','Published guide'} or p['source'].startswith('content/clusters/')
edges={}; skipped=[]
def add(a,b,kind,why,evidence,rank):
    a=aliases.get(a,a);b=aliases.get(b,b)
    if a==b or (a in registry and excluded(a)) or (b in registry and excluded(b)):return
    if a not in registry or b not in registry:
        skipped.append({'from':a,'to':b,'reason':'Target is not in the canonical page registry'});return
    key=(a,b);value={'to':b,'type':kind,'why':why,'evidence':evidence,'rank':rank}
    if key not in edges or rank>edges[key]['rank']:edges[key]=value
for e in proposal['edges']:
    add(e['from'],e['to'],e['type'],e['why'],e.get('evidence',[]),1000 if e.get('origin')=='Editorial relationship' else 900)

def resolve(url,origin):
    absolute=urljoin(BASE+origin,url);u=urlparse(absolute)
    if u.netloc!='v5ma.github.io' or not u.path.startswith('/theology-wiki/'):return None
    rel=unquote(u.path[len('/theology-wiki/'):]); query=parse_qs(u.query)
    if rel in {'','index.html','san-reader.html'}:
        return 'reader:'+query.get('page',['home'])[0]
    if rel.endswith('/'):rel+='index.html'
    return 'static:'+rel if 'static:'+rel in registry else None
for pid,targets in authored.items():
    if excluded(pid) or registry[pid]['kind'] in {'Navigator','Topic collection','Library home'}:continue
    if pid.startswith('reader:'):
        resolved=[('reader:'+s,s) for s in targets]
    else:resolved=[(resolve(t,registry[pid]['url']),t) for t in targets]
    for target,raw in resolved:
        if target and target in registry:
            add(pid,target,'Existing reading link','This page explicitly links to this wiki page. The link is a reading route, not proof of agreement.',[{'path':registry[pid]['source'],'link':raw}],600)
            add(target,pid,'Linked from','This wiki page links back to the current page. A citation does not imply endorsement.',[{'path':registry[pid]['source'],'link':raw}],580)

def hits(text,phrase):
    phrase=norm(phrase)
    return range((' '+norm(text)+' ').count(' '+phrase+' ')) if phrase else []
def snippet(text,term):
    text=display_excerpt(text)
    # Store the exact original excerpt, retaining readable spelling and punctuation.
    pattern=r'(?<!\w)'+r'[\W_]*'.join(re.escape(x) for x in str(term).split())+r'(?!\w)'
    m=re.search(pattern,text,re.I)
    if m:return compact(text[max(0,m.start()-90):min(len(text),m.end()+150)])
    return compact(text[:230])
def unique_terms(terms):
    seen=set();result=[]
    for term in terms:
        key=norm(term)
        if key and key not in seen:seen.add(key);result.append(term)
    return result

def distinct_spans(text,terms):
    normalized=' '+norm(text)+' ';spans=[]
    for term in unique_terms(terms):
        needle=' '+norm(term)+' ';start=0
        while True:
            start=normalized.find(needle,start)
            if start<0:break
            spans.append((start+1,start+len(needle)-1));start+=1
    merged=[]
    for a,b in sorted(spans):
        if merged and a<merged[-1][1]:merged[-1]=(merged[-1][0],max(merged[-1][1],b))
        else:merged.append((a,b))
    return merged

@lru_cache(maxsize=None)
def display_excerpt(text):
    text=re.sub(r'^\s*(?:Title|Date):[^\n]*\n','',text,flags=re.M)
    text=re.sub(r'\bciteturn\w*\b|\bturn\d+(?:search|news|view)\d+\b','',text)
    text=re.sub(r'\ue200.*?\ue201','',text,flags=re.S)
    text=re.sub(r'[\ue200-\ue2ff]','',text)
    return compact(text)

def group_window(paragraph,groups):
    paragraph=display_excerpt(paragraph)
    if not all(any(hits(paragraph,s) for s in group) for group in groups):return None
    for anchor in unique_terms(groups[0]):
        pattern=r'(?<!\w)'+r'[\W_]*'.join(re.escape(x) for x in anchor.split())+r'(?!\w)'
        for m in re.finditer(pattern,paragraph,re.I):
            window=paragraph[max(0,m.start()-100):m.end()+350]
            if all(any(hits(window,s) for s in group) for group in groups):return window
    return None

def topic_evidence(pid,t):
    p=registry[pid];title=p['title'];body=bodies[pid];title_headings=headings[pid]
    phrases=unique_terms(t.get('phrases',[]));groups=t.get('groups',[])
    present=[s for s in phrases if hits(title_headings,s) or len(hits(body,s))>=2]
    paragraphs=list({norm(par):par for par in paragraph_sets[pid]}.values())
    support=[];group_excerpt=''
    if present:
        focus_terms=phrases
        support=[par for par in paragraphs if any(hits(par,s) for s in phrases)]
    elif groups:
        focus_terms=unique_terms(groups[0])
        for par in paragraphs:
            window=group_window(par,groups)
            if window:support.append(par);group_excerpt=group_excerpt or window
        # A substantive heading plus the nearby prose can supply an explicit comparison.
        if not support:
            window=group_window(title+' — '+body[:600],groups)
            if not window:return None
            group_excerpt=window
    else:return None
    corroborating=t.get('corroborating',[])
    if corroborating and not any(hits(title+' '+body,s) for s in corroborating):return None
    occurrences=sum(len(distinct_spans(par,focus_terms)) for par in support)
    title_match=any(hits(title,s) for s in focus_terms)
    heading_match=any(hits(title_headings,s) for s in focus_terms)
    if not support and not heading_match:return None
    if support:
        chosen=max(support,key=lambda par:(len(distinct_spans(par,focus_terms))/max(80,len(par)),len(par)>=80))
        actual=next((s for s in focus_terms if hits(chosen,s)),focus_terms[0])
        excerpt=group_excerpt if groups and not present else snippet(chosen,actual)
    else:excerpt='Page title/heading: '+title_headings
    return {'topic':t['id'],'terms':focus_terms,'titleMatch':title_match,'headingMatch':heading_match,'strong':occurrences>=3 and len(support)>=2,'occurrences':occurrences,'paragraphs':len(support),'path':evidence_sources[pid],'excerpt':display_excerpt(excerpt),'sourceContext':'Archived discussion, potentially including AI replies and quoted material; not a verified factual assertion.' if p['kind']=='Conversation record' else 'Published page text; the comparison does not establish the claim.'}

matches={pid:{} for pid in registry}; by_topic=defaultdict(list)
for pid in registry:
    if no_semantics(pid):continue
    for t in cues['topics']:
        e=topic_evidence(pid,t)
        if e:matches[pid][t['id']]=e;by_topic[t['id']].append(pid)
topic_by_id={t['id']:t for t in cues['topics']}
pairs=set()
for ids in by_topic.values():
    for i,a in enumerate(ids):
        for b in ids[i+1:]:pairs.add(tuple(sorted([a,b])))
for a,b in sorted(pairs):
    shared={t for t in set(matches[a])&set(matches[b]) if all(matches[x][t]['strong'] or matches[x][t]['headingMatch'] for x in [a,b])}
    if not shared:continue
    focused={x:any(matches[x][t]['headingMatch'] for t in shared) for x in [a,b]}
    if len(shared)==1:
        t=next(iter(shared))
        ea,eb=matches[a][t],matches[b][t]
        if not ((ea['headingMatch'] and (eb['headingMatch'] or eb['strong'])) or (eb['headingMatch'] and ea['strong'])):continue
    elif not (any(focused.values()) and all(any(matches[x][t]['strong'] or matches[x][t]['headingMatch'] for t in shared) for x in [a,b])):
        if not all(sum(matches[x][t]['strong'] for t in shared)>=2 for x in [a,b]):continue
    selected=sorted(shared,key=lambda x:(len(by_topic[x]),x))[:3]
    # A named narrow subject is sufficient; generic vocabulary never reaches this stage.
    score=200+len(selected)*20+sum(matches[x][t]['titleMatch']*10 for x in [a,b] for t in selected)
    label='; '.join(topic_by_id[t]['label'] for t in selected)
    qualification=' '.join(topic_by_id[t]['qualification'] for t in selected[:1])
    why='Compare '+label+'. '+qualification
    evidence=[{'path':matches[x][t]['path'],'matchedTerms':matches[x][t]['terms'],'topic':t,'endpoint':x,'sourceContext':matches[x][t]['sourceContext']} for t in selected for x in [a,b]]
    add(a,b,'Shared subject',why,evidence,score)
    add(b,a,'Shared subject',why,evidence,score)

# Rank undirected pairs together so every selected route has a reciprocal route.
pair_keys={tuple(sorted(k)) for k in edges}
ranked=sorted(pair_keys,key=lambda pair:(-max(edges.get(pair,{}).get('rank',0),edges.get(pair[::-1],{}).get('rank',0)),pair))
chosen=defaultdict(list);capped=0
for a,b in ranked:
    if len(chosen[a])>=MAXIMUM or len(chosen[b])>=MAXIMUM:capped+=1;continue
    for source,target in [(a,b),(b,a)]:
        e=edges.get((source,target))
        if not e:
            reverse=edges[(target,source)]
            e={'to':target,'type':'Linked from','why':'Return to the page that makes this connection: '+reverse['why'],'evidence':reverse['evidence'],'rank':reverse['rank']-1}
        chosen[source].append(e)

pages=[]
for pid,p in sorted(registry.items(),key=lambda item:(norm(item[1]['title']),item[0])):
    bucket=norm(p['title'])[:1];bucket=bucket if bucket in 'abcdefghijklmnopqrstuvwxyz' else '0'
    links=sorted(chosen[pid],key=lambda e:(-e['rank'],norm(registry[e['to']]['title']),e['to']))
    for e in links:e.pop('rank',None)
    pages.append({**p,'directory':bucket+'.html','anchor':'p-'+hashlib.sha256(pid.encode()).hexdigest()[:12],'links':links})
policy={'maximum':MAXIMUM,'quota':False,'reciprocal':True,'matching':'Existing editorial and authored links first; narrow shared subjects require textual evidence at both endpoints. Shared generic religious words and category membership are excluded.','archiveScope':'Connections were checked against the existing public wiki and its preserved discussions. This directory publishes links, subject labels and relevance explanations, not copied conversation excerpts. Original source text and speaker attribution remain on the existing pages. A linked discussion is not an endorsement.','meaning':'A shared subject is a reading comparison, not proof of influence, identity, agreement, fulfillment or historical dependence.'}
out={'version':1,'policy':policy,'aliases':aliases,'pages':pages}
bucket_count=Counter()
for p in pages:
    bucket=p['directory'][0];number=bucket_count[bucket]//12+1;bucket_count[bucket]+=1
    p['directory']=bucket+'-'+str(number)+'.html'
lookup={p['id']:p for p in pages}
def esc(s):return html.escape(str(s),quote=True)
def href(p):return BASE+p['url']
def item(e):
    target=lookup[e['to']]
    support=[]
    for x in e['evidence']:
        endpoint=lookup.get(x.get('endpoint',''))
        if endpoint and endpoint['id'] not in [q[0] for q in support]:support.append((endpoint['id'],'<p><a href="'+esc(href(endpoint))+'">Read the original '+esc(endpoint['kind'].lower())+': '+esc(endpoint['title'])+'</a></p>'))
    proof=''.join(q[1] for q in support)
    return '<li><a href="'+esc(href(target))+'">'+esc(target['title'])+'</a> <span class="wc-kind">'+esc(e['type'])+'</span><p>'+esc(e['why'])+'</p>'+('<details><summary>Original wiki pages for this comparison</summary>'+proof+'</details>' if proof else '')+'</li>'
def section(p):
    links=p['links']; first=''.join(item(e) for e in links[:12]);more=''.join(item(e) for e in links[12:])
    body='<ol class="wc-list">'+first+'</ol>' if links else '<p>No additional content-grounded recommendation was identified in the available page text. No unrelated links have been added to meet a quota.</p>'
    if more:body+='<details class="wc-more"><summary>Show '+str(len(links)-12)+' more connections</summary><ol class="wc-list" start="13">'+more+'</ol></details>'
    return '<section class="wc-page" id="'+p['anchor']+'"><h2><a href="'+esc(href(p))+'">'+esc(p['title'])+'</a></h2><p>'+esc(p['kind'])+' · '+str(len(links))+' explained connections</p>'+body+'<p><a href="index.html">Find another page</a> · <a href="#top">Back to top</a></p></section>'
def shell(title,body,script=''):
    return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' | Theology Wiki</title><link rel="stylesheet" href="connections.css"></head><body class="wc-directory"><a class="wc-skip" href="#main">Skip to content</a><header id="top"><a href="../purpose/">Theology Wiki</a> · <a href="../san-reader.html">Reader</a> · <a href="index.html">Connections directory</a></header><main id="main"><h1>'+esc(title)+'</h1>'+body+'</main>'+script+'</body></html>\n'
# Intern repeated rationales and excerpts; the reader never downloads duplicate evidence thousands of times.
types=[];reasons=[];evidence=[];interned={};positions={p['id']:i for i,p in enumerate(pages)}
def intern(value,table,kind):
    key=(kind,json.dumps(value,ensure_ascii=False,sort_keys=True))
    if key not in interned:interned[key]=len(table);table.append(value)
    return interned[key]
packed=[]
for p in pages:
    packed.append({**{k:v for k,v in p.items() if k not in {'links','summary'}},'links':[[positions[e['to']],intern(e['type'],types,'type'),intern(e['why'],reasons,'reason'),[intern(x,evidence,'evidence') for x in e['evidence']]] for e in p['links']]})
compact_graph={'version':1,'encoding':'tables-v1','aliases':aliases,'policy':policy,'types':types,'reasons':reasons,'evidence':evidence,'pages':packed}
outputs={'data.json':json.dumps(compact_graph,ensure_ascii=False,separators=(',',':'))+'\n'}
by_bucket=defaultdict(list)
for p in pages:by_bucket[p['directory']].append(p)
for filename,group in by_bucket.items():
    intro='<p>Read a connection as a route into another argument, not as proof of agreement. Existing editorial links appear before shared-subject comparisons. All '+str(len(group))+' page sections below are available without JavaScript.</p>'
    toc='<nav aria-label="Pages in this group"><ul>'+''.join('<li><a href="#'+p['anchor']+'">'+esc(p['title'])+'</a> ('+str(len(p['links']))+')</li>' for p in group)+'</ul></nav>'
    outputs[filename]=shell('Connections: '+filename[0].upper(),intro+toc+''.join(section(p) for p in group))
rows=''.join('<li data-title="'+esc(norm(p['title']+' '+p['summary']+' '+p['kind']+' '+' '.join(topic_by_id[t]['label'] for t in matches[p['id']])))+'"><a href="'+p['directory']+'#'+p['anchor']+'">'+esc(p['title'])+'</a><span> '+esc(p['kind'])+' · '+str(len(p['links']))+' connections</span></li>' for p in pages)
intro='<p><a href="../discover/index.html">Find a study across the wiki</a> · Search titles, topics and study headings, or follow a reading route.</p><p>A single reading network for the archived conversations, developed articles, and standalone studies. Every recommendation has a reason. Up to 100 per page is a ceiling, never a target.</p><p>'+esc(policy['meaning'])+'</p><p>'+esc(policy['archiveScope'])+'</p><label for="wc-search">Find a page, subject or study</label><input id="wc-search" type="search" placeholder="Try RPPA, Samaritan, Gaza, or Qumran"><p id="wc-search-status" role="status">'+str(len(pages))+' pages</p><ul id="wc-directory-list">'+rows+'</ul><p><a href="report.json">Coverage and exceptions</a> · <a href="method.html">How connections are selected</a></p>'
outputs['index.html']=shell('Explore the wiki’s connections',intro,'<script defer src="directory.js"></script>')
outputs['method.html']=shell('How these connections are selected','<p>'+esc(policy['matching'])+'</p><p>'+esc(policy['meaning'])+'</p><p>'+esc(policy['archiveScope'])+'</p><p>Editorial connections preserve their stated reasons. Existing links gain a route back. Shared-subject comparisons use named works, figures, places, or narrowly defined questions with source references at both ends. Broad category membership, navigation boilerplate, old automatic repair candidates, and generic words such as God or religion do not qualify by themselves.</p><p>The first twelve links are visible immediately; more appear in an expandable list. The complete directory works without JavaScript. Individual reader pages use the same data. No source text is rewritten.</p><p>Some source previews are short or concern incidental non-theological matters. Those pages can have fewer links, or none. This is preferable to inventing relevance. The available source record is not a certification of every claim it contains.</p>')
counts=sorted(len(p['links']) for p in pages)
report={'pages':len(pages),'servedPageAddresses':len(pages)+len(aliases),'aliases':aliases,'readerPages':len(index),'standalonePages':len(static_paths),'directedConnections':sum(counts),'reciprocalPairs':sum(counts)//2,'minimum':min(counts),'median':counts[len(counts)//2],'maximum':max(counts),'at100':sum(x==100 for x in counts),'under12':sum(x<12 for x in counts),'zero':sum(x==0 for x in counts),'linkTypes':dict(Counter(e['type'] for p in pages for e in p['links'])),'excludedAtCapacity':capped,'unresolved':skipped,'exceptions':[{'id':p['id'],'title':p['title'],'connections':len(p['links']),'reason':'No qualifying narrow-topic or authored relationship in available text' if not p['links'] else 'Only these supported connections were found; no quota padding'} for p in pages if len(p['links'])<5],'inputSha256':dict(sorted(inputs.items()))}
outputs['report.json']=json.dumps({k:v for k,v in report.items() if k!='inputSha256'},ensure_ascii=False,indent=2)+'\n'
if skipped:raise ValueError('Unresolved editorial links: '+str(skipped))
outputs['publication-files.json']=json.dumps(sorted(list(outputs)+['publication-files.json']),indent=2)+'\n'
check='--check' in sys.argv
for name,content in outputs.items():
    target=HERE/name
    if check:
        if not target.exists() or target.read_text()!=content:raise ValueError('Stale generated output: '+name)
    else:target.write_text(content)
print(json.dumps({k:v for k,v in report.items() if k not in {'inputSha256','exceptions'}}))
