/* Scene-card typography only. The data comes from the live mission and controls;
 * this module never reads storage, changes gameplay or moves the XR camera. */
export const HUD_MAP=Object.freeze({x:512,y:270,width:234,height:224});
export function wrapConsoleText(value,measure,width,maxLines=2){
 if(typeof measure!=='function'||!Number.isFinite(width)||width<=0||!Number.isInteger(maxLines)||maxLines<1)throw new TypeError('Valid text measure, width and line count required');
 const words=String(value??'').trim().split(/\s+/).filter(Boolean),lines=[];let line='';
 for(const word of words){
  const candidate=line?line+' '+word:word;
  if(measure(candidate)<=width){line=candidate;continue;}
  if(line){lines.push(line);line='';}
  for(const char of word){if(line&&measure(line+char)>width){lines.push(line);line='';}line+=char;}
 }
 if(line)lines.push(line);
 if(lines.length>maxLines){lines.length=maxLines;let last=lines[maxLines-1];while(last&&measure(last+'...')>width)last=last.slice(0,-1);lines[maxLines-1]=last+'...';}
 return lines;
}
export function drawConsoleHUD(ctx,data,{floor=false}={}){
 ctx.fillStyle='#122e3a';ctx.fillRect(0,0,768,512);
 const drawn=[];
 function text(value,x,y,width,font,lineHeight,maxLines,color){
  ctx.font=font;ctx.fillStyle=color;
  const lines=wrapConsoleText(value,s=>ctx.measureText(s).width,width,maxLines);
  lines.forEach((line,i)=>{ctx.fillText(line,x,y+i*lineHeight,width);drawn.push({text:line,x,y:y+i*lineHeight,width});});
 }
 text(data.title||'NEIGHBORHOOD MISSIONS',22,44,724,'bold 31px sans-serif',34,1,'#f6d689');
 text(data.goal||'Choose a mission',22,92,724,'28px sans-serif',32,3,'#ffffff');
 text(data.detail||'',22,203,724,'24px sans-serif',28,2,'#cde9e1');
 // Below this point, all text is confined to the left column. The map cannot
 // obscure equipment, the current trigger meaning or the Menu button label.
 text(data.equipment||'',22,280,468,'24px sans-serif',28,2,'#cde9e1');
 text('Menu: '+(data.menu||'Y')+' / raised pinch',22,346,468,'23px sans-serif',27,2,'#ffffff');
 text(data.controls||'',22,407,468,'23px sans-serif',27,2,'#f6d689');
 if(data.health!=null)text('Health: '+data.health,22,465,468,'23px sans-serif',26,1,'#ffffff');
 text(floor?'Look ahead to clear this card':'Lower free hand to clear this card',22,495,468,'20px sans-serif',22,1,'#cde9e1');
 if(data.map)ctx.drawImage(data.map,HUD_MAP.x,HUD_MAP.y,HUD_MAP.width,HUD_MAP.height);
 return drawn;
}
