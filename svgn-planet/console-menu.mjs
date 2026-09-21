/* Render real button data at the existing hit coordinates. No new menu layer. */
import {wrapConsoleText} from './console-hud.mjs';
export function drawConsoleMenuRow(ctx,row){
 ctx.fillStyle='#365866';ctx.fillRect(row.x,row.y,row.w,row.h);
 const title=String(row.label||'').replace(/\s+/g,' ').trim(),detail=String(row.detail||'').replace(/\s+/g,' ').trim();
 const x=row.x+15,width=row.w-30;
 ctx.fillStyle='#fff3d5';ctx.font=detail?'bold 25px sans-serif':'27px sans-serif';
 ctx.fillText(title,x,detail?row.y+27:row.y+row.h/2+9,width);
 if(!detail)return [];
 ctx.fillStyle='#d4eee8';ctx.font='20px sans-serif';
 const lines=wrapConsoleText(detail,s=>ctx.measureText(s).width,width,2);
 lines.forEach((line,i)=>ctx.fillText(line,x,row.y+51+i*23,width));
 return lines;
}
