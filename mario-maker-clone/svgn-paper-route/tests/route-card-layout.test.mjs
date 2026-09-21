// These source/CSS guards supplement (not replace) the real browser layout test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../route-entry.css',import.meta.url),'utf8');
function rule(selector){const start=css.indexOf(selector+'{');assert(start>=0,'Missing scoped selector: '+selector);return css.slice(start+selector.length+1,css.indexOf('}',start));}
test('The route chooser starts below its own scroll origin instead of centering an oversized row',()=>{const r=rule('body.delivery-upgraded #delivery-menu.open');assert(r.includes('align-content:start'));assert(r.includes('grid-template-rows:max-content'));});
test('Only the outer chooser scrolls; nested route cards cannot collapse to a percentage height',()=>{const r=rule('body.delivery-upgraded #delivery-menu .delivery-courses');assert(r.includes('grid-auto-rows:max-content'));assert(r.includes('max-height:none'));assert(r.includes('overflow:visible'));});
test('The original current-view action retains its intrinsic content height',()=>{const r=rule('#delivery-menu .sc-route-card>.delivery-course');assert(r.includes('flex:0 0 auto'));assert(r.includes('min-height:min-content'));assert(r.includes('transform:none'));});
test('Presentation choices cannot flex-shrink into route descriptions',()=>{assert(rule('.sc-route-modes').includes('flex:0 0 auto'));assert(rule('.sc-route-modes button').includes('min-height:44px'));});
