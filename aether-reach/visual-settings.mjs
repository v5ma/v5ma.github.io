/* Local presentation preferences; never touches expedition/economy saves. */
export function installVisualSettings(view){
 const key='aether-reach.visual.v1';let saved={};try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
 let mode=['prismatic','balanced','low'].includes(saved.mode)?saved.mode:view.stats().visual.requested;
 let characters=saved.characters!==false,skyglass=saved.skyglass!==false;
 function persist(){try{localStorage.setItem(key,JSON.stringify({version:1,mode,characters,skyglass}));}catch{}}
 view.setVisualMode(mode);view.setCastEnabled(characters);view.setSkyglassEnabled(skyglass);
 const grid=document.querySelector('.settings-grid'),label=document.createElement('label');label.textContent='Materials & effects';const select=document.createElement('select');select.id='visual-quality';select.setAttribute('aria-label','Materials and effects quality');for(const [value,text] of [['prismatic','Prismatic - refractive jewels & glass'],['balanced','Balanced - reflective glass, no refraction pass'],['low','Light - fewer effects, no shadows']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=mode;label.append(select);grid.append(label);
 select.onchange=()=>{mode=select.value;view.setVisualMode(mode);persist();};
 for(const [id,text,value,change] of [['visual-characters','Animated character models',characters,v=>{characters=v;view.setCastEnabled(v);}],['visual-skyglass','Skyglass rifts and moving cloud shade',skyglass,v=>{skyglass=v;view.setSkyglassEnabled(v);}]] ){
  const row=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.id=id;input.checked=value;input.onchange=()=>{change(input.checked);persist();};row.append(input,document.createTextNode(' '+text));grid.append(row);
 }
 const note=document.createElement('p');note.className='fine';note.textContent='Nearby people use licensed animated models, with simpler silhouettes at distance or while loading. Light and immersive VR limit the animated cast and use static rift outlines; moving cloud shade is disabled. Reduced motion freezes decorative shader motion. Hardware performance remains unverified.';document.querySelector('#settings-dialog form').before(note);
}
