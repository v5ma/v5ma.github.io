/* Presentation only: independent from world, actor, mission and save coordinates. */
export const PRESENTATION_KEY='svgn.neighborhood-xr-presentation.v1';
export const PRESENTATION_DEFAULTS=Object.freeze({v:1,scale:.04,height:-.9,distance:1.55,rotation:0,boxHeight:3});
const bounds={scale:[.01,.12],height:[-1.2,-.1],distance:[1.2,2.8],rotation:[-Math.PI,Math.PI],boxHeight:[1,6]};
export function parsePresentation(raw){
 const p=raw==null?{...PRESENTATION_DEFAULTS}:typeof raw==='string'?JSON.parse(raw):raw;
 if(!p||p.v!==1)throw Error('Unsupported XR presentation preferences; original data retained.');
 for(const [key,[low,high]]of Object.entries(bounds))if(!Number.isFinite(p[key])||p[key]<low||p[key]>high)throw Error('Invalid XR presentation '+key);
 return Object.fromEntries(Object.keys(PRESENTATION_DEFAULTS).map(k=>[k,p[k]]));
}
export function loadPresentation(store){try{return {prefs:parsePresentation(store?.getItem(PRESENTATION_KEY)),blocked:false};}catch(e){return {prefs:{...PRESENTATION_DEFAULTS},blocked:true,error:e.message};}}
export function savePresentation(store,prefs){try{const value=JSON.stringify(parsePresentation(prefs));store.setItem(PRESENTATION_KEY,value);return store.getItem(PRESENTATION_KEY)===value;}catch{return false;}}
