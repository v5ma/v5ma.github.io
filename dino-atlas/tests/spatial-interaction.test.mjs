// Production ray/feedback fixtures, not a physical headset or gameplay completion.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../vendor/three.module.js';
import {SpatialConsole,consoleMaterial} from '../spatial-console.js';
function fixture(y=0){
 const c=Object.create(SpatialConsole.prototype),root=new T.Group();
 const panel=new T.Mesh(new T.PlaneGeometry(1,1),consoleMaterial({}));panel.visible=false;root.add(panel);
 c.xr={active:true,invisible:false,panel,tiles:[],raycaster:new T.Raycaster(),rayFor:()=>({origin:new T.Vector3(0,y,1),direction:new T.Vector3(0,0,-1)})};
 const mesh=()=>new T.Mesh(new T.PlaneGeometry(1,1),consoleMaterial({}));
 c.root=root;c.rail={mesh:mesh()};panel.add(c.rail.mesh);c.wrist={mesh:mesh()};root.add(c.wrist.mesh);c.dock={mesh:mesh()};c.dock.mesh.visible=false;root.add(c.dock.mesh);
 c.shortcuts=[{label:'Menu',run(){}},{label:'Field controls',run(){}}];c.tabs=[];return c;
}
test('The nonbutton area of a visible wrist slate consumes the ray without firing or selecting',()=>{
 const c=fixture(.2),hit=c.hit({});assert.equal(hit?.occludesUI,true);assert.equal(hit?.run,undefined);assert.equal(hit?.hold,undefined);
});
test('A hidden parent prevents a still-visible child slate from accepting an invisible click',()=>{
 const c=fixture(-.4);c.root.visible=false;assert.equal(c.hit({}),null);
});
test('Panel blank space is an inert UI hit, not an opening for accidental tool fire',()=>{
 const c=fixture(.2);c.xr.panel.visible=true;c.wrist.mesh.visible=false;c.rail.mesh.visible=false;assert.equal(c.hit({})?.occludesUI,true);
});
test('Repeated plus labels highlight only the pointed control, not every plus on the menu',()=>{
 const c=fixture();c.xr.panel.visible=true;const one={label:'+'},two={label:'+'};c.xr.controllers=[{hit:one,ray:new T.Group()}];c.dots=[new T.Group()];
 c.buttonPool=[one,two].map(tile=>({tile,group:new T.Group(),base:{material:consoleMaterial({color:0x749c85})}}));
 c.afterInput();assert.notEqual(c.buttonPool[0].base.material.color.getHex(),c.buttonPool[1].base.material.color.getHex());
});

test('Nearest visible UI surface owns selection instead of a farther overlapping slate',()=>{
 const c=fixture(-.4);c.xr.panel.visible=true;c.rail.mesh.visible=false;c.wrist.mesh.position.z=-.4;
 assert.equal(c.hit({})?.occludesUI,true,'Panel background must block the Menu button behind it');
});
test('Wrist flight directions distinguish Active stick altitude from Legacy trigger altitude',async()=>{
 const {flightHint}=await import('../spatial-console.js');assert.match(flightHint(true),/right stick/);assert.match(flightHint(false),/RT\/LT/);
});
