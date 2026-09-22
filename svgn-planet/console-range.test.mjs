import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CONSOLE_DEFAULTS} from './console-state.mjs';
test('Menu range preserves the actual saved default instead of browser step rounding',()=>{
 const text=readFileSync(new URL('./console-settings.mjs',import.meta.url),'utf8');
 const tag=text.match(/<input id="console-size"[^>]+>/)[0];
 const value=k=>Number(tag.match(new RegExp(k+'="([^"]+)"'))[1]);
 const units=(CONSOLE_DEFAULTS.size-value('min'))/value('step');
 assert.ok(Math.abs(units-Math.round(units))<1e-9);
 assert.equal(value('step'),.01);
});
