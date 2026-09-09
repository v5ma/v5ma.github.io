/* Local presentation preference; never touches expedition/economy saves. */
export function installVisualSettings(view){
 const key='aether-reach.visual.v1';let mode=view.stats().visual.requested;
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(['prismatic','balanced','low'].includes(saved?.mode))mode=saved.mode;}catch{}
 view.setVisualMode(mode);
 const label=document.createElement('label');label.textContent='Materials & effects';const select=document.createElement('select');select.id='visual-quality';select.setAttribute('aria-label','Materials and effects quality');for(const [value,text] of [['prismatic','Prismatic · refractive jewels & glass'],['balanced','Balanced · reflective glass, no refraction pass'],['low','Light · fewer effects, no shadows']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}select.value=mode;label.append(select);document.querySelector('.settings-grid').append(label);
 select.onchange=()=>{view.setVisualMode(select.value);try{localStorage.setItem(key,JSON.stringify({version:1,mode:select.value}));}catch{}};
 const note=document.createElement('p');note.className='fine';note.textContent='Prismatic adds finite-volume refraction and subtle rainbow dispersion. Balanced keeps polished materials with a cheaper glass treatment. Immersive VR automatically uses the light effects path; physical Quest performance is not yet verified. Reduced motion also freezes decorative shimmer.';document.querySelector('#settings-dialog form').before(note);
}
