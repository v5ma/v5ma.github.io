"""Keep the art layer valid for edited levels and restore the original editor scene."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
game=root/'mario-maker-clone/svgn-paper-route'
p=game/'cloudview-world.js';s=p.read_text()
s=s.replace('api=m;world=new m.THREE.Group();', 'restore();api=m;world=new m.THREE.Group();') if 'restore();api=m;' not in s else s
old="const data=window.__sky?.state.data||SkyRoutes.build(Math.max(0,window.__delivery?.state.route||0),__gameRefs.T);"
new="""const source=live()?window.__sky.state.data:SkyRoutes.build(Math.max(0,window.__delivery?.state.route||0),__gameRefs.T);
    // Custom copies can move targets or omit the campaign-only cells/boxes.
    // Build visuals from the authoritative grid, not stale campaign metadata.
    const data={...source,width:live()?LW:source.width,cells:live()?playGrid:source.cells,boxes:[],goal:null};
    for(let k=0;k<data.cells.length;k++){
      const id=data.cells[k],x=k%data.width,y=Math.floor(k/data.width);
      if(id===__gameRefs.T.MAILBOX||id===__gameRefs.T.MAILDONE)data.boxes.push({x,y});
      if(id===__gameRefs.T.GOAL)data.goal={x,y};
    }"""
s=s.replace(old,new)
s=s.replace('if(!api||!world?.parent)return;', 'if(!api)return;\n    if(!world?.parent){restore();api.scene.fog=null;return;}')
p.write_text(s)
p=root/'tests/cloudview_visual.py';s=p.read_text()
if 'Edited sky copy can still be played' not in s:
    s=s.replace("        check(not errors,'No uncaught JavaScript errors in the art and input flow')", """        # Copy mode has different metadata from the campaign. The renderer must
        # use the actual grid and restore the old lights when leaving a route.
        page.locator('#sky-edit-copy').click()
        page.wait_for_function('mode===\"edit\"')
        page.screenshot(path=str(OUT/'cloudview-editor.png'),timeout=60000)
        page.locator('#btnPlay').click();page.locator('#cv').focus()
        page.wait_for_function('__sky.active()&&__cloudview.courier.visible',timeout=60000)
        check(page.evaluate('__cloudview.stats.mailboxes===routeTotal'),'Edited sky copy can still be played with its actual delivery targets')
        start_x=page.evaluate('player.x');page.keyboard.down('KeyD')
        try:page.wait_for_function('(x)=>Math.abs(player.x-x)>20',arg=start_x,timeout=20000)
        finally:page.keyboard.up('KeyD')
        check(page.evaluate('Math.abs(player.x-'+str(start_x)+')>20'),'Edited copy retains ordinary control input')
        check(not errors,'No uncaught JavaScript errors in the art and input flow')""")
p.write_text(s)
print('Cloudview supports actual custom grids and restores editor lighting.')
# Final visual balance: preserve the sky-city detail instead of washing it out,
# and remove the blue halos seen around the first cloud texture draft.
p=game/'cloudview-world.js';s=p.read_text()
s=s.replace("'cloudview-20260904-2'", "'cloudview-20260904-3'")
s=s.replace("1050,2600", "1400,3700")
s=s.replace("grad.addColorStop(0,'#fffffffa');grad.addColorStop(.54,'#fbffffee');grad.addColorStop(.8,'#def1fadd');grad.addColorStop(1,'#c6e5f600')", "grad.addColorStop(0,'#fffffffc');grad.addColorStop(.56,'#fffffff2');grad.addColorStop(.83,'#ffffffc9');grad.addColorStop(1,'#ffffff00')")
s=s.replace("y=104+rnd(k+variant*13+7)*70", "y=150-Math.sin((x-75)/360*Math.PI)*48+rnd(k+variant*13+7)*30")
s=s.replace("night?'#bed4e7':'#a5d6fa'", "night?'#bed4e7':'#8dccfa'")
s=s.replace("goldSector?'#fff6a6':'#c9f7ff'", "goldSector?'#fff6a6':'#64e4ff'")
p.write_text(s)
