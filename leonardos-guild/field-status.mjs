/* Read-only presentation for the fixed tracked-controller adapter in guild-xr.
 * This does not replace or remap the separate Xbox/Classic controller profiles. */
const integer=(value)=>Math.max(0,Math.round(Number.isFinite(value)?value:0));
const toolNames={staff:'Guild staff',sling:'Artisan sling',letters:'Sealed letters',lantern:'Ingenio lantern'};
export function fieldStatus(state={},goal={}){
 const s=state||{},c=s.resonance||{},foot=s.mode==='foot',car=s.mode==='car',tool=toolNames[c.tool]||'Guild tool';
 const header=foot?'ON FOOT / '+tool:(car?'PEDAL CARRIAGE':'BICYCLE');
 const resources=foot?`Health ${integer(s.health)} / Sling ${integer(c.ready)} + ${integer(c.reserve)}`:`${integer(Math.abs(s.speed||0)*3.6)} km/h / Letters ${integer(s.papers)} / Health ${integer(s.health)}`;
 const reload=foot&&c.tool==='sling'&&!!c.aim;
 const action=reload?'Right B: reload; hold B to interact':'Right B: interact / nearby work';
 const primary=foot?(c.tool==='staff'?'LT: brace / RT: staff':c.tool==='sling'?'LT: aim / RT: sling pellet':c.tool==='letters'?'RT: throw selected letter':'RT: earned lantern power'):'Left stick: steer / LT: brake / RT: boost';
 const secondary=(foot?'Right A: jump / stairs':car?'Carriage stays grounded':'Right A: bicycle hop')+' / '+action;
 return {header,resources,title:String(goal.title||'Explore Vinci'),hint:String(goal.hint||'Summon the field desk for your map and inventory.'),primary,secondary,reload,profile:'tracked-xr'};
}
export function floorStatusPlacement(anchor){
 if(!anchor||![anchor.foot?.x,anchor.foot?.z,anchor.floor,anchor.yaw].every(Number.isFinite))return null;
 return {x:anchor.foot.x-Math.sin(anchor.yaw)*.6,y:anchor.floor+.25,z:anchor.foot.z-Math.cos(anchor.yaw)*.6,yaw:anchor.yaw};
}
// Wrap at real canvas text widths instead of squeezing a long mission sentence
// into an illegible single line. Ellipsis explicitly indicates further detail.
export function statusLines(context,text,maxWidth,maxLines=2){
 const words=String(text||'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
 for(let i=0;i<words.length;i++){
  const candidate=line?line+' '+words[i]:words[i];
  if(context.measureText(candidate).width<=maxWidth){line=candidate;continue;}
  if(line){lines.push(line);line='';i--;if(lines.length===maxLines)break;continue;}
  // A single unbroken token must not overflow into the minimap.
  let token=words[i];while(token.length&&context.measureText(token+'...').width>maxWidth)token=token.slice(0,-1);
  lines.push(token+'...');if(lines.length===maxLines)break;
 }
 if(line&&lines.length<maxLines)lines.push(line);
 const source=String(text||'').trim();
 if(lines.length===maxLines&&lines.join(' ')!==source){let last=lines.at(-1).replace(/\.\.\.$/,'');while(last.length&&context.measureText(last+'...').width>maxWidth)last=last.slice(0,-1);lines[lines.length-1]=last.trimEnd()+'...';}
 return lines;
}
