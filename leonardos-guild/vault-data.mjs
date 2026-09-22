/* Lantern Vault survey wing. Metres, shared by collision, art and the map.
 * Existing Cinder Hollow terrain and region transitions remain authoritative. */
export const VAULT_LAYOUT='lantern-vault-1';
export const VAULT_BOUNDS=Object.freeze({minX:328,maxX:388,minZ:10,maxZ:40});
const wall=(id,x,z,hx,hz,h=2.8)=>Object.freeze({id,x,z,hx,hz,h});
export const VAULT_WALLS=Object.freeze([
 wall('north',358,10,30,.25),wall('south',358,40,30,.25),wall('east',388,25,.25,15),
 wall('entry-north',328,16.5,.25,6.5),wall('entry-south',328,33.5,.25,6.5),
 wall('north-seam-a',330,18,2,.25),wall('north-seam-b',348,18,12,.25),wall('north-seam-c',376,18,12,.25),
 wall('south-seam-a',331,32,3,.25),wall('south-seam-b',359,32,21,.25),wall('south-seam-c',386,32,2,.25),
 ...[342,356,370].flatMap(x=>[wall('arch-north-'+x,x,20.5,.25,2.5),wall('arch-south-'+x,x,29.5,.25,2.5)]),
 wall('observation-north',348,11,.25,1),wall('observation-south',348,17,.25,1),wall('archive-north',370,14,.25,4),
 wall('service-north',350,33,.25,1),wall('service-south',350,39,.25,1)
]);
export const VAULT_GATES=Object.freeze([
 wall('optical-gate',370,25,.25,2,2.7),wall('service-gate',350,36,.25,2,2.7)
]);
export const VAULT_ROOMS=Object.freeze([
 {name:'Survey porch',x:335,z:21},{name:'Shutter hall',x:349,z:21},{name:'Receiver hall',x:363,z:21},{name:'Records chamber',x:379,z:21},
 {name:'Inscription walk',x:338,z:14},{name:'Caretaker walk',x:359,z:14},{name:'Service approach',x:339,z:36},{name:'Maintenance return',x:368,z:36}
]);
export const VAULT_NODES=Object.freeze([
 {id:'bench',name:'Survey bench',x:331,z:25,action:'accept',hint:'Borrow the inspection lens and counterweight. No purchase or combat required.'},
 {id:'emitter',name:'Light instrument / lens socket',x:339,z:25,action:'emitter',hint:'Fit or retrieve the loaned inspection lens.'},
 {id:'shutter',name:'Shutter counterweight socket',x:347,z:28,action:'shutter',hint:'Fit or retrieve the counterweight. Watch the overhead shutter.'},
 {id:'mirror',name:'Turning reflector',x:362,z:28,action:'mirror',hint:'Turn the reflector one quarter-turn. Follow the actual light path.'},
 {id:'inscription',name:'Mineral-covered inscription',x:345,z:14,action:'inspect',hint:'Use the inspection lens to read the mineral-covered plate.'},
 {id:'account',name:'Caretaker account',x:363,z:14,action:'account',hint:'Read why the workshop kept the road open.'},
 {id:'service',name:'Maintenance counterweight socket',x:347,z:36,action:'service',hint:'The same counterweight can hold this service gate instead.'},
 {id:'record',name:'Civic optical plans',x:381,z:25,action:'record',hint:'Recover the plans for Vinci, not for sale.'},
 {id:'latch',name:'Inside return latch',x:374,z:28,action:'latch',hint:'Unlatch both return gates permanently from this side.'}
]);
export const MIRROR_DIRECTIONS=Object.freeze(['NORTH','EAST','SOUTH','WEST']);
export const vaultGround=(x,z)=>Math.sin((x-300)/23)*.18+Math.cos(z/18)*.15;
export function inVaultArea(s){return s.frontier?.zone==='badlands'&&s.x>=326&&s.x<=390&&s.z>=8&&s.z<=42;}
export function opticalOpen(v){return !!v?.shortcut||!!v?.accepted&&v.lens==='emitter'&&v.weight==='shutter'&&v.mirror===1;}
export function serviceOpen(v){return !!v?.shortcut||!!v?.accepted&&v.weight==='service';}
export function vaultSolids(s){return [...VAULT_WALLS,...VAULT_GATES.filter(g=>g.id==='optical-gate'?!opticalOpen(s?.vault):!serviceOpen(s?.vault))];}
export function vaultBlocked(x,z,r=.33,s){
 if(x<327-r||x>389+r||z<9-r||z>41+r)return false;
 return vaultSolids(s).some(b=>Math.hypot(x-Math.max(b.x-b.hx,Math.min(b.x+b.hx,x)),z-Math.max(b.z-b.hz,Math.min(b.z+b.hz,z)))<r);
}
export function vaultLine(a,b,s){
 const steps=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/.15));
 for(let i=1;i<=steps;i++)if(vaultBlocked(a.x+(b.x-a.x)*i/steps,a.z+(b.z-a.z)*i/steps,.04,s))return false;
 return true;
}
