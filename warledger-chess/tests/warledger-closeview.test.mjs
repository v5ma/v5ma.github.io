import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {VIEW_KEY,boardLayout,readViewPreference,writeViewPreference,wrapText} from '../warledger-closeview.mjs';
import {HD_ATLAS,loadPieceAtlas} from '../warledger-hd-art.mjs';
import {actionAllowed} from '../warledger-presentation.mjs';
import {SAVE_KEY} from '../warledger-session.mjs';

test('Close view chooses a side tray in landscape, a front tray in portrait, and never rearranges XR',()=>{
  assert.equal(boardLayout(1440,1000).key,'table');
  assert.equal(boardLayout(390,844).key,'board-front');assert.equal(boardLayout(844,390).key,'board-side');
  assert.equal(boardLayout(320,568).focused,true);
  assert.equal(boardLayout(844,390,'table').focused,false);
  for(const pref of ['board','auto','table'])assert.equal(boardLayout(390,844,pref,true).key,'xr');
  assert.equal(actionAllowed('promotion','view'),false);assert.equal(actionAllowed('options','view'),true);
});
test('View preference storage cannot overwrite match storage and blocked storage remains playable',()=>{
  const data=new Map([[SAVE_KEY,'unchanged']]);
  const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.equal(readViewPreference(storage),'auto');assert.equal(writeViewPreference('board',storage),true);
  assert.equal(readViewPreference(storage),'board');assert.equal(data.size,2);assert.equal(data.get(VIEW_KEY),'board');assert.equal(data.get(SAVE_KEY),'unchanged');
  assert.equal(writeViewPreference('broken',storage),false);data.set(VIEW_KEY,'broken');assert.equal(readViewPreference(storage),'auto');
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(readViewPreference(blocked),'auto');assert.equal(writeViewPreference('table',blocked),false);
});
test('Narrow in-scene status wraps text without deleting words',()=>{
  const text='Chancellor on e8 | 21 legal moves. Rook lines plus knight jumps.';
  const lines=wrapText(text,29);assert.equal(lines.join(' '),text);assert.ok(lines.every(l=>l.length<=29));
});
test('Original-source HD artwork has all four hashed WebP strips and 22 mapped cells',()=>{
  const m=JSON.parse(fs.readFileSync(new URL('../assets/piece-faces-hd-manifest.json',import.meta.url)));
  assert.equal(m.art.length,11);assert.equal(m.art[6].type,'D');assert.equal(m.art[10].type,'DRAGON');
  assert.equal(HD_ATLAS.cell,128);assert.equal(HD_ATLAS.width,512);assert.equal(HD_ATLAS.height,1024);
  for(const url of HD_ATLAS.urls){
    const data=fs.readFileSync(new URL('../'+url,import.meta.url));
    assert.equal(data.subarray(0,4).toString(),'RIFF');assert.equal(data.subarray(8,12).toString(),'WEBP');
    assert.equal(crypto.createHash('sha256').update(data).digest('hex'),m.hashes[url.split('/').at(-1)]);
  }
});
async function loaderCase(failIndex=-1,badSize=false){
  const textures=[],calls=[];let canvases=0,draws=0;
  const old=globalThis.document;globalThis.document={createElement:()=>{canvases++;return {width:0,height:0,getContext:()=>({drawImage(){draws++;}})};}};
  function texture(image){const t={image,disposed:false,userData:{},dispose(){this.disposed=true;}};textures.push(t);return t;}
  const T={SRGBColorSpace:'srgb',TextureLoader:class{async loadAsync(url){calls.push(url);const i=HD_ATLAS.urls.findIndex(u=>url.endsWith(u.slice(2)));
    if(i===failIndex&&i>=0)throw Error('Missing strip');return texture(i<0?{width:256,height:512}:{width:badSize?12:128,height:1024});}},
    CanvasTexture:class{constructor(canvas){return texture(canvas);}}};
  try {const result=await loadPieceAtlas(T,{capabilities:{getMaxAnisotropy:()=>16}},'https://example.test/warledger/');return {result,textures,calls,canvases,draws};}
  finally {if(old===undefined)delete globalThis.document;else globalThis.document=old;}
}
test('HD loader combines once, uses one texture, and disposes the temporary strip textures',async()=>{
  const c=await loaderCase();assert.equal(c.draws,4);assert.equal(c.canvases,1);assert.equal(c.result.image.width,512);
  assert.equal(c.result.userData.quality,'hd-128');assert.equal(c.result.anisotropy,4);
  assert.equal(c.textures.filter(t=>t.disposed).length,4);assert.equal(c.result.disposed,false);
});
test('A missing or malformed HD strip falls back to the complete original illustrated atlas',async()=>{
  for(const [i,bad] of [[2,false],[-1,true]]){
    const c=await loaderCase(i,bad);assert.equal(c.result.userData.quality,'fallback-64');assert.equal(c.result.image.width,256);
    assert.ok(c.calls.at(-1).endsWith('/assets/piece-faces.webp'));assert.equal(c.result.disposed,false);
    assert.ok(c.textures.filter(t=>t!==c.result).every(t=>t.disposed));
  }
});
