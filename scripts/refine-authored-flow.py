"""Apply the reviewed native-entry and sightline corrections once, scoped to this game."""
from pathlib import Path
r=Path(__file__).resolve().parents[1];g=r/'mario-maker-clone/svgn-paper-route'
p=g/'phrase-data.js';s=p.read_text();s=s.replace('"x":340,"y":2075,"heading":0,"ops":[{"line":600}', '"x":500,"y":2075,"heading":0,"ops":[{"line":440}');p.write_text(s)
p=g/'phrase-layout.js';s=p.read_text().replace('x:280,y:1690,w:950','x:300,y:1690,w:930');p.write_text(s)
p=g/'phrase-playback.js';s=p.read_text()
if 'function enter(paths' not in s:
 extra=""" function enter(paths,{entry='m0',speed=7.5,offset=190,ground=2160,jump=-13,gravity=.55,maxTicks=100}={}){
  const rails=compile(paths),tr=rails.find(t=>t.sky.id===entry);if(!tr)throw Error('Missing route entrance');
  const p={w:26,h:30,x:tr.pts[0][0]-offset,y:ground-30,vx:speed,vy:jump,trackCD:0,_airTicks:0,onGround:false,roll:0};
  const trace=[[p.x+13,p.y+15]];
  for(let tick=1;tick<=maxTicks;tick++){
   const old={x:p.x,y:p.y},a=[p.x+13,p.y+15];p.vy=Math.min(13,p.vy+gravity);p.x+=p.vx;p.y+=p.vy;p._airTicks++;
   const hit=K.catchRail(p,old,rails),b=[p.x+13,p.y+15];trace.push(b);
   const contact=sweepBody(a,b,rails);
   if(contact)return {success:false,to:'body-blocked',contact,trace,ticks:tick,speed,offset};
   if(hit)return {success:hit.tr.sky.id===entry,to:hit.tr.sky.id,state:p,trace,ticks:tick,speed,offset};
   if(p.y+p.h>=ground)return {success:false,to:'road',trace,ticks:tick,speed,offset};
  }return {success:false,to:'timeout',trace,speed,offset};
 }
"""
 s=s.replace(' function run(paths,',extra+' function run(paths,').replace('const api={compile,','const api={enter,compile,')
p.write_text(s)
p=g/'phrase-runtime.js';s=p.read_text()
if 'state.input.push' not in s:
 s=s.replace('branch:null}', 'branch:null,input:[]}')
 s=s.replace(' const step=stepPlayer;',""" window.addEventListener('keydown',e=>{if(active()&&['Space','KeyZ'].includes(e.code)&&!e.repeat){state.input.push({code:e.code,x:player.x,y:player.y,step:__ground.state.steps,focus:e.target.tagName,target:__grapple.state.target?{x:__grapple.state.target.x,y:__grapple.state.target.y}:null});if(state.input.length>80)state.input.shift();}},true);
 const step=stepPlayer;""")
p.write_text(s)
p=g/'sky-network-art.js';s=p.read_text();a="   far.box(x,-ground+220,z,12,440,16,'#637b7c');far.rod([x,-ground+360,z],[x+240,y-70,z],5,'#7a938d');"
if a in s:s=s.replace(a,"   if(course.gp.flowPlan?.version!==2){"+a.strip()+"}")
p.write_text(s)
p=r/'tests/phrase_browser.py';s=p.read_text();s=s.replace('hooks:__grapple.state.hooks,releases:__grapple.state.releases}', 'hooks:__grapple.state.hooks,releases:__grapple.state.releases,input:__phrases.state.input,whipEvents:__grapple.state.events,held:keys.KeyZ,target:__grapple.state.target,focus:document.activeElement.tagName}')
s=s.replace('player.x>=245','player.x>=280').replace('player.track.len-player.trackS<200','player.track.len-player.trackS<150')
s=s.replace("page.wait_for_function('player.x>=4480&&__grapple.state.target',timeout=90000);page.keyboard.down('KeyZ');", "page.wait_for_function('player.x>=4480&&__grapple.state.target',timeout=90000);print('CAST READY',json.dumps(snapshot(page)),flush=True);page.locator('#cv').focus();page.keyboard.down('KeyZ');")
s=s.replace("if page.locator('#stay-results').is_visible()", "if page.locator('#stay-results').count() and page.locator('#stay-results').is_visible()")
p.write_text(s)
p=r/'tests/phrase_flow.test.cjs';s=p.read_text();s=s.replace("const seeds=F.entrySamples(rails.find(r=>r.sky.id===entry),rails,env);assert.equal(seeds.length,entry==='e2'?12:18);", "const seeds=[6,7.5,9].flatMap(speed=>[110,130,150,170,190,210].map(offset=>H.enter(P,{entry,speed,offset})));assert.equal(seeds.length,18);assert.ok(seeds.every(s=>s.success),'The entire entry window must clear the front and underside of the ramp');")
if 'Road-entry checks reject late front impacts' not in s:s=s.replace("test('Exported native course", "test('Road-entry checks reject late front impacts and jumps that end before the ramp',()=>{const late=H.enter(P,{entry:'m0',speed:9,offset:30});assert.equal(late.to,'body-blocked');const early=H.enter(P,{entry:'m0',speed:6,offset:370});assert.equal(early.success,false);});\ntest('Exported native course")
s=s.replace('Road entry uses the declared platform model, not a browser.','Road entry uses the declared platform model with thick-road collision checks, not a browser.');p.write_text(s)
print('Entry approach extended without moving the launch lip; thick-body entry tests and unobstructed curl sightlines installed.')
