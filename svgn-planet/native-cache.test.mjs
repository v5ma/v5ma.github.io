import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('./index.html',import.meta.url),'utf8');
const map=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
test('Every updated spatial UI dependency uses the same explicit cache revision',()=>{
 for(const name of ['main-hub','unified-xr','console-state','spatial-console','console-settings','console-hud','console-menu','mission-presentation','native-menu-focus','xr-session-cleanup','native-ui'])assert.equal(map['./'+name+'.mjs'],'./'+name+'.mjs?v=0.16.1&rev=mission-focus-1');
 assert.ok(html.includes('v0.16.1 / Mission Focus'));
});
test('The cache revision leaves original gameplay imports and controller routing untouched',()=>{
 assert.equal(map['./controller.mjs'],'./main-controller.mjs?v=0.16.0');
 assert.equal(map['./model.mjs'],'./model.mjs?v=0.11.0');
 assert.ok(html.includes("import('./main-app.mjs?v=0.16.1')"));
});
