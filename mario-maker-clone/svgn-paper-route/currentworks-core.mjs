/* Authored backdrop, never collision geometry. Source coordinates remain 2D. */
export const UNIT=72;
export const SOURCE='c31dd6c56a101aec7c8a890768ae1f845494b294';
export const CLOUDS=Object.freeze([
 {id:'quay-weather',seed:17,position:[8,-25.45,-2.6],radius:.70},
 {id:'porch-weather',seed:43,position:[16.4,-24.8,-2.3],radius:.87},
 {id:'return-weather',seed:81,position:[29.0,-25.4,-2.7],radius:.73},
 {id:'bridge-weather',seed:107,position:[37.3,-23.9,-2.3],radius:.66},
 {id:'court-weather',seed:137,position:[72,-24.8,-2.5],radius:.78},
 {id:'wheelhouse-weather',seed:199,position:[109,-23.1,-2.6],radius:.92}
].map(d=>Object.freeze({...d,position:Object.freeze(d.position),drift:.025,bob:.012})));
export const ISLANDS=Object.freeze([
 {id:'parcel-porch-garden',seed:42,position:[13.5,-26.5,-2.8],radius:.90,depth:.64,yaw:.3},
 {id:'market-return-garden',seed:81,position:[25.2,-26.5,-2.8],radius:1.00,depth:.76,yaw:-.2},
 {id:'bridge-reading-garden',seed:111,position:[35.7,-25.6,-2.8],radius:.74,depth:.50,yaw:.6},
 {id:'wheelhouse-garden',seed:157,position:[109.5,-24.3,-2.8],radius:1.15,depth:.84,yaw:.1}
].map(d=>Object.freeze({...d,position:Object.freeze(d.position)})));
export const BUDGET=Object.freeze({clouds:6,islands:4,cloudTriangles:6*448,islandTriangles:4*200,range:1500});
export function enabled({preview=false,testing=false,view='2d',look='prismatic'}={}){
 return preview===true&&testing===true&&view==='3d'&&look!=='classic';
}
export function inRange(x,riderX){return Number.isFinite(x)&&Number.isFinite(riderX)&&Math.abs(x-riderX)<=BUDGET.range;}
export function nearViewer(distance,radius,wasHidden=false){
 if(!Number.isFinite(distance)||!Number.isFinite(radius)||radius<0)return true;
 return distance<radius*(wasHidden?1.18:1);
}
