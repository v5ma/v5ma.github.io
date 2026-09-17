"""One-shot, metadata-only thematic screening. No political scores or diagnoses."""
from __future__ import annotations
import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import html
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import sys
import urllib.request

HERE = Path(__file__).resolve().parent
SOURCES = [
    {'id': 'twitter-historical', 'platform': 'Twitter', 'format': 'parquet',
     'url': 'https://huggingface.co/datasets/fschlatt/trump-tweets/resolve/main/data/train-00000-of-00001-4349c5d45dbcd707.parquet',
     'documentation': 'https://huggingface.co/datasets/fschlatt/trump-tweets/blob/main/README.md',
     'limit': 'Historical mirror; does not cover resumed X activity after January 2021. Naive archive datetimes are treated as UTC for indexing, pending individual timestamp checks.'},
    {'id': 'truth-cnn', 'platform': 'Truth Social', 'format': 'json',
     'url': 'https://ix.cnn.io/data/truth-social/truth_archive.json',
     'documentation': 'https://github.com/stiles/trump-truth-social-archive/blob/main/README.md',
     'limit': 'Independent live feed, not a certified complete native export. Repost attribution and image/video-only content require separate review.'}
]
TOPICS = {
 'war-force': ['war','bomb','missile','nuclear','military','surrender','destroy'],
 'loyalty-affiliation': ['loyal','loyalty','disloyal','betray','traitor','ungrateful','MAGA camp'],
 'punishment-enforcement': ['treason','seditious','sedition','arrest','jail','prison','execute','execution','retribution'],
 'personal-authority': ['I alone','I am your','total authority','Article II','Article 2','absolute right','saves his Country','king'],
 'sacred-language': ['God','Jesus','Christ','chosen one','second coming','savior','saviour','worship','divine'],
 'images-and-media': ['image','artificial intelligence','AI','video','statue','portrait','crown'],
 'survival-protection': ['assassination','bullet','wound','saved my life','protected by God','miracle'],
 'conditional-commerce': ['sanction','license','licence','barred','ban','tariff','reimbursement','funding'],
 'food-fuel-shipping': ['food','fuel','diesel','oil','fertilizer','fertiliser','grain','hunger','starve','Hormuz','shipping'],
 'peace-negotiation': ['peace','ceasefire','negotiation','negotiate','agreement','reconciliation'],
 'opponents-and-dissent': ['enemy','enemies','vermin','enemy within','enemy of the people','protest','leaker'],
 'rules-and-restraint': ['Constitution','lawful','illegal orders','peacefully','nonviolence','restraint','terminate','termination']
}
REGEX = {k:[(term,re.compile(r'(?<!\w)'+re.escape(term)+r'(?:s|ed|ing)?(?!\w)',re.I)) for term in v] for k,v in TOPICS.items()}
class TextParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]
    def handle_data(self,data): self.parts.append(data)
    def handle_starttag(self,tag,attrs):
        if tag in ('p','br','div'): self.parts.append(' ')
    def handle_endtag(self,tag):
        if tag in ('p','div'): self.parts.append(' ')
def clean(value):
    p=TextParser(); p.feed(str(value or '')); return ' '.join(html.unescape(''.join(p.parts)).split())
def digest(value): return hashlib.sha256(value).hexdigest()
def themes(text):
    return {k:[term for term,rx in terms if rx.search(text)] for k,terms in REGEX.items() if any(rx.search(text) for _,rx in terms)}
def date_text(value):
    if isinstance(value,datetime): return value.isoformat()
    return str(value or '')
def truthy(value): return value is True or str(value).lower() in ('true','t','1')
def normalize(row,source):
    ident=str(row.get('id') or row.get('id_str') or '')
    if not ident.isdigit(): raise ValueError('Non-numeric or missing post identifier')
    original=str(row.get('text') if source['platform']=='Twitter' else row.get('content') or '')
    text=clean(original)
    stamp=date_text(row.get('datetime') or row.get('created_at') or row.get('date'))
    day=stamp[:10]
    datetime.strptime(day,'%Y-%m-%d')
    url=row.get('url') or ('https://twitter.com/realDonaldTrump/status/'+ident if source['platform']=='Twitter' else 'https://truthsocial.com/@realDonaldTrump/'+ident)
    if not isinstance(url,str) or not url.startswith(('https://twitter.com/','https://x.com/','https://truthsocial.com/')): raise ValueError('Unexpected post URL')
    if 'is_retweet' in row: attribution='repost' if truthy(row['is_retweet']) else 'not_marked_repost'
    elif re.match(r'^RT\s+@',text): attribution='repost_text_marker'
    else: attribution='not_determined_by_feed'
    media=row.get('media') or row.get('media_attachments') or []
    if isinstance(media,str):
        try: media=json.loads(media)
        except (ValueError,TypeError): media=[]
    return {'id':source['platform'].lower().replace(' ','-')+':'+ident,'platform_id':ident,'platform':source['platform'],'date':day,'source_datetime':stamp,'original_url':url,'source_id':source['id'],'text_sha256':digest(text.encode()),'attribution':attribution,'has_text':bool(text),'media_count':len(media) if isinstance(media,list) else None,'topic_matches':themes(text),'review_status':'machine_screened_not_individually_reviewed'}, text

def fetch(source):
    request=urllib.request.Request(source['url'],headers={'User-Agent':'TheologyWikiSourceReview/1.0 (one-shot public-archive research)'})
    with urllib.request.urlopen(request,timeout=90) as response:
        raw=response.read(150_000_001)
    if len(raw)>150_000_000: raise ValueError('Source exceeds 150 MB safety limit')
    if source['format']=='parquet':
        import pyarrow.parquet as pq
        rows=pq.read_table(io.BytesIO(raw)).to_pylist()
    else: rows=json.loads(raw)
    if not isinstance(rows,list): raise ValueError('Expected a list of post records')
    return raw,rows

