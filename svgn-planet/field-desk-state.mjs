/* Presentation preferences only. Never migrate or rewrite any gameplay ledger. */
export const FIELD_DESK_KEY='svgn.neighborhood-field-desk.v1';
export const FIELD_DESK_DEFAULTS=Object.freeze({v:1,height:1.1,distance:1.05,size:1,hud:'wrist',vehicleSpeed:'left-trigger',reducedMotion:false});
export function parseFieldDesk(value){
 const p=typeof value==='string'?JSON.parse(value):value;if(p==null)return {...FIELD_DESK_DEFAULTS};
 if(p.v!==1||!Number.isFinite(p.height)||p.height<.45||p.height>1.8||!Number.isFinite(p.distance)||p.distance<.65||p.distance>2||!Number.isFinite(p.size)||p.size<.65||p.size>1.3||!['wrist','pedestal','off'].includes(p.hud)||!['left-trigger','right-trigger','profile'].includes(p.vehicleSpeed)||typeof p.reducedMotion!=='boolean')throw Error('Unrecognized field-desk preferences; saved data retained.');
 return Object.fromEntries(Object.keys(FIELD_DESK_DEFAULTS).map(k=>[k,p[k]]));
}
export function readFieldDesk(store){try{return {settings:parseFieldDesk(store?.getItem(FIELD_DESK_KEY)),blocked:false};}catch(e){return {settings:{...FIELD_DESK_DEFAULTS},blocked:true,error:e.message};}}
export function writeFieldDesk(store,settings){try{const text=JSON.stringify(parseFieldDesk(settings));store.setItem(FIELD_DESK_KEY,text);return store.getItem(FIELD_DESK_KEY)===text;}catch{return false;}}
export function isRiding(state){return state?.tide?.boat===true|| (typeof state?.ride==='boolean'?state.ride:['bicycle','boat'].includes(state?.ride));}
export function ridingTrigger(settings,state,hand,pressed){
 if(!isRiding(state)||settings.vehicleSpeed==='profile')return null;
 return {boost:!!pressed&&hand===(settings.vehicleSpeed==='left-trigger'?'left':'right'),brake:!!pressed&&hand!==(settings.vehicleSpeed==='left-trigger'?'left':'right')};
}
export function deskProgress(current,open,dt,reduced=false){const target=open?1:0;if(reduced)return target;return current+Math.sign(target-current)*Math.min(Math.abs(target-current),Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0))*5);}
export function controlCaption(settings,state){
 if(isRiding(state)&&settings.vehicleSpeed!=='profile')return (settings.vehicleSpeed==='left-trigger'?'LT speed / RT brake':'RT speed / LT brake')+' / release speed to stop';
 return isRiding(state)?'Saved Courier/Action riding controls':'On foot: saved Action/Courier controls';
}
