"""Test correction only. Store.write intentionally increments revision/savedAt.
Compare the complete checkpoint and profile; retain both envelopes for diagnosis.
"""
from pathlib import Path
p=Path('vesperfall/tests/goldwind-browser.py');s=p.read_text()
if 'def same_expedition(' in s:
 print('Save comparison already applied.');raise SystemExit(0)
anchor='PAD="""'
helper='''save_observations=[]
def same_expedition(before,after,label):
 a=json.loads(json.loads(before)['payload']);b=json.loads(json.loads(after)['payload'])
 changed=[k for k in sorted(set(a)|set(b)) if a.get(k)!=b.get(k)]
 save_observations.append({'boundary':label,'changedEnvelopeKeys':changed,'before':a,'after':b})
 (OUT/'save-boundary-observations.json').write_text(json.dumps(save_observations,indent=2))
 return (a['profile']==b['profile'] and a['checkpoint']==b['checkpoint']
         and b['revision']>=a['revision'] and b['savedAt']>=a['savedAt'])
'''
assert s.count(anchor)==1;s=s.replace(anchor,helper+anchor)
a="  check(page.evaluate('p=>localStorage.getItem(PilgrimSave.KEY)===p',saved),'AR hand inspection with Goldwind selected preserves exact saved expedition bytes')"
b="  after=page.evaluate('localStorage.getItem(PilgrimSave.KEY)')\n  check(same_expedition(saved,after,'AR inspection'),'AR hand inspection preserves the entire checkpoint and profile; only save-envelope metadata may advance')"
assert s.count(a)==1;s=s.replace(a,b)
a="  check(page.evaluate('p=>localStorage.getItem(PilgrimSave.KEY)===p',payload),'Changing physical controls does not rewrite the saved expedition')"
b="  after=page.evaluate('localStorage.getItem(PilgrimSave.KEY)')\n  check(same_expedition(payload,after,'Page reload'),'Control preferences and page reload preserve the entire saved checkpoint and profile')"
assert s.count(a)==1;s=s.replace(a,b)
p.write_text(s);compile(s,str(p),'exec')
print('Full saved checkpoint and profile comparisons retained, with before/after metadata evidence.')
