"""Real bundled-Three object/input-lifecycle fixtures. No GPU draw or gameplay certification."""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'test-output/courier-lantern-objects';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 opts={'headless':True,'args':['--no-sandbox']}
 if os.getenv('CHROMIUM_PATH'):opts['executable_path']=os.environ['CHROMIUM_PATH']
 b=p.chromium.launch(**opts);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content('<select id="handedness"><option value="left">left</option><option value="right">right</option></select><select id="locomotion"><option value="teleport">teleport</option></select><select id="goldwind-shield"><option value="trigger">trigger</option></select><fieldset id="fieldkit-controls"></fieldset>')
 page.add_script_tag(path=str(ROOT/'vesperfall/vendor/aframe-1.8.0.min.js'))
 page.add_script_tag(path=str(ROOT/'vesperfall/courier-lantern-model.js'))
 page.evaluate("""()=>{
 const T=AFRAME.THREE,counts={cancel:0,xr:0,interact:0,pad:0,remove:0};window.counts=counts;
 window.WayfinderModel={goal:()=>({text:'Relay',point:[0,4,-20]}),aimed:()=>true};window.PilgrimageModel={};window.ReturningBellModel={};
 window.PilgrimKitModel={visible:()=>true};window.FieldworkModel={target:()=>null};window.VesperInput={deadzone:n=>n};
 window.VesperCore={sub:(a,b)=>a.map((v,i)=>v-b[i]),len:a=>Math.hypot(...a)};
 const scene=new T.Scene(),head=new T.Object3D();head.position.set(0,1.65,0);scene.add(head);const session={visibilityState:'visible',inputSources:[]};window.session=session;
 const hands={};for(const name of['left','right']){const object=new T.Object3D();object.position.set(name==='left'?-.3:.3,1.2,-.3);scene.add(object);hands[name]={object,source:{id:name},p:object.position.toArray(),q:new T.Quaternion(),buttons:Array(6).fill(false),axes:[0,0,0,0]};}
 window.g={T,scene:{object3D:scene,renderer:{xr:{getSession:()=>session}}},head:{object3D:head},hands,game:{phase:'playing',p:[0,0,0],head:[0,1.65,0]},running:true,paused:false,xr:false,practice:false,threshold:{state:{phase:'game'}},latch:{drawing:false,reset(){}},fieldKit:{state:{held:null},padInput(){counts.pad++;return false;}},fieldwork:{state:{held:null}},goldwind:{state:{quiver:false,flight:false},gesture:{held:false},enabled:()=>true,reset(){}},ritual:{state:{pull:null},focus:{open:false}},arsenal:{ward(){}},wayfinder:{current:()=>null},
  makePanel(w,h,width,height){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const texture=new T.CanvasTexture(canvas),mesh=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:texture}));return {canvas,ctx:canvas.getContext('2d'),texture,mesh};},
  cancel(){counts.cancel++;},setPaused(value){this.paused=value;this.cancel();},processXR(){counts.xr++;},tracked(){for(const h of Object.values(hands)){h.p=h.object.position.toArray();h.q.copy(h.object.quaternion);}},interact(){counts.interact++;},visuals(){},toast(text){this.message=text;},remove(){counts.remove++;},walkInput(){},turn(){}
 };
 window.neutral=()=>{for(const h of Object.values(hands))h.buttons.fill(false);g.processXR(.01,head.position);g.processXR(.01,head.position);g.processXR(.01,head.position);};
 }""")
 page.add_script_tag(path=str(ROOT/'vesperfall/courier-lantern.js'))
 result=page.evaluate("""()=>{
 const checks=[];function check(ok,text){if(!ok)throw Error(text);checks.push(text);}
 const a=CourierLantern.install(g),T=g.T,sibling=new T.Group();g.scene.object3D.add(sibling);
 check(CourierLantern.install(g)===a,'Installation is idempotent');g.visuals();
 check(!a.held.visible&&a.light.intensity===0,'The reusable lantern starts stowed and dark');
 const before=JSON.stringify(g.game),type=g.game.type;a.toggle();g.visuals();
 check(a.held.visible&&a.light.intensity===2,'Desktop toggle displays the guide and one bounded virtual light');
 check(a.panel.mesh.parent===a.held&&a.light.parent===g.scene.object3D,'The card is object-local; the zero-intensity light stays in the shader light set');
 check(JSON.stringify(g.game)===before,'Reading guidance changes no expedition state');
 const buttons=Array(17).fill(false);buttons[4]=buttons[12]=true;check(g.fieldKit.padInput(buttons,i=>i===12),'LB+Up is consumed as a direct lantern shortcut');
 g.visuals();check(!a.held.visible,'The Xbox chord stows without changing the arrow or opening a journal');
 g.xr=true;neutral();g.visuals();const hand=g.hands.right;hand.object.position.copy(a.point);g.tracked();const n=counts.xr;
 hand.buttons[1]=true;g.processXR(.01,g.head.object3D.position);g.visuals();
 check(a.state.held&&a.held.visible&&!a.belt.visible,'A fresh grip at the forward waist handle acquires the actual lantern');
 check(counts.xr===n,'The acquisition grip is not forwarded to flask, bow or disk input');
 g.wayfinder.current=()=>({label:'Operate fixture mechanism',point:[0,1.2,-.6]});hand.buttons[0]=true;g.processXR(.01,g.head.object3D.position);g.processXR(.01,g.head.object3D.position);
 check(counts.interact===1&&a.state.uses===1,'A held trigger invokes the original nearby interaction only on its fresh edge');
 hand.buttons[0]=false;hand.buttons[1]=false;g.processXR(.01,g.head.object3D.position);g.visuals();
 check(!a.state.held&&a.light.intensity===0,'Grip release stows without throwing or spending supplies');
 neutral();hand.object.position.copy(a.point);hand.buttons[1]=true;g.processXR(.01,g.head.object3D.position);session.visibilityState='hidden';g.processXR(.01,g.head.object3D.position);g.visuals();
 check(!a.state.held,'Visibility loss cancels a carried lantern');session.visibilityState='visible';neutral();g.visuals();hand.object.position.copy(a.point);hand.buttons[1]=true;g.processXR(.01,g.head.object3D.position);g.arExpedition=true;g.visuals();
 check(a.held.visible&&a.light.intensity===0,'AR retains the compact carried guide but never lights the real room');
 g.setPaused(true);g.visuals();check(!a.held.visible&&!a.belt.visible,'Pause hides and stows both equipment representations');
 check(JSON.stringify(g.game)===before,'Fixture lifecycle creates no save field, consumable, reward or progress');
 g.remove();check(counts.remove===1&&g.scene.object3D.children.includes(sibling)&&!g.scene.object3D.children.includes(a.group)&&!g.scene.object3D.children.includes(a.light),'Removal releases only owned objects and chains the host lifecycle');
 return {passed:checks.length,checks,three:T.REVISION,scope:'Real Three objects and fake host/input collaborators. No GPU draw, native mission or physical controller approval.'};
 }""")
 assert not errors,errors
 result['errors']=errors;(OUT/'report.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2));b.close()
