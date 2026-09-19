"""Extend the existing native recovery journey without duplicating its assertions.
Only the hardware facade is changed: native-style getters, passive sensors,
raw buttons and native select events. No gameplay or progression assignments.
"""
from pathlib import Path
base=Path(__file__).with_name('xr-recovery-browser.py')
source=base.read_text()
marker="  check(page.evaluate('document.hidden&&SkyCycleXR.inputVisible'),'A visible immersive session is independent of HTML visibility and focus')"
assert source.count(marker)==1, 'The base recovery journey changed; reconcile the button matrix explicitly.'
extra='''
  # Getter-backed pads with active contact/proximity slots, not six plain buttons.
  page.evaluate("""()=>{for(const source of xrEmulator.session.inputSources){
    const old=source.gamepad,buttons=old.buttons;
    while(buttons.length<12)buttons.push({pressed:true,touched:true,value:1});
    source.gamepad=Object.create({get buttons(){return buttons;},get axes(){return old.axes;},get mapping(){return 'xr-standard';}});
  }}""");frames()
  check(page.evaluate('SkyCycleXR.diagnostics.controllerInputs.every(p=>p.buttons.length===12 && p.buttons[6].value===1)'), 'Both getter-backed controllers expose active passive sensors during the real journey')
  def seek(label,hand='right'):
   for _ in range(40):
    if page.evaluate('(s)=>SkyCycleXR.diagnostics.buttons.some(b=>b.label.includes(s))',label):break
    point(' - Next');page.evaluate("xrEmulator.select('start');xrEmulator.select('end')");frames()
   page.evaluate('([s,h])=>xrEmulator.point(s,h)',[label,hand]);frames(2)
  page.evaluate("xrEmulator.button('left',1,false);xrEmulator.button('right',1,false)");frames()
  for hand in ['left','right']:
   before=page.evaluate('SkyCycleXR.diagnostics.focusedButton')
   press(1,hand)
   check(page.evaluate('SkyCycleXR.diagnostics.menuInput.last')==hand+' grip' and page.evaluate('SkyCycleXR.diagnostics.focusedButton')!=before, hand+' grip moves the visible menu selection')
  for hand,button,backhand in [('right',4,'left'),('left',4,'right')]:
   seek('Sound & music',hand);press(button,hand)
   check(page.evaluate('document.getElementById("score-dialog").open'), ('A' if hand=='right' else 'X')+' activates the real Sound menu with passive sensors active')
   capture(KIND+'-'+('A' if hand=='right' else 'X')+'-sound-menu')
   press(5,backhand);frames(8)
   check(page.evaluate('!document.getElementById("score-dialog").open && __delivery.paused'), ('Y' if backhand=='left' else 'B')+' closes one nested menu without cascading')
  for hand in ['left','right']:
   seek('Sound & music',hand)
   count=page.evaluate('SkyCycleXR.diagnostics.menuInput.actions')
   page.evaluate('(h)=>xrEmulator.button(h,0,true)',hand);frames(8)
   check(page.evaluate('document.getElementById("score-dialog").open'), hand+' raw trigger opens the real menu even without a select event')
   page.evaluate('(h)=>xrEmulator.select("start",h)',hand);frames(4)
   check(page.evaluate('SkyCycleXR.diagnostics.menuInput.actions')==count+1, hand+' delayed select event does not duplicate the sampled trigger press')
   page.evaluate('(h)=>{xrEmulator.button(h,0,false);xrEmulator.select("end",h)}',hand);frames();press(5)
  # Preserve the earlier held-grip/head-pose recovery and every existing assertion.
  page.evaluate("xrEmulator.button('left',1,true);xrEmulator.button('right',1,true)");frames()
'''
source=source.replace(marker,marker+extra)
marker="  check(True,'Ordinary riding advances while the HTML page is hidden')"
assert source.count(marker)==1
source=source.replace(marker,marker+'''
  # A select event with no visible/captured UI must not swallow ordinary inputs.
  for hand,key in [('right','KeyC'),('left','KeyX')]:
   page.evaluate('(h)=>{xrEmulator.button(h,0,true);xrEmulator.select("start",h)}',hand);frames(8)
   check(page.evaluate('(key)=>keys[key]&&!__delivery.paused&&!SkyCycleXR.diagnostics.uiVisible',key), hand+' trigger reaches the original gameplay input when no UI captures it')
   page.evaluate('(h)=>{xrEmulator.button(h,0,false);xrEmulator.select("end",h)}',hand);frames()
   check(page.evaluate('(key)=>!keys[key]',key), hand+' gameplay trigger releases without a stuck action')
''')
source=source.replace("'coverage':'Actual game/renderer", "'coverage':'All face buttons, both grips and triggers; getter-backed twelve-slot pads and active passive sensors; actual game/renderer")
exec(compile(source,str(base),'exec'),{'__file__':str(base),'__name__':'__main__'})
