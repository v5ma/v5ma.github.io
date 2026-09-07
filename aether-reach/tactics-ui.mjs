import {POWERS,MODULES,RECOVERY,SECURITY,connectedCircuit} from './tactics-core.mjs';
import {fieldChoose,fieldModule,fieldCast,fieldScan,fieldRotate,fieldHack,fieldStart,fieldUnlocked,distance} from './model.mjs';
export function installTacticsUI(api){
 const $=id=>document.getElementById(id),dialog=$('field-dialog'),body=$('field-body');let page='kit',stamp='',flashUntil=0;
 const button=(label,id,fn)=>{const b=document.createElement('button');b.textContent=label;b.id=id;b.onclick=fn;return b;};
 const tools=document.createElement('div');tools.id='field-tools';tools.append(button('N · Field rig','field-open',()=>action('field')),button('T · Power','field-cycle',()=>action('power-next')),button('J · Survey','field-scan',()=>action('survey')));$('hud').append(tools);
 const badge=document.createElement('div');badge.id='field-power';badge.setAttribute('aria-live','polite');$('hud').append(badge);
 const battle=document.createElement('div');battle.id='field-battle';battle.hidden=true;$('hud').append(battle);
 const scanFlash=document.createElement('div');scanFlash.id='survey-flash';scanFlash.hidden=true;$('hud').append(scanFlash);
 const pause=button('Field rig / powers & research','field-from-pause',()=>{$('pause-dialog').close();open('kit');});$('pause-dialog').append(pause);
 const help=document.createElement('p');help.className='fine';help.textContent='Field engineering: collect the loan rig at the Quay bench. T cycles powers; Q casts the selected power while the gun remains ready; J surveys a live target; N opens builds. Xbox D-pad left opens the rig, LB casts. Touch uses the Field/Power/Survey buttons and PULSE. On XR, left trigger casts from the left controller.';$('settings-dialog').insertBefore(help,document.querySelector('#settings-dialog form')); 
 function addCard(title,text,label,id,onClick,disabled=false){const a=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),b=button(label,id,onClick);h.textContent=title;p.textContent=text;b.disabled=disabled;a.append(h,p,b);body.append(a);}
 function open(which){page=which;stock();api.show('field-dialog');}
 function stock(){const s=api.state(),t=s.tactics;body.replaceChildren();$('field-message').textContent='';$('field-title').textContent=page==='hack'?'Rewire the security junction':page==='relay'?'Prepare. Defend. Recover.':'The second hand changes the fight.';
  $('field-subtitle').textContent=page==='hack'?'Turn the nine conductors to connect the left SOURCE to the right TURRET. Connections must meet across adjacent tile edges. This planning puzzle pauses the world.':page==='relay'?'Keep the collector alive for 48 seconds and clear three waves. Enemies attack the collector. Hack the nearby turret, prime the water or oil, then defend with your gun and power.':'Visit Field Engineering beside Quay Outfitters to borrow Current and Cinder. Equip one passive module. Research gives +10% gun damage against each recorded enemy class. Not a replacement for your weapon.';
  if(page==='hack'){
   const circuit=document.createElement('div');circuit.id='field-circuit';const path=connectedCircuit(t.circuit).path;
   t.circuit.forEach((mask,i)=>{const b=button('',`circuit-${i}`,()=>{if(!fieldRotate(s,i))return;stock();$(`circuit-${i}`).focus();});b.setAttribute('aria-label',`Rotate conductor row ${Math.floor(i/3)+1} column ${i%3+1}`);b.classList.toggle('connected',path.includes(i));let lines='';for(const [bit,x,y]of [[1,50,0],[2,100,50],[4,50,100],[8,0,50]])if(mask&bit)lines+=`<path d="M50 50L${x} ${y}"/>`;b.innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true">${lines}<circle cx="50" cy="50" r="9"/></svg><span>${i+1}</span>`;circuit.append(b);});body.append(circuit);
   addCard('SOURCE → network → TURRET','A genuine path through the conductors turns security to your side. No money or device-network access is involved.','Energize connection','field-energize',()=>{if(!fieldHack(s)){$('field-message').textContent='No complete connection. Inspect the source/exit edges and turn the conductors.';return;}api.events();page='kit';stock();});
  }else if(page==='relay'){
   const e=t.encounter;addCard('Atrium Salvage Relay',`Collector: ${Math.ceil(e.hull)}/${RECOVERY.hull}. Security: ${t.hacked?'FRIENDLY / 14 capacitor shots per attempt':'UNCLAIMED'}. First success grants ${RECOVERY.reward} credits; practice repeats do not pay again. Leaving the district or a rescue ends the attempt. Reload resets an unfinished attempt, not its reward.`,e.phase==='active'?'Recovery active':t.completed?'Practice again (no reward)':'Start recovery','field-start',()=>{if(!fieldStart(s)){$('field-message').textContent='Stand beside the Atrium collector before starting.';return;}dialog.close();api.events();},e.phase==='active');
   addCard('Preparation is gameplay','Charged water stuns clustered machines. Oil continues burning after a heat cast. Both can hurt you. Your hacked turret has fourteen shots per attempt; it cannot clear the waves by itself. Engineer makes each shot stronger.','Manage field kit','field-prepare',()=>{page='kit';stock();});
  }else{
   for(const [id,p]of Object.entries(POWERS))addCard(p.name,p.description+(id!=='pulse'?` ${p.cost} base energy. Independent from gun ammo and reload.`:''),t.power===id?'EQUIPPED':id!=='pulse'&&!t.learned?'BORROW AT QUAY':'Equip',`power-${id}`,()=>{fieldChoose(s,id);api.events();stock();},id!=='pulse'&&!t.learned);
   for(const [id,m]of Object.entries(MODULES))addCard(m.name,m.description,t.module===id?'ACTIVE MODULE':fieldUnlocked(s,id)?'Equip passive':'LOCKED',`module-${id}`,()=>{if(!fieldModule(s,id)){$('field-message').textContent='Change passives on foot before the recovery starts, not during a fight.';return;}api.events();stock();},!fieldUnlocked(s,id));
   if(t.learned)body.append(button('Close and survey aimed target','field-survey-menu',()=>{dialog.close();requestAnimationFrame(()=>api.action('survey'));}));
   const research=document.createElement('p');research.className='field-research';research.textContent='Recorded classes: '+(t.research.join(', ')||'none')+'. Aim at a living machine and press J / Survey. Each class is recorded once; no repeated-scan farming.';body.append(research);
   if(distance(s.p,SECURITY)<2.7&&!t.hacked)body.append(button('Open conductor puzzle','field-open-hack',()=>{page='hack';stock();}));
   if(distance(s.p,RECOVERY)<2.7)body.append(button('Recovery console','field-open-relay',()=>{page='relay';stock();}));
  }
  stamp=[t.power,t.module,t.research.length,t.hacked,t.learned].join(':');
 }
 function action(name){if(!api.playing()||api.paused())return false;const s=api.state();
  if(name==='field'){open('kit');return true;}
  if(name==='power-next'){const ids=s.tactics.learned?Object.keys(POWERS):['pulse'];fieldChoose(s,ids[(ids.indexOf(s.tactics.power)+1)%ids.length]);api.toast('Left hand: '+POWERS[s.tactics.power].name);return true;}
  if(name==='survey'){if(!fieldScan(s,api.aim()))api.toast('Survey a living, unrecorded machine within sight. Borrow the rig at Field Engineering first.',3);return true;}
  if(name==='pulse'){if(!fieldCast(s,api.powerAim()))api.toast('Power unavailable: check energy, cooldown and field rig.',2);return true;}
  return false;
 }
 function effect(e){if(e.type==='field-open')open(e.page);if(e.type==='survey'){flashUntil=performance.now()+500;api.toast('SURVEY: '+e.kind+' recorded. +10% weapon damage against this class. New passives may be available.',5);}if(e.type==='tactical-hack')api.toast('Security rerouted. The Atrium turret now fights for you.',5);if(e.type==='tactical-start')api.toast('Recovery active. Defend the collector; primed water and oil are useful traps.',5);if(e.type==='tactical-wave')api.toast('RECOVERY WAVE '+e.number+' / 3',3);if(e.type==='tactical-reward')api.toast('RECOVERY COMPLETE · '+e.credits+' credits. Replays are practice only.',6);if(e.type==='tactical-end'&&e.reason!=='complete')api.toast('Recovery '+e.reason+'. Return to the collector to retry.',5);if(e.type==='tactical-combo'){$('hit-confirm').hidden=false;badge.classList.add('combo');setTimeout(()=>badge.classList.remove('combo'),220);}}
 function update(){const s=api.state(),t=s.tactics;if(!t)return;badge.textContent=`Q · ${POWERS[t.power].name.toUpperCase()} / ${t.module.toUpperCase()}${t.learned?'':' · loan rig at Quay bench'}`;scanFlash.hidden=performance.now()>flashUntil||api.paused();scanFlash.textContent='CLASS RECORDED';
  const e=t.encounter;battle.hidden=e.phase!=='active';if(!battle.hidden){const remaining=s.drones.filter(b=>b.tactical&&b.hp>0).length;battle.textContent=`RECOVERY ${Math.min(100,Math.floor(e.time/RECOVERY.duration*100))}%  ·  CORE ${Math.ceil(e.hull)}/${RECOVERY.hull}  ·  WAVE ${e.wave}/3  ·  ${remaining} HOSTILES${t.hacked?'  ·  TURRET '+e.turretCharge+'/14':''}`;}
  if(dialog.open&&stamp!==[t.power,t.module,t.research.length,t.hacked,t.learned].join(':'))stock();
 }
 return {action,effect,update};
}
