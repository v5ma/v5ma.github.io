/* Repeatable numeric mix review; not a perceptual listening approval. */
const fs=require('node:fs'),C=require('../core'),M=require('../music');
const songs=[];
for(const t of C.TRACKS){const s=C.chart(t.id),r=M.render(s,24000),parts=s.sections||[{name:'Whole track',start:0,end:s.duration}];
const sections=parts.map(p=>{let sum=0,peak=0,n=0;for(let i=Math.floor(p.start*r.rate);i<Math.min(r.left.length,Math.floor(p.end*r.rate));i++){sum+=r.left[i]**2+r.right[i]**2;peak=Math.max(peak,Math.abs(r.left[i]),Math.abs(r.right[i]));n+=2;}return {name:p.name,peak,rms:Math.sqrt(sum/n)};});
// Runtime caps hit oscillators at four voices, each with envelope <=0.08.
const fullMixUpperBound=r.peak+4*.08;
if(fullMixUpperBound>=1)throw Error('Insufficient full-mix headroom: '+t.id);
songs.push({id:t.id,seconds:s.duration,rate:r.rate,peak:r.peak,rms:r.rms,peakDbFS:20*Math.log10(r.peak),fullMusicPlusFourHitVoicesUpperBound:fullMixUpperBound,sections});}
fs.mkdirSync('test-output',{recursive:true});fs.writeFileSync('test-output/tidal-audio-audit.json',JSON.stringify({scope:'Numeric sample-peak, RMS and conservative hit-envelope sum at maximum music/effects gains. Not inter-sample true-peak, LUFS or a human listening review.',songs},null,2));console.log(JSON.stringify(songs.map(({id,peak,rms,fullMusicPlusFourHitVoicesUpperBound})=>({id,peak,rms,fullMusicPlusFourHitVoicesUpperBound})),null,2));