def run(output,cutoff):
    output.mkdir(parents=True,exist_ok=True)
    now=datetime.now(timezone.utc).isoformat()
    summary={'schema_version':1,'generated_at':now,'cutoff_date':cutoff,'screening_method':'Deterministic word/phrase matching on text. A hit is a retrieval lead, not a factual, political, theological or psychological conclusion.','public_text_reproduced':False,'sources':[],'coverage_gaps':['X activity after January 2021 is not supplied by the historical Twitter mirror.','Public speeches and interviews are sampled separately, not comprehensively downloaded.','Images, videos, linked articles and audio are not transcribed by this text pass.','Deleted material and omissions in upstream archives remain unknown.','Keyword nonmatches can still be relevant; they remain in the metadata index.'],'total_unique_screened':0}
    prior=HERE.parent/'truth-social/posts.json'
    old=json.loads(prior.read_text())['posts'] if prior.exists() else []
    audit=[]
    for source in SOURCES:
        stat={**source,'retrieved_at':now,'status':'not_started'}
        try:
            raw,rows=fetch(source);stat.update(status='retrieved',input_sha256=digest(raw),input_bytes=len(raw),raw_rows=len(rows))
            unique={}; texts={}; duplicates=0; conflicts=[]; excluded=0; invalid=0
            for row in rows:
                try: entry,text=normalize(row,source)
                except (ValueError,TypeError,KeyError): invalid+=1; continue
                if entry['date']>cutoff: excluded+=1; continue
                if entry['id'] in unique:
                    duplicates+=1
                    if unique[entry['id']]['text_sha256']!=entry['text_sha256']: conflicts.append(entry['id'])
                    continue
                unique[entry['id']]=entry;texts[entry['platform_id']]=text
            records=sorted(unique.values(),key=lambda x:(x['date'],x['platform_id']))
            if not records: raise ValueError('No valid records after normalization')
            years=Counter(x['date'][:4] for x in records)
            topic_counts=Counter(t for x in records for t in x['topic_matches'])
            stat.update(unique_records=len(records),duplicate_rows=duplicates,conflicting_duplicate_ids=sorted(set(conflicts)),invalid_rows=invalid,excluded_after_cutoff=excluded,date_min=records[0]['date'],date_max=records[-1]['date'],by_year=dict(sorted(years.items())),topic_counts=dict(topic_counts),text_nonmatches=sum(not x['topic_matches'] for x in records),without_text=sum(not x['has_text'] for x in records),attribution_counts=dict(Counter(x['attribution'] for x in records)),individual_review_count=0)
            filename='index-'+source['id']+'.json'
            payload={'schema_version':1,'source_id':source['id'],'generated_at':now,'records':records}
            target=output/filename;target.write_text(json.dumps(payload,ensure_ascii=True,separators=(',',':'))+'\n')
            stat['index_file']=filename;stat['index_sha256']=digest(target.read_bytes())
            summary['total_unique_screened']+=len(records)
            if source['platform']=='Truth Social':
                for p in old:
                    m=re.search(r'(\d+)$',p.get('original_url') or '')
                    text=texts.get(m.group(1)) if m else None
                    a={'record_id':p['id'],'platform_id':m.group(1) if m else None,'comparison':'not_in_feed_or_missing_id'}
                    if text is not None:
                        norm=lambda s:clean(s).replace('\u2019',"'").replace('\u2018',"'").replace('\u201c','"').replace('\u201d','"').casefold()
                        a['comparison']='excerpt_found' if norm(p['excerpt']) in norm(text) else 'excerpt_not_found_needs_review'
                    audit.append(a)
            print(json.dumps({k:v for k,v in stat.items() if k not in ('topic_counts','attribution_counts')},sort_keys=True),flush=True)
        except Exception as exc:
            stat.update(status='retrieval_failed',error=type(exc).__name__+': '+str(exc)[:500]);print(json.dumps(stat),flush=True)
        summary['sources'].append(stat)
    summary['status']='completed_for_retrieved_sources' if summary['total_unique_screened'] else 'no_sources_retrieved'
    summary['all_posts_reviewed']=False
    (output/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    (output/'legacy-crosscheck.json').write_text(json.dumps({'schema_version':1,'comparison_note':'Differences require source inspection; absent records are not proof of fabricated or deleted posts. No prior entry is changed.','records':audit},indent=2)+'\n')
    (output/'topics.json').write_text(json.dumps({'schema_version':1,'topics':TOPICS,'scope':'These are search terms, not trait assignments. Context, negation, quotations and repost authorship require individual review.'},indent=2)+'\n')
    print('SUMMARY '+json.dumps(summary),flush=True)

def self_test():
    assert clean('<p>Hello <b>world</b></p>')=='Hello world'
    assert 'war-force' in themes('No nuclear war; seek peace.')
    assert 'peace-negotiation' in themes('No nuclear war; seek peace.')
    assert not themes('award winning dishwasher')
    sample={'id':'123','created_at':'2026-09-16T22:00:00Z','content':'RT @other: loyalty','media':[]}
    entry,_=normalize(sample,SOURCES[1]);assert entry['attribution']=='repost_text_marker'
    assert entry['review_status']=='machine_screened_not_individually_reviewed'
    assert 'text' not in entry and 'excerpt' not in entry and 'score' not in entry
    print('SELF_TEST: 7 assertions passed')
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=HERE/'results');parser.add_argument('--cutoff',default='2026-09-17');parser.add_argument('--self-test',action='store_true');args=parser.parse_args()
    if args.self_test:self_test()
    else:datetime.strptime(args.cutoff,'%Y-%m-%d');run(args.output,args.cutoff)
