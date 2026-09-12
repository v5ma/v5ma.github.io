from pathlib import Path
D=Path(__file__).resolve().parents[1]/'dino-atlas'
def edit(name,old,new):
 p=D/name;s=p.read_text()
 if new in s:return
 assert old in s,(name,old[:80]);p.write_text(s.replace(old,new))
edit('index.html','WILD FRONTIER / SPECTACLE & TRADE','WILD FRONTIER / RANCH &amp; COAST')
edit('frontier-world-expanded.js',"import {makeJeep} from './ranger-art.js';", "import {makeJeep,label,box} from './ranger-art.js';")
edit('frontier-world-expanded.js', "points:[[-150,42],[-105,38],[-56,70],[-20,103],[45,114],[100,157],[155,150],[205,100]]", "points:[[-184,151],[-214,84],[-178,42],[-117,43],[-66,19],[-5,62],[-15,106],[-58,203],[-126,202]]")
edit('frontier-world-expanded.js', "points:[[205,-138],[174,-86],[137,-32],[89,-38],[37,-24],[-5,-82],[-70,-108],[-89,-76]]", "points:[[224,-130],[176,-67],[135,-18],[88,-38],[31,-26],[60,-157],[70,-222],[110,-233],[196,-204]]")
edit('frontier-world-expanded.js', "points:[[-55,-214],[-4,-206],[49,-216],[105,-203],[151,-170],[195,-145],[217,-89],[224,-24],[208,37]]", "points:[[214,108],[160,91],[93,53],[35,48],[57,113],[105,190],[157,160]]")
edit('frontier-world-expanded.js', "const curve=new T.CatmullRomCurve3(r.points.map", "const sign=label(r.name.toUpperCase()+' / A CONTACT',11,1);const badge=new T.Sprite(new T.SpriteMaterial({map:sign.material.map,depthWrite:false}));badge.position.set(0,5,0);badge.scale.set(11,1,1);model.add(badge);const cargo=new T.Group();for(const x of [-.5,.5])box(cargo,0xb69b67,x,1.8,-1, .8,.65,.8);model.add(cargo);\n  const curve=new T.CatmullRomCurve3(r.points.map")
edit('frontier-world-expanded.js', 'rivals.push({...r,model,curve,lamp,halo,near:false,index:i,deliveries:0', 'rivals.push({...r,model,curve,lamp,halo,cargo,badge,near:false,index:i,deliveries:0')
edit('frontier-world-expanded.js','u=unloading?.995:local/(period-10)', 'u=unloading?0:local/(period-10)')
edit('frontier-world-expanded.js', "r.status=(unloading?'Unloading: ':'Transporting: ')+jobs[r.index];", "r.cargo.visible=!unloading;r.badge.visible=Math.hypot(player.x-p.x,player.z-p.z)<55;r.status=(unloading?'Unloading: ':'Transporting: ')+jobs[r.index];")
edit('ranch-game.js',"if(this.s.bones.length===3){this.s.crewScore.fossilworks++;", "if(this.s.bones.length===3&&!this.s.rewards.includes('bones')){this.s.crewScore.fossilworks++;")
edit('ranch-game.js',"end={x:target.x,y:target.collisionHeight*.5,z:target.z};this.mark(t.id);", "end={x:target.x,y:target.collisionHeight*.5,z:target.z};this.markOnce(t.id);")
# Software-rendered acceptance uses the game's supported low preset, not mocked graphics.
edit('tests/ranch-browser.py', 'context.add_init_script(PAD);page=context.new_page();', '''context.add_init_script(PAD);context.add_init_script("try{if(!localStorage.getItem('dino-atlas.frontier.v2'))localStorage.setItem('dino-atlas.frontier.v2',JSON.stringify({version:2,settings:{low:true}}));}catch{}")
  page=context.new_page();''')
edit('tests/ranch-browser.py', "snap('05-roundup-assignment.png');choose('race')", '''snap('05-roundup-assignment.png')
   before=page.evaluate('__dinoEconomy.state.credits');page.evaluate('__dinoRanger.teleport(-48,203)');wait('document.getElementById("interact-label").textContent.includes("Manage Crest")');press(0);wait('document.getElementById("pen-dialog").open')
   page.evaluate('document.getElementById("pen-feed").focus()');press(0);press(1);press(13)
   wait('__dinoRanch.state.task.done===4',90000);press(0);wait('document.getElementById("pen-dialog").open');page.evaluate('document.getElementById("pen-gate").focus()');press(0);press(1)
   wait('__dinoRanch.state.activity===null',30000)
   check(page.evaluate('__dinoEconomy.state.credits')==before+650,'A real horn-and-feeder roundup returns four strays through the gate and pays 650 credits')
   choose('race')''')
(D/'RANCH-COAST.md').write_text('''# Dino Atlas: Ranch and Coast

The existing reserve, 64 residents, 30 species, old journal, enclosures and saved economy are retained.

Start the game for a guided shift. Menu > Dispatch and guided lessons can resume the ten task-based lessons or select free exploration. The current task and exact controls appear on the main HUD.

Water now reaches 38 m and displays a thick stream, droplets and response halos. The zapper reaches 32 m, interrupts charges for longer, and can arc to two nearby animals with line-of-sight checks. The 42 m horn affects predators as well as herbivores, with orange expanding waves. Closed pen boundaries still block herding.

Crest Meadow has a repeatable four-resident roundup with a live home count, elapsed time, saved personal best and 650-credit reward. Staging the exercise does not erase historical containment completion.

The island land diameter is 840 m, up from 620 m, with an ocean ring and a navigable west channel connecting the original wetland. Four marked harbors support boarding and disembarking. Coastal Circuit is an ordered 24-buoy time trial, with saved best times and gold, silver and bronze finishes. Pausing stops the race clock. Offshore salvage requires collecting three crates by boat and delivering them to East Freight Pier for 900 credits.

Three original building complexes have physical roof landing slabs, railings, narrow ground entrances, atria, mezzanine galleries, stairs and maintenance lifts. The helicopter may land on the roofs and the ranger can exit and reboard there. Three interior archives require going on foot and award 400 credits each. Three new boneyards form a 900-credit foot-survey assignment.

Crews have visible cargo and contact labels, scheduled unloading stops, delivery counts and concrete effects: Meridian replenishes Armored Valley, FossilWorks supplies the Mesa market, and Greenline supplies coastal freight. These are scripted service crews, not full autonomous rival combat AI.

Only three adult model lengths are newly calibrated: Diplodocus 26 m, Tyrannosaurus 12 m and Triceratops 9 m, using Natural History Museum reference lengths. Nursery scaling remains smaller. Shapes, gaits and collision bodies remain stylized; the other 27 species are not claimed to be anatomically or dimensionally calibrated.

Scale references:
https://www.nhm.ac.uk/discover/dino-directory/diplodocus.html
https://www.nhm.ac.uk/discover/dino-directory/tyrannosaurus.html
https://www.nhm.ac.uk/discover/dino-directory/triceratops.html

Tests use Node and real Rapier physics, plus native Chromium HTTP/WebGL with synthetic standard Xbox input. Position fixtures place the player near distant test activities, but the tested actions and interior corridor walking use ordinary controller inputs. The full ocean lap is tested with the real boat physics. Physical controllers, physical phones, sound hardware and real GPU performance are not claimed to have been tested.
''')
print('Visible crew deliveries and reward polish applied.')
