import {waterPrompt} from './aquatic-prompts.mjs';
export function createAquaticUI(E){
 const hud=document.getElementById('hud'),panel=document.createElement('section');
 panel.id='aquatic-hud';panel.hidden=true;panel.setAttribute('aria-label','Swimming and oxygen');
 panel.innerHTML='<strong id="water-state">WATER</strong><progress id="oxygen-meter" aria-label="Oxygen remaining" max="100" value="100"></progress><span id="water-control"></span><span id="water-warning" role="status" aria-live="polite" aria-atomic="true"></span>';
 hud.append(panel);
 const meter=panel.querySelector('#oxygen-meter'),state=panel.querySelector('#water-state'),control=panel.querySelector('#water-control'),warning=panel.querySelector('#water-warning');
 let lastWarning='';
 function update(){
  const p=E.state.player,visible=E.mode==='play'&&p.waterMode==='swim';
  panel.hidden=!visible;document.body.classList.toggle('underwater',visible&&p.submerged);document.body.classList.toggle('swimming',visible);
  if(!visible){panel.classList.remove('low-air');if(lastWarning){warning.textContent='';lastWarning='';}return;}
  const text=waterPrompt({connected:!!E.pad.connected,preset:E.settings?.controlPreset,submerged:!!p.submerged,oxygen:p.oxygen});
  meter.value=text.air;meter.setAttribute('aria-label',text.oxygenLabel);state.textContent=text.state;control.textContent=text.control;panel.classList.toggle('low-air',text.lowAir);
  // Announce threshold transitions, not every oxygen decrement or render frame.
  if(text.warning!==lastWarning){warning.textContent=text.warning;lastWarning=text.warning;}
 }
 return {update};
}
