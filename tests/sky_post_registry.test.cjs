const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const text=fs.readFileSync(__dirname+'/../mario-maker-clone/svgn-paper-route/delivery-upgrade.js','utf8');
test('The actual campaign facade follows late-loaded route builders instead of an obsolete frozen snapshot',()=>{
 const old=Object.freeze({build:()=>15,routes:[{name:'Old'}]}),next=Object.freeze({build:()=>16,routes:[{name:'New'}]});
 const env={window:{DeliveryCampaign:old}},expression=text.match(/const C=(new Proxy\(\{\}, .*?\}\)), root=/)[1];
 const facade=vm.runInNewContext(expression,env);assert.equal(facade.build(),15);env.window.DeliveryCampaign=next;assert.equal(facade.build(),16);assert.equal(facade.routes[0].name,'New');assert.equal(old.build(),15);
});
test('Native-dialog handling precedes game Escape shortcuts and the hidden-panel Tab trap',()=>{
 const guard=text.indexOf("if(document.querySelector('dialog[open]'))return;"),shortcut=text.indexOf("if(e.code==='KeyP'||e.code==='Escape')");assert.ok(guard>=0&&guard<shortcut);
});
