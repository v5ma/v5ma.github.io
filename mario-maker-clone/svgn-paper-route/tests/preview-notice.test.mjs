import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {noticePlacement} from '../sensory-core.mjs';
test('Preview dialogue clears the observed desktop HUD at its full multi-line height',()=>{const host={top:114,bottom:800};const bottom=noticePlacement(host,68,[{top:693,height:87}]);assert.ok(host.bottom-bottom+5<=693);assert.ok(host.bottom-bottom-68>=host.top+8);});
test('Preview placement leaves original warnings intact and outside-preview layout unchanged',()=>{const js=readFileSync(new URL('../waterwheel-preview.js',import.meta.url),'utf8');assert.ok(js.includes('previousToast.apply(this,args)'));assert.ok(js.includes("el.removeAttribute('data-waterwheel-notice')"));assert.ok(js.includes('noticeObserver.disconnect()'));assert.ok(js.includes('observeNotice();mount()'));assert.ok(!js.includes("el.classList.remove('show')"));});
