import {WEAPONS,upgradePrice} from './arsenal.mjs';
import {equip,buy,depotNear,weaponStats,railTarget} from './model.mjs';
export function installCombatUI(api){
 const $=id=>document.getElementById(id),aimSources=new Set();let previousWeapon='',lastHit=0,lastShop='';
 const dialog=$('shop-dialog'),grid=$('shop-grid'),weapons=$('weapon-slots');
 for(const w of Object.values(WEAPONS)){const b=document.createElement('button');b.className='weapon-slot';b.dataset.weapon=w.id;b.title=w.role;b.innerHTML=`<small>${w.slot}</small><b>${w.name}</b><span>${w.id==='sniper'?'LONG RANGE':w.id==='scatter'?'CLOSE RANGE':w.id==='carbine'?'AUTOMATIC':'RECHARGE'}</span>`;b.onclick=()=>{action('equip',w.id);api.focus();};weapons.append(b);}
 function scope(source,on){if(on)aimSources.add(source);else aimSources.delete(source);api.state().p.scoped=api.playing()&&!api.paused()&&aimSources.size>0;}
 function reset(){aimSources.clear();api.state().p.scoped=false;}
 const exit=document.createElement('button');exit.id='optic-exit';exit.textContent='Leave optic · Z / release aim';exit.onclick=()=>{reset();api.focus();};$('scope-view').append(exit);
 function stock(){const s=api.state(),depot=depotNear(s);$('shop-title').textContent=depot?.name||'Outfitters';$('shop-credits').textContent=s.kit.credits+' CREDITS';grid.replaceChildren();
  const add=(name,detail,label,id,kind,disabled=false)=>{const card=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('p'),b=document.createElement('button');card.className='shop-item';h.textContent=name;p.textContent=detail;b.textContent=label;b.setAttribute('aria-label',name+' — '+label);b.dataset.buy=id;b.dataset.kind=kind;b.disabled=disabled;b.onclick=()=>{if(kind==='equip'){equip(s,id);api.persist();}else if(!buy(s,id,kind)){api.toast('Purchase unavailable: check your credits, proximity and upgrade level.');return;}api.events();stock();};card.append(h,p,b);grid.append(card);};
  for(const w of Object.values(WEAPONS)){const owned=s.kit.owns.includes(w.id);add(w.name,`${w.role}. ${w.damage} damage${w.pellets>1?' × '+w.pellets:''} / ${w.mag} magazine / ${w.reload}s reload.`,owned?(s.p.weapon===w.id?'EQUIPPED':'EQUIP'):w.cost+' CREDITS',w.id,owned?'equip':'weapon',!owned&&s.kit.credits<w.cost);}
  for(const kind of['damage','reload']){const level=s.kit.tune[s.p.weapon][kind],price=upgradePrice(level);add(WEAPONS[s.p.weapon].name+' · '+(kind==='damage'?'Amplifier':'Quick charger'),`Tier ${level}/2. Each tier ${kind==='damage'?'adds 18% damage':'reduces base reload time by 18%'}. Only this weapon is upgraded.`,level===2?'MAXIMUM':price+' CREDITS',s.p.weapon,kind,level>=2||s.kit.credits<price);}
  const level=s.kit.shield,price=upgradePrice(level);add('Field suit · Shield cell',`Tier ${level}/2. +20 maximum shield per tier.`,level===2?'MAXIMUM':price+' CREDITS','shield','shield',level>=2||s.kit.credits<price);
  if(s.p.weapon!=='arc')add('Ammunition crate','Adds one reserve pack for the selected weapon.','35 CREDITS',s.p.weapon,'ammo',s.kit.credits<35||s.kit.reserve[s.p.weapon]>=WEAPONS[s.p.weapon].reserve*3);
  lastShop=s.p.weapon+':'+s.kit.credits;
 }
 function action(name,id){const s=api.state();if(!api.playing()||api.paused())return false;
  if(name==='shop'){if(!depotNear(s)){api.toast('Buy and upgrade at an Outfitters kiosk. The nearest is marked on the map.');return true;}reset();stock();api.show('shop-dialog');return true;}
  if(name==='equip'){if(equip(s,id)){api.events();api.persist();}return true;}
  if(name==='next'||name==='previous'){const a=s.kit.owns,i=a.indexOf(s.p.weapon);equip(s,a[(i+(name==='next'?1:-1)+a.length)%a.length]);api.events();api.persist();return true;}
  if(name==='scope'){scope('toggle',!aimSources.has('toggle'));return true;}return false;
 }
 $('buy-button').onclick=()=>action('shop');$('scope-button').onclick=()=>action('scope');$('swap-button').onclick=()=>action('next');
 function effect(e){if(e.type==='shot'&&e.hit){lastHit=performance.now()+180;$('hit-confirm').classList.toggle('critical',!!e.critical);}if(e.type==='loot')api.toast(`Recovered ${e.credits} credits${e.weapon?' and '+WEAPONS[e.weapon].name:''}.`);if(e.type==='purchase')api.toast('Equipment updated. Saved for this expedition.');}
 function update(dt){const s=api.state(),w=weaponStats(s),xr=api.xr();s.p.scoped=api.playing()&&!api.paused()&&aimSources.size>0;
  $('scope-view').hidden=!(s.p.scoped&&w.id==='sniper'&&!xr);$('hit-confirm').hidden=performance.now()>lastHit||api.paused();
  $('credits-value').textContent=s.kit.credits;const depot=depotNear(s);$('buy-button').textContent=depot?'B · '+depot.name:'B · Find outfitters';
  $('equipment-name').textContent=w.name.toUpperCase();$('ammo').innerHTML=String(s.p.ammo).padStart(2,'0')+` <i>/ ${w.id==='arc'?'∞':s.kit.reserve[w.id]}</i>`;$('weapon-status').textContent=s.p.reload>0?'RELOADING…':`${w.role} · R reload`;
  if(!xr){const base=api.settings.fov,zoom=s.p.scoped?w.zoom:1,fov=Math.atan(Math.tan(base*Math.PI/360)/zoom)*360/Math.PI;api.view.camera.fov+=(fov-api.view.camera.fov)*Math.min(1,dt*16);api.view.camera.updateProjectionMatrix();}
  for(const b of weapons.children){const owned=s.kit.owns.includes(b.dataset.weapon);b.disabled=!owned;b.classList.toggle('selected',b.dataset.weapon===s.p.weapon);}
  if(s.p.weapon!==previousWeapon){previousWeapon=s.p.weapon;$('scope-label').textContent=w.name.toUpperCase()+' / 4×';}
  const target=railTarget(s);$('transfer-help').hidden=!(s.p.rail||!s.p.grounded&&s.p.lastRail);$('transfer-help').textContent=target?(s.p.rail?'JUMP → LOOK → E: ':'E: CATCH ')+target.rail.name+' · '+target.distance.toFixed(1)+' m':'FREE LOOK · SPACE releases with momentum · aim toward a highlighted line';
  if(dialog.open&&lastShop!==s.p.weapon+':'+s.kit.credits)stock();
 }
 return {action,scope,reset,update,effect};
}
