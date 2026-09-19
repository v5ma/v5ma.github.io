import {test} from 'node:test';
import assert from 'node:assert/strict';
import {XR_HUD_IDS,nativeMenuDescription,mountNativeChrome} from './native-ui.mjs';
const p=(text,status=false,hidden=false)=>({textContent:text,getAttribute:k=>status?'status':null,closest:()=>hidden?{}:null,getClientRects:()=>[{}]});
test('Native chrome hides the residual flat city panels without hiding dialog controls',()=>{let css='';const doc={getElementById:()=>null,createElement:()=>({}),head:{append:s=>css=s.textContent}};mountNativeChrome(doc);assert.ok(XR_HUD_IDS.includes('water-minimap'));assert.ok(XR_HUD_IDS.includes('pulse-summary'));assert.ok(css.includes('.in-xr #water-minimap'));assert.ok(!css.includes('dialog'));});
test('Native ward menu displays backup/error feedback alongside its actual objective',()=>{const doc={getElementById:()=>({textContent:'No backup available'})};assert.match(nativeMenuDescription({id:'ward-menu'},'Meet Mara',doc),/No backup available.*Meet Mara/);});
test('Native puzzle/dialogue copy excludes hidden text and includes live status',()=>{const root={id:'water-pump-dialog',querySelectorAll:()=>[p('Turn the valves'),p('Circuit ready',true),p('Hidden destructive action',false,true)]};const text=nativeMenuDescription(root,'Goal',{});assert.match(text,/Circuit ready.*Turn the valves/);assert.ok(!text.includes('Hidden'));});
