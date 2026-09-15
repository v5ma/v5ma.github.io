import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,saveData,SAVE_KEY} from '../model.mjs';
import {createSaveVault,VAULT_KEYS,validSave} from '../save-vault.mjs';
test('Stored-original export retains quarantined data across recovery and reload',()=>{
 const raw=JSON.stringify(saveData(initial())),map=new Map([[SAVE_KEY,'broken-original'],[VAULT_KEYS.backup,raw]]);
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const vault=createSaveVault(storage);vault.load();assert.equal(vault.original(),'broken-original');
 assert.ok(vault.commit(raw));assert.equal(vault.original(),'broken-original');
 const reloaded=createSaveVault(storage);reloaded.load();assert.equal(reloaded.original(),'broken-original');
 assert.ok(validSave(map.get(SAVE_KEY)));
});
