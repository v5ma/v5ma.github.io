/* Mill Bell is an optional authored connection, never a movement/input owner.
 * Only newly generated preview documents opt in. Old documents remain unchanged.
 */
export const MILL_BELL=Object.freeze({version:1,id:'mill-bell-v1',from:'ww-crescent',to:'ww-gallery',
 peg:Object.freeze({id:'peg-143-39',tx:143,ty:39,x:5166,y:1422}),
 recovery:'ww-court-return',hint:'Hold whip near the bell. Release while rising right. Keeping speed needs no whip.'});
export function withMillBell(document,pegTile){
 if(!document?.gp?.waterwheel?.preview||document.gp.waterwheel.groundOnly)return document;
 if(!Number.isInteger(pegTile)||pegTile<1||pegTile>255)throw new TypeError('Missing peg tile');
 const {tx,ty}=MILL_BELL.peg,index=ty*document.width+tx;
 if(tx>=document.width||ty>=document.height||!document.cells||document.cells.length!==document.width*document.height)throw new RangeError('Mill Bell lies outside the document');
 if(document.cells[index]!==0&&document.cells[index]!==pegTile)throw new Error('Mill Bell would overwrite an existing tile');
 const ids=document.ct?.map(p=>p.sky?.id)||[];
 if(![MILL_BELL.from,MILL_BELL.to,MILL_BELL.recovery].every(id=>ids.includes(id)))throw new Error('Mill Bell needs its actual departure, receiver and recovery');
 const cells=document.cells.slice();cells[index]=pegTile;
 const net=document.gp.skyNetwork;
 const links=(net?.links||[]).filter(l=>l.id!==MILL_BELL.id);
 return {...document,cells,gp:{...document.gp,waterwheel:{...document.gp.waterwheel,whipLink:{...MILL_BELL,peg:{...MILL_BELL.peg}}},
  ...(net?{skyNetwork:{...net,pegCount:cells.reduce((n,t)=>n+(t===pegTile),0),links:[...links,{id:MILL_BELL.id,from:MILL_BELL.from,to:MILL_BELL.to,type:'optional-whip',peg:MILL_BELL.peg.id}]}}:{})}};
}
export function visibleMillBell(course,pegTile=60){
 const link=course?.gp?.waterwheel?.whipLink;
 if(!course?.gp?.waterwheel?.preview||course.gp.waterwheel.groundOnly||link?.version!==1||link.id!==MILL_BELL.id)return null;
 const {tx,ty}=MILL_BELL.peg;
 if(link.peg?.id!==MILL_BELL.peg.id||course.cells?.[ty*course.width+tx]!==pegTile)return null;
 const ids=course.ct?.map(p=>p.sky?.id)||[];
 return [MILL_BELL.from,MILL_BELL.to].every(id=>ids.includes(id))?MILL_BELL:null;
}
