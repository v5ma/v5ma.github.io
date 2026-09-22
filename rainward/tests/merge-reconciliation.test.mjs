import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const audit=JSON.parse(fs.readFileSync(path.join(root,'evidence/merge-reconciliation-20260921/source-audit.json'),'utf8'));
test('The selective motion recovery preserves every unchanged declared gameplay, body and licensed-asset hash after later XR UI work',()=>{
 const intentionallyUpdated=new Set(['quest-xr.mjs','xr-panel.mjs']);
 for(const [name,sha] of Object.entries({...audit.protectedRuntimeSHA256,...audit.protectedAssetsSHA256})){
  if(intentionallyUpdated.has(name))continue;
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex'),sha,name);
 }
});
