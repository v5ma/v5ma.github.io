"""One-time reviewed v0.3->v0.4 integration. Strict before/after hashes prevent
clobbering concurrent edits. The resulting normal source is committed before
read-only browser acceptance. This script is never run by the game or tests.
"""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1]
receipts={
'model.mjs':('7fdfeb213cf07c43ffac100e127b9edb1e9095485138283c53a26f05a8824234','2ee0f7305f63183f7ef08af279015d448d455a6a9c3663ad980758d4f4e6b802'),
'app.mjs':('82268476858ca8ea52d51fc75886d8ece7abec430be056c26dde0381d577cfc5','eb0d0507adecece1d22e3313000dd87dee32ee5d858e5f3440394ffc3b92c478'),
'scene.mjs':('55816901d02137db7306f6010253fce2488884d8e0ec3af441aded6e3f485830','f1f39dec58d683a61d9ebf3e6994bb02e999cea79e68c8c8b2b8229120720431'),
'life-visuals.mjs':('22c9c321a4afe4f9231173c4f3a62d5305ffd103dfaa5fe6042ac48c4ee5feef','1e41d2780ed769cbf689a9d2e3ac9c77ef618be9e87c3fab6685a8af638989aa'),
'index.html':('bc5e4e658181460de02479097fe0ccc1fc858eff3d6e68ec546bd2fca63d4c0e','243be4c14f4c88c900f8883113edfb7563605b50732427beff731993ae6ad582'),
'release.json':('b99b61a5db6c08fda4ec2d590ca3ff8a159670d0cb4798a2558caf0f01b26b57','d73a4dec55fc50d9592f91190c6941412e8f99c3d8b73007a3ed43054f2e2be7'),
'package.json':('3f7f9d5536283048068ad537360968afe5da3422bc4827beeaea213a04acf88b','e78c6695170d125a0fd13469cc01ea37f21f3a80285774bc95480de697916c60'),
'tests/life-browser.py':('c5b40e139560784e674488c59ad6ca7ae3ca0b57b63a0b17f0ffa92d596fddb0','567fb038f50c1d7b626e15850617e35741cddc0314f858337829fea54aa470e8')}
def sha(text):return hashlib.sha256(text.encode()).hexdigest()
current={n:(root/n).read_text() for n in receipts}
if all(sha(current[n])==h[1] for n,h in receipts.items()):print('Already integrated; no source changes.');raise SystemExit
for n,h in receipts.items():assert sha(current[n])==h[0],f'Source changed, review before integrating: {n}'
a=dict(current)
s=a['model.mjs'];s="import {streetState,streetSave,stepStreet} from './street-core.mjs';\n"+s;s=s.replace("VERSION='0.3.0'","VERSION='0.4.0'").replace('return initLife(s,saved?.life);','initLife(s,saved?.life);s.street=streetState(saved?.street);return s;').replace('return {version:2,life:saveLife(s.life),','return {version:2,street:streetSave(s.street),life:saveLife(s.life),').replace('lifeStep(s,w,input,dt);','lifeStep(s,w,input,dt);stepStreet(s,w,dt);');a['model.mjs']=s
s=a['app.mjs'];s="import {createStreetUI} from './street-ui.mjs';\n"+s;s=s.replace('lastMode=null,lifeUI=null','lastMode=null,lifeUI=null,streetUI=null').replace("'KeyN','KeyT','KeyR',","'KeyN','KeyT','KeyR','KeyY','KeyV',").replace('if(lifeUI?.close()){}','if(streetUI?.close()){}else if(lifeUI?.close()){}')
s=s.replace("if(e.code==='KeyN'){lifeUI.note();return;}","if(e.code==='KeyV'){streetUI.open();return;}if(e.code==='KeyY'){streetUI.interact();return;}if(e.code==='KeyN'){lifeUI.note();return;}")
s=s.replace("switch(action){case'social'","switch(action){case'work':streetUI.interact();break;case'social'").replace('thumb=createTouchControls(',"streetUI=createStreetUI({getState:()=>state,world,setPause,save,active:()=>playing&&!paused});\nthumb=createTouchControls(")
s=s.replace('lifeUI?.drawMap(g,X,Z,full);','lifeUI?.drawMap(g,X,Z,full);streetUI?.drawMap(g,X,Z,full);').replace('lifeUI?.update();','lifeUI?.update();streetUI?.update();').replace("'V0.3 / A LIVING TOWN'","'V0.4 / MARKET LIFE'").replace('attributes:stats(state),townSize:','street:JSON.parse(JSON.stringify(state.street)),attributes:stats(state),townSize:');a['app.mjs']=s
s=a['scene.mjs'];s="import {createStreetArt} from './street-art.mjs';\n"+s;s=s.replace('const townLife=createTownLifeVisuals({scene,root,w,m,rider,bike,camera});','const townLife=createTownLifeVisuals({scene,root,w,m,rider,bike,camera});\n const streetArt=createStreetArt({scene,root,w,m,camera});').replace('townLife.update(p,dt,currentRoom);renderer.render(scene,camera);','townLife.update(p,dt,currentRoom);streetArt.update(p,dt);renderer.render(scene,camera);').replace('interior:townLife.inspect()','interior:townLife.inspect(),art:streetArt.inspect()');a['scene.mjs']=s
s=a['life-visuals.mjs'];s=s.replace('const b=new Batch(),trim=new Batch();b.box','const b=new Batch(),trim=new Batch(),furniture=new Batch();b.box').replace('table(b,','table(furniture,').replace('bookcase(b,','bookcase(furniture,').replace('function table(furniture,','function table(b,').replace('function bookcase(furniture,','function bookcase(b,').replace("b.finish(g,m.trim,'Room furniture, shelves and floor');","b.finish(g,m.trim,'Room furniture, shelves and floor');furniture.finish(g,m.trim,'Replaceable workshop furniture');");a['life-visuals.mjs']=s
s=a['index.html'];s=s.replace('v0.3.0','v0.4.0').replace('<link rel="stylesheet" href="./life.css">','<link rel="stylesheet" href="./life.css"><link rel="stylesheet" href="./street.css">').replace('Your first folio commission remains.','Your first folio commission remains. Explore 22 new neighbourhood activities, repairs, music, recipes and deliveries, now with curated textured artwork.').replace('<kbd>N</kbd> Notebook','<kbd>V</kbd> Neighbourhood work · <kbd>Y</kbd> Work nearby<br><kbd>N</kbd> Notebook');a['index.html']=s
v=json.loads(a['release.json']);v.update(version='0.4.0',build='guild-market-life-20260907',newStreetActivities=22,curatedModels=32);a['release.json']=json.dumps(v,separators=(',',':'))+'\n'
v=json.loads(a['package.json']);v['version']='0.4.0';a['package.json']=json.dumps(v,separators=(',',':'))+'\n'
a['tests/life-browser.py']=a['tests/life-browser.py'].replace("=='0.3.0'","==json.loads((ROOT/'release.json').read_text())['version']")
# Validate ALL results before mutating any source file.
for n,h in receipts.items():assert sha(a[n])==h[1],f'Unexpected integration output: {n}'
for n,text in a.items():(root/n).write_text(text)
print('Integrated eight bounded source changes; commit before native acceptance.')
