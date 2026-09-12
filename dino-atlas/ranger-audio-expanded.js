// Extra procedural sound design for the Spectacle & Trade pass. No remote recordings or copyrighted samples.
import {RangerAudio as BaseRangerAudio,sanitizeAudioSettings} from './ranger-audio.js?base=storm2';
export {sanitizeAudioSettings};

export class RangerAudio extends BaseRangerAudio{
 constructor(){
  super();this.lastSpectacle=0;
  this.onSpectacle=e=>this.spectacle(e.detail||{});
  window.addEventListener('dino-spectacle',this.onSpectacle);
 }
 spectacle(detail){
  if(!this.settings?.enabled)return;
  if(!this.context){this.ensure().then(ok=>{if(ok)this.spectacle(detail);}).catch(()=>{});return;}
  if(this.context.state!=='running')return;
  const now=this.context.currentTime;if(now-this.lastSpectacle<.045)return;this.lastSpectacle=now;
  if(detail.type==='sonic')this.sonicBoom();
  else if(detail.type==='gravity')this.gravityRipple();
  else if(detail.type==='celebration')this.celebration();
  else if(detail.type==='rival')this.rivalRadio();
  else if(detail.type==='trade-buy')this.tradeChime(true);
  else if(detail.type==='trade-sell')this.tradeChime(false);
  else if(detail.type==='contract')this.contractSting();
 }
 sweep(type,start,end,duration,peak=.12,delay=0){
  const c=this.context,at=c.currentTime+delay,n=this.node(type,start,this.sfxBus,0);n.o.frequency.setValueAtTime(start,at);n.o.frequency.exponentialRampToValueAtTime(Math.max(1,end),at+duration);this.env(n,at,peak,duration,.008);return n;
 }
 sonicBoom(){
  this.noiseHit(.52,.23,190,'lowpass');this.noiseHit(.15,.13,2800,'bandpass');
  this.sweep('sine',88,31,.62,.22);this.sweep('triangle',176,47,.48,.11,.018);
  this.sweep('sine',44,58,.9,.08,.09);
 }
 gravityRipple(){
  this.sweep('sine',36,61,1.25,.16);this.sweep('triangle',126,52,1.05,.085,.05);this.noiseHit(.85,.08,520,'bandpass');
  for(let i=0;i<4;i++)this.sweep('sine',220+i*46,110+i*19,.38,.035,.11+i*.11);
 }
 celebration(){
  this.noiseHit(.34,.18,650,'lowpass');this.sweep('triangle',74,42,.42,.12);
  for(const [i,n] of [64,71,76,83].entries()){const c=this.context,at=c.currentTime+.06+i*.065,x=this.node('sine',440,this.sfxBus,(i-1.5)*.16);x.o.frequency.setValueAtTime(440*Math.pow(2,(n-69)/12),at);this.env(x,at,.055,.24,.008);}
 }
 rivalRadio(){
  for(const [i,f] of [880,1180,720].entries()){const c=this.context,at=c.currentTime+i*.075,x=this.node('square',f,this.sfxBus,i===0?-.25:.25);this.env(x,at,.026,.07,.004);}this.noiseHit(.12,.028,1800,'bandpass');
 }
 tradeChime(buy=true){
  const notes=buy?[67,72,76]:[76,72,67];for(const [i,n] of notes.entries()){const c=this.context,at=c.currentTime+i*.07,x=this.node('sine',440,this.sfxBus,(i-1)*.12);x.o.frequency.value=440*Math.pow(2,(n-69)/12);this.env(x,at,.055,.22,.006);}
 }
 contractSting(){
  const notes=[55,62,67,74];for(const [i,n] of notes.entries()){const c=this.context,at=c.currentTime+i*.09,x=this.node(i%2?'triangle':'sine',440,this.sfxBus,0);x.o.frequency.value=440*Math.pow(2,(n-69)/12);this.env(x,at,.06,.34,.012);}this.noiseHit(.18,.05,1300,'bandpass');
 }
}
