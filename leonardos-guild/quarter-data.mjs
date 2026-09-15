/* Authored metric geometry. Forward is +z; floors and collision share this data. */
export const QUARTER_REVISION='waterwheel-1';
export const QUARTER_BOUNDS=Object.freeze({minX:-28,maxX:24,minZ:-18,maxZ:31,minY:-3,maxY:9});
export const QUARTER_ARRIVAL=Object.freeze({x:-20,z:-13,yaw:0});
export const QUARTER_GATE=Object.freeze({x:-5,z:-6});
const floor=(id,x1,x2,z1,z2,y,endY=y,kind='brick')=>({id,x1,x2,z1,z2,y,endY,kind});
export const QUARTER_FLOORS=Object.freeze([
 floor('workshop-porch',-26,-12,-16,-10,0),floor('arrival-walk',-16,8,-13,-8,0),floor('canal-court',-12,9,-10,-3,0),
 floor('precision-workshop',9,22,-12,-3,0,0,'wood'),floor('loading-court',8,22,-3,1,0),floor('goods-stair',15,19,1,12,0,3.2,'wood'),
 floor('hoist-gallery',-12,19,12,16,3.2,3.2,'wood'),floor('dye-approach',-26,-10,-8,-4,0),floor('dye-workroom',-26,-21,-4,1,0),
 floor('dye-stair',-26,-22,1,8,0,1.6,'wood'),floor('dye-loft',-26,-18,8,11,1.6,1.6,'wood'),floor('drying-stair',-22,-18,11,19,1.6,3.2,'wood'),
 floor('drying-roof',-22,-12,19,23,3.2,3.2,'tile'),floor('roof-bridge',-15,-11,15,21,3.2,3.2,'wood'),
 floor('return-stair',-12,-8,1,12,0,3.2,'stone'),floor('return-landing',-18,-8,-2,1,0),floor('arch-passage',-18,-14,-10,-2,0),
 floor('sluice-landing',-6,4,-4,-1,0),floor('channel-ramp',-5,-1,-1,7,0,-2.6,'wet'),floor('service-channel',-5,4,7,12,-2.6,-2.6,'wet'),
 floor('maintenance-cellar',-2,4,12,17,-2.6,-2.6,'wet'),floor('service-stair-a',0,4,17,26,-2.6,.3,'wet'),floor('service-turn',0,10,26,30,.3,.3,'stone'),
 floor('service-stair-b',6,10,16,26,3.2,.3,'stone')
]);
export const surfaceY=(f,z)=>f.y+(f.endY-f.y)*Math.max(0,Math.min(1,(z-f.z1)/(f.z2-f.z1)));
const wall=(id,x,z,hx,hz,y,h,gate=null)=>({id,x,z,hx,hz,y,h,gate});
export const QUARTER_WALLS=Object.freeze([
 wall('workshop-back',-20,-17.1,6,.9,0,4.3),
 wall('precision-front-left',11.1,-12,2.1,.16,0,3.6),wall('precision-front-right',20,-12,2,.16,0,3.6),wall('precision-east',22,-7.6,.16,4.4,0,3.6),
 wall('precision-west-lower',9,-10.5,.16,1.5,0,3.6),wall('precision-west-upper',9,-3.8,.16,.8,0,3.6),
 wall('precision-bench',19.9,-8.1,.7,1.7,0,1),wall('dye-vat',-25,-1,.6,.6,0,1),wall('crane',12.3,14.8,.55,.55,3.2,4.8),
 wall('arch',-16,-3.8,2,.23,0,3.1,'archOpen'),wall('goods-gate',17,1.55,2,.15,0,2.1,'goodsAccess')
]);
export function activeQuarterWalls(q){return QUARTER_WALLS.filter(w=>!w.gate||!q[w.gate]);}
export const QUARTER_SITES=Object.freeze([
 {id:'workshop',name:"Leonardo's workshop",x:-20,z:-13,y:0},
 {id:'arch-front',name:'The bell-bracket service arch',x:-16,z:-6,y:0},
 {id:'precision',name:"Marta's precision workshop",x:17.5,z:-7.8,y:0},
 {id:'carrier',name:"Neri's loading court",x:12,z:-.8,y:0},
 {id:'dye',name:"Ilaria's dye household",x:-23.2,z:-2.1,y:0},
 {id:'loft',name:'The finishing table',x:-23.4,z:9.5,y:1.6},
 {id:'sluice',name:'Dry sluice controls',x:1.7,z:-2.6,y:0},
 {id:'cellar',name:'The maintenance ledger',x:1,z:14.1,y:-2.6},
 {id:'parcel',name:'The stalled goods carriage',x:1.8,z:14,y:3.2},
 {id:'arch-back',name:'The familiar bell bracket - latch side',x:-16,z:-2.35,y:0},
 {id:'town',name:'Continue to the older Vinci districts',x:-24,z:-14,y:0}
]);
export const QUARTER_ROUTES=Object.freeze({
 social:[[-20,-13],[-14,-11],[5,-7],[12,-7],[17.5,-7.8],[15,-4],[12,-.8],[17,0],[17,5],[17,10],[17,13.1],[10,13.1],[1.8,14]],
 upper:[[-20,-13],[-20,-11],[-16,-9],[-20,-6],[-24,-6],[-23.2,-2.1],[-24,0],[-24,5],[-24,9.5],[-20,9.5],[-20,15],[-20,21],[-13,21],[-13,16],[-10,14],[1.8,14]],
 hydraulic:[[-20,-13],[-14,-11],[-8,-7],[-3,-4.5],[1.7,-2.6],[-3,-2.3],[-3,3],[-3,9],[1,10],[1,14.1],[2,16],[2,22],[2,28],[8,28],[8,23],[8,18],[8,14],[1.8,14]],
 return:[[1.8,14],[-10,14],[-10,9],[-10,4],[-10,0],[-16,0],[-16,-2.35],[-16,-6],[-16,-11],[-20,-13]]
});
export const QUARTER_ACTORS=Object.freeze([
 {id:'marta',name:'Marta / precision craft',paths:[[16,-9,0],[17.5,-7.8,0],[13,-5,0],[12,-.8,0]],period:34},
 {id:'ilaria',name:'Ilaria / dye and finish',paths:[[-23.2,-2.1,0],[-24,0,0],[-24,5,.914],[-24,9.5,1.6]],period:30},
 {id:'neri',name:'Neri / shared deliveries',paths:[[12,-.8,0],[10,-2,0],[6,-6,0],[-4,-6,0]],period:26}
]);
