import test from 'node:test';
import assert from 'node:assert/strict';
import {createNoticeFeed,createNoticePresentation,noticeAlpha} from '../field-guide-core.mjs';
import {readFileSync} from 'node:fs';
test('A delayed presentation gets two real seconds from its first paint, never from repeated reads',()=>{
 const f=createNoticeFeed(),v=createNoticePresentation();f.push('Useful message',0);const original=f.current();
 const shown=v.read(f.current(),8000);assert.equal(shown.started,8000);assert.equal(noticeAlpha(shown,8000),1);
 assert.equal(v.read(f.current(),9750).started,8000);assert.equal(noticeAlpha(v.read(f.current(),9750),9750),.5);
 assert.equal(noticeAlpha(v.read(f.current(),10000),10000),0);assert.equal(noticeAlpha(v.read(f.current(),20000),20000),0);
 assert.deepEqual(f.current(),original);assert.equal(f.history()[0].started,0);
});
test('A new real notice gets its own lifetime; dismissal hides it without deleting history',()=>{
 const f=createNoticeFeed(),v=createNoticePresentation();f.push('First',0);v.read(f.current(),10);f.push('Second',3000);
 assert.equal(v.read(f.current(),6000).text,'Second');assert.equal(noticeAlpha(v.read(f.current(),6000),6000),1);
 f.dismiss();assert.equal(v.read(f.current(),7000),null);assert.equal(f.history().length,2);
});
test('Floor map carries vital status too, so a floor-docked HUD is not the only readable source',()=>{
 const s=readFileSync(new URL('../field-guide.mjs',import.meta.url),'utf8');assert(s.includes("if(config.hud!=='hidden')"));assert(s.includes("'HP '+Math.ceil(s.p.health)"));assert(s.includes("' / Ammo '+s.p.ammo"));assert(s.includes('source=noticeView.read(data.notice,now)'));
});
