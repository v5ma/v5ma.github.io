/* Shared XR menu semantics. Reads real controls; never writes game/save state. */
export const PAGE_SIZE = 6;
export function visible(el) {
  if (!el?.isConnected || el.closest('[hidden],[inert]')) return false;
  const s = getComputedStyle(el);
  return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
}
export function controlLabel(el) {
  const label = el.getAttribute('aria-label') || el.labels?.[0]?.textContent || el.textContent || el.title || el.name || el.id || 'Control';
  return String(label).replace(/\s+/g,' ').trim();
}
export function stepValue(value, direction, min=0, max=100, step=1) {
  const lo=Number.isFinite(+min)?+min:0, hi=Number.isFinite(+max)?+max:100;
  const stride=Number.isFinite(+step)&&+step>0?+step:1;
  const v=Number.isFinite(+value)?+value:lo;
  return +Math.min(hi,Math.max(lo,v+(direction<0?-stride:stride))).toFixed(8);
}
export function paginate(items, requested, size=PAGE_SIZE) {
  const count=Math.max(1,Math.ceil(items.length/size));
  const page=Math.max(0,Math.min(count-1,Number.isFinite(requested)?Math.floor(requested):0));
  return {count,page,items:items.slice(page*size,(page+1)*size)};
}
export function wrapText(ctx, value, width, font='22px sans-serif') {
  ctx.font=font;
  const lines=[];
  for(const paragraph of String(value||'').split('\n')) {
    let line='';
    for(const word of paragraph.split(/\s+/).filter(Boolean)) {
      if(ctx.measureText(line+(line?' ':'')+word).width>width && line){lines.push(line);line='';}
      // Codes and long identifiers must not vanish from the reading panel.
      for(const char of word) {
        if(ctx.measureText(line+char).width>width && line){lines.push(line);line='';}
        line+=char;
      }
      line+=' ';
    }
    if(line.trim())lines.push(line.trimEnd());
  }
  return lines;
}
export function controls(root) {
  if(!root)return [];
  return [...root.querySelectorAll('button,a[href],input:not([type="hidden"]),select,textarea,summary,[role="button"],[tabindex="0"]')]
    .filter(el=>visible(el)&&!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&el.tagName!=='CANVAS');
}
export function menuEntries(root,{invoke,edit,external,valid=()=>true}={}) {
  const entries=[];
  for(const el of controls(root)) {
    const live=()=>valid()&&visible(el)&&!el.disabled&&el.getAttribute('aria-disabled')!=='true';
    const add=(label,action)=>entries.push({el,label,action:()=>{if(live())action();}});
    const label=controlLabel(el);
    if(el.matches('input[type="range"],input[type="number"],select')) {
      const val=el.tagName==='SELECT'?el.value:el.value;
      for(const dir of [-1,1]) add(`${label}: ${val} ${dir<0?'minus':'plus'}`,()=>{
        if(el.tagName==='SELECT') {
          const choices=[...el.options].map((o,i)=>!o.disabled?i:-1).filter(i=>i>=0);
          if(!choices.length)return;
          el.selectedIndex=choices[Math.max(0,Math.min(choices.length-1,choices.indexOf(el.selectedIndex)+dir))];
        } else el.value=String(stepValue(el.value,dir,el.min||0,el.max||100,el.step||1));
        el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));
      });
      if(el.type==='number')add('Type '+label,()=>edit(el));
    } else if(el.matches('input[type="checkbox"],input[type="radio"]')) {
      add(`${label}: ${el.checked?'On':'Off'}`,()=>invoke(el));
    } else if(el.matches('textarea,input:not([type="button"]):not([type="submit"]):not([type="file"]):not([type="color"]):not([type="reset"])')) {
      add(`${label}: ${el.type==='password'?'(private)':el.value||'(empty)'} / Edit`,()=>edit(el));
    } else if(el.matches('a[href],input[type="file"],input[type="color"]')) {
      add(label+' / browser handoff',()=>external(el));
    } else add(label,()=>invoke(el));
  }
  return entries;
}
export function editValue(value, token, maxLength=4096) {
  const limit=Number.isInteger(maxLength)&&maxLength>=0?Math.min(maxLength,65536):4096;
  const chars=Array.from(String(value));
  if(token==='Backspace')chars.pop();else if(token==='Clear')return '';else chars.push(token==='Space'?' ':token==='New line'?'\n':token);
  return chars.join('').slice(0,limit);
}
