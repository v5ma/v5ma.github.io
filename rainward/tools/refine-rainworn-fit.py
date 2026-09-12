"""Close collar/wrist seams found in the actual browser character review.
Unique anchors are checked before writing; rerunning the accepted fit is safe.
"""
from pathlib import Path
R=Path(__file__).resolve().parents[1]
changes={
 'tools/build-rainworn-models.py':[("skin=(point[:,1]>1.49)|np.isin(dominant,[7,10])","skin=np.isin(dominant,[3,4,7,10])")],
 'rainworn-humans.mjs':[
  ('function accessories(original)','export function accessories(original)'),
  ('if(group.materialIndex!==1&&y<1.49)selected.push(i,i+1,i+2);','const seam=group.materialIndex===1&&(src.attributes.skinIndex.getX(i)===3||(Math.abs(x)>.22&&y>.85&&y<.94));if(group.materialIndex!==1&&y<1.49||seam)selected.push(i,i+1,i+2);')]
}
updates={}
for name,edits in changes.items():
 s=(R/name).read_text()
 for before,after in edits:
  if after in s:continue
  assert s.count(before)==1,(name,before)
  s=s.replace(before,after)
 updates[name]=s
for name,text in updates.items():(R/name).write_text(text)
print('Collar source masks and original neck/wrist seam connectors verified.')
