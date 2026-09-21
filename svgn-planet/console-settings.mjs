/* Existing DOM actions are the input model; WebXR renders their native meshes. */
export function mountConsoleSettings({xr,open,back,doc=document}){
 const d=doc.createElement('dialog');d.id='xr-console-dialog';
 d.innerHTML=`<h2>Spatial UI / Neighborhood Missions</h2><p>Menus belong to the floor console or your controller, never to your head. The off-hand upper button or a raised pinch opens them. Point at the floor disc and select to summon. The card appears when you raise your free hand. Floor placement is estimated when floor tracking is unavailable.</p><button id="console-back" data-pad-default data-pad-back>Back / resume</button><label for="console-mount">Menu mount</label><select id="console-mount"><option value="floor">Floor rotunda</option><option value="controller">Free-hand controller</option></select><label for="console-height">Height above floor</label><input id="console-height" type="range" min="0.35" max="1.5" step="0.05"><label for="console-distance">Distance</label><input id="console-distance" type="range" min="0.55" max="1.5" step="0.05"><label for="console-size">Panel size</label><input id="console-size" type="range" min="0.45" max="1" step="0.05"><label for="console-hud">Compact objective and map</label><select id="console-hud"><option value="wrist">Raise free hand to view</option><option value="floor">Look down at floor card</option><option value="off">Off (menus still available)</option></select><label><input id="console-motion" type="checkbox">Animate console rise</label><label><input id="console-triggerDrive" type="checkbox">Action profile: primary trigger drives vehicles</label><p>Driving: primary trigger holds speed, off-hand grip brakes. On foot, trigger still strikes/uses the aimed tool. Uncheck to retain movement-stick-click driving.</p><button id="console-place">Place console here</button><p id="console-feedback" role="status"></p>`;
 doc.body.append(d);const $=id=>doc.getElementById(id);
 for(const key of ['mount','height','distance','size','hud','motion','triggerDrive']){
  const el=$('console-'+key),value=xr.consolePreferences[key];if(el.type==='checkbox')el.checked=value;else el.value=value;
  const apply=()=>{try{xr.consolePreference(key,el.type==='checkbox'?el.checked:el.type==='range'?Number(el.value):el.value);$('console-feedback').textContent=xr.inspect().console.storageBlocked?'Applied for this session; existing saved data retained.':'Console preference saved.';}catch(e){$('console-feedback').textContent=e.message;}};
  el.addEventListener(el.type==='range'?'input':'change',apply);
 }
 $('console-back').onclick=back;$('console-place').onclick=()=>xr.recenterConsole();
 d.addEventListener('cancel',e=>{e.preventDefault();back();});
 for(const parent of ['pause-dialog','ward-menu','xr-mode-dialog']){
  const button=doc.createElement('button');button.id=parent+'-spatial-ui';button.textContent='Spatial UI / floor and controller';button.onclick=()=>open(d.id);$(parent)?.append(button);
 }
}
