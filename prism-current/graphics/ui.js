/* Persist graphics preferences separately from completed-song records. */
addEventListener('DOMContentLoaded',()=>{
 const key='prism-current.graphics.v2',quality=document.getElementById('graphics-quality'),intensity=document.getElementById('effect-strength'),quiet=document.getElementById('quiet-effects');
 if(!quality)return;
 quality.value=matchMedia('(pointer: coarse)').matches?'balanced':'cinematic';quiet.checked=matchMedia('(prefers-reduced-motion: reduce)').matches;
 try{const d=JSON.parse(localStorage.getItem(key)||'null');if(d){if(['cinematic','balanced','light'].includes(d.quality))quality.value=d.quality;if(Number.isFinite(d.strength))intensity.value=Math.min(100,Math.max(0,d.strength));if(typeof d.quiet==='boolean')quiet.checked=d.quiet;}}catch{}
 for(const el of[quality,intensity,quiet])el.addEventListener('change',()=>{try{localStorage.setItem(key,JSON.stringify({quality:quality.value,strength:Number(intensity.value),quiet:quiet.checked}));}catch{}});
});
