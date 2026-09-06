/* Passive route-reading cues and camera composition for the authored chapter.
 * No controls, score, attachment, player position or velocity are written. */
(function(){'use strict';
 const active=()=>window.__ground?.active()&&__ground.meta?.flowRoutes?.version===3;
 const render=window.render;window.render=function(){render();if(!active()||won||__delivery.state.menu||RouteWorkshop.active||__delivery.state.route!==4)return;
  const p=player,t=p.track,id=t?.sky.id,remaining=t?t.len-p.trackS:0;let text=null;
  if(id==='m4')text=remaining<150?'FORK: BRAKE NOW FOR THE CANAL / KEEP THROTTLING FOR THE HIGH HOOK':'CANAL FORK AHEAD: THE LAST GOLD LIP OFFERS A LOWER LINE';
  else if(id==='m6'||id==='m7')text='FOLLOW THE CURL LEFT; THE CRADLE TURNS YOU BACK RIGHT';
  else if(id==='b0')text='LOWER LINE: REBUILD SPEED THROUGH THE CANAL COLLECTOR';
  else if(id==='m9')text='ORCHARD SHELF: A BREATHER BEFORE THE DOWNHILL RETURN';
  else if(id==='e2')text='RE-ENTRY: THE ROAD CONNECTS BACK INTO THE CANAL LINE';
  else if(id==='e4')text='RE-ENTRY: BUILD MOMENTUM FOR THE UNDERSIDE OF THE LOWER SWOOP';
  else if(id==='b2'&&p._railFace===-1)text='UNDERSIDE LINE: KEEP YOUR MOMENTUM, THEN LAND ON THE FESTIVAL GLIDE';
  else if(id==='m8')text='FOLLOW THE DOWNHILL SWOOP TO THE FESTIVAL FINISH';
  if(text)document.getElementById('cloud-flight-label').textContent=text;
 };
 // Pair an open curl with the catcher below rather than hiding the next step.
 let source=null;const camera=CloudDepthCamera.forFrame;
 CloudDepthCamera.forFrame=function(o,v){const c=camera(o,v);if(!active()||!c.isPerspectiveCamera){source=null;return c;}
  const target={x:player.x+13+Math.max(-160,Math.min(210,player.vx*12)),y:-player.y+Math.max(-110,Math.min(100,-player.vy*6))};
  if(!source||Math.abs(source.x-target.x)>650||Math.abs(source.y-target.y)>450)source={...target};else{source.x+=(target.x-source.x)*.16;source.y+=(target.y-source.y)*.16;}
  const height=__network.wide?1550:Math.max(860,Math.min(1080,v.h*1.03));c.fov=Math.atan(height/2/835)*360/Math.PI;c.position.set(source.x+205,source.y+125,800);c.lookAt(source.x,source.y,0);c.updateProjectionMatrix();c.updateMatrixWorld();
  const sky=__network.backdrop;if(sky){const T=__merged.THREE,dir=new T.Vector3();c.getWorldDirection(dir);const d=5000,h=Math.tan(c.fov*Math.PI/360)*d;sky.position.copy(c.position).addScaledVector(dir,d);sky.quaternion.copy(c.quaternion);sky.scale.set(h*2*c.aspect*1.1/sky.geometry.parameters.width,h*2*1.1/sky.geometry.parameters.height,1);sky.updateMatrixWorld(true);}
  return c;
 };
 const button=document.createElement('button');button.id='flow-previous-layout';button.textContent='Previous dense sky layout';button.title='Load the previous Sunrise Borough geometry as an editable copy.';
 document.querySelector('#route-workshop .maker-library details')?.append(button);
 button.onclick=()=>{if(RouteWorkshop.state.dirty&&!confirm('Replace this draft with the previous layout? Save or export your changes first.'))return;RouteWorkshop.open(GroundCampaign.encode(FlowRoutes.previous(0,T)));};
 window.__flowRoutes={active,version:3};
})();
