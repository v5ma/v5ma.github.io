/* Original Highline geometry. All dimensions are metres. The old 4.4 m route
 * stays in place. Render, collision, guidance and grapple use this one source. */
export const HIGHLINE_MAX_Y = 32;
export const HIGHLINE_TOWERS = Object.freeze([
 {id:'print',name:'PRINT EXCHANGE',x:-12.5,w:9.6,firstX:-15,secondX:-10,flights:4,top:17.2,color:0xb79579},
 {id:'radio',name:'RADIO TOWER',x:15,w:10.8,firstX:18,secondX:12,flights:6,top:23.6,color:0x74959d}
].map(Object.freeze));
const rounded = n => Math.round(n*1000)/1000;
const point = (label,x,y,z) => Object.freeze({label,x,y:rounded(y),z});
const floors=[], walls=[], guide=[], anchors=[];
for(const t of HIGHLINE_TOWERS){
 floors.push({id:'highline-'+t.id+'-base',x:t.x,y:4.4,z:-5.05,w:t.w,d:1.5,highline:true});
 guide.push(point(t.name+' / lower stair',t.firstX,4.4,-4.5));
 for(let i=0;i<t.flights;i++){
  const base=rounded(4.4+i*3.2),top=rounded(base+3.2),forward=i%2===0,x=forward?t.firstX:t.secondX,z=forward?2.5:-5.05;
  floors.push({id:'highline-'+t.id+'-stair-'+i,x,z:-1.3,w:2.2,d:6.4,y:forward?base:top,slope:forward?.5:-.5,stairs:true,highline:true});
  floors.push({id:'highline-'+t.id+'-landing-'+i,x:t.x,z,w:t.w,d:1.5,y:top,highline:true});
  guide.push(point(t.name+' / stair '+(i+1)+' foot',x,base,forward?-4.5:1.9),point(t.name+' / stair '+(i+1)+' top',x,top,z),point(t.name+' / landing '+(i+1),t.x,top,z),point(t.name+' / next flight',forward?t.secondX:t.firstX,top,z));
  if(!forward){
   anchors.push({id:'highline-'+t.id+'-'+top,label:t.name+' '+top+' m',x:t.x,y:top,z:-5.05,highline:true});
  }
 }
 // Upper walls start above the old route's standing head clearance. Side gaps
 // are real bridge doorways; floors leave stair wells open rather than sealing them.
 const y=7.2,h=rounded(t.top-y-.25),west=t.x-t.w/2-.18,east=t.x+t.w/2+.18;
 const side=(id,x,open)=>({id:'highline-'+t.id+'-'+id,x,y,z:open?-.25:-1.3,w:.24,d:open?7.5:9.6,h,color:t.color,cut:true,highline:true});
 walls.push(side('west',west,t.id==='radio'),side('east',east,t.id==='print'),
  {id:'highline-'+t.id+'-front',x:t.x,y,z:3.55,w:t.w+.6,d:.24,h,color:t.color,cut:true,highline:true},
  {id:'highline-'+t.id+'-back',x:t.x,y,z:-6.15,w:t.w+.6,d:.24,h,color:t.color,cut:true,highline:true});
}
for(const y of [10.8,17.2]){
 floors.push({id:'highline-crossing-'+y,x:.95,y,z:-5.05,w:18.1,d:1.5,highline:true});
 guide.push(point('Highline '+y+' m / west door',-7.8,y,-5.05),point('Highline '+y+' m / crossing',1,y,-5.05),point('Highline '+y+' m / east door',9.8,y,-5.05));
 for(const z of [-5.86,-4.24])walls.push({id:'highline-rail-'+y+'-'+z,x:.95,y,z,w:17.3,d:.09,h:.65,color:0x425b65,highline:true});
}
export const HIGHLINE_FLOORS=Object.freeze(floors.map(Object.freeze));
export const HIGHLINE_WALLS=Object.freeze(walls.map(Object.freeze));
export const HIGHLINE_GUIDE_POINTS=Object.freeze(guide);
export const HIGHLINE_ANCHORS=Object.freeze(anchors.map(Object.freeze));
export function highlineKit(s){const c=s.campaign;return !!c&&(c.completed?.includes('highline')||(c.active==='highline'&&(c.progress?.highline||0)>=1));}
export function highlineRestored(s){return (s.campaign?.progress?.highline||0)>=4;}
export const HIGHLINE_STORY=Object.freeze({
 'highline-brief':'Sal: The forged signal did not stop at street level. Borrow my service grapple and cape rig. Take the marked switchback stairs to Ada\'s upper archive. The ordinary routes and your other work stay open.',
 'highline-archive':'Ada\'s archive records the same command climbing from the press to the radio mast. Someone used our own maintenance line to hide it. Sal: Look from the Print Exchange roof before you cross.',
 'highline-vantage':'Sal: Two sentries cover the 10.8 m crossing. The 17.2 m crossing passes above them. Use either route, the safe service rings, or the stairs. The mast console is at 23.6 m.',
 'highline-relay':'The rooftop repeater goes green. The two Highline sentries stand down. Sal: You cut the forged loop, not the neighborhood power. Come back to the old loft for the recording.',
 'highline-recording':'Sal: That is the real signal beneath the interference: a maintenance request with no sender. Take this recording to Mara at the depot. Glide down or use the familiar stairs; there is no timer.',
 'highline-home':'Mara: First the streets, now the roofs. You have given us a route nobody can quietly close. Keep the service kit. The sender on Sal\'s recording is our next question.'
});
