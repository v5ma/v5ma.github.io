from pathlib import Path
import json
P=Path(__file__).resolve().parents[1]
marker=P/'homecoming-polish.json'
if marker.exists():
 print('Homecoming polish already applied.');raise SystemExit(0)
def edit(n,a,b):
 p=P/n;s=p.read_text();assert a in s,(n,a[:90]);p.write_text(s.replace(a,b))
edit('homecoming-view.mjs',' batchStatic(tables);batchStatic(gardens);'," const architecture=new T.Group();for(const child of [...stat.children])if(child.isMesh){stat.remove(child);architecture.add(child);}stat.add(architecture);batchStatic(architecture);\n const personStatic=new T.Group();for(const child of [...maya.children])if(child.isMesh&&child!==label){maya.remove(child);personStatic.add(child);}maya.add(personStatic);batchStatic(personStatic);\n batchStatic(tables);batchStatic(gardens);")
edit('homecoming-view.mjs',"authoredPlaza:true,flags:","authoredPlaza:true,batchedArchitecture:true,flags:")
edit('tests/coastal_browser_release.py',"await page.wait_for_timeout(1000);await page.evaluate('__pad.axes[2]=0')","await page.wait_for_function('SVGNPlanet.inspect().render.cameraOrbit<-.35',timeout=90000);await page.evaluate('__pad.axes[2]=0')")
edit('tests/coastal_browser_release.py','for _ in range(80):','for _ in range(300):')
edit('tests/coastal_browser_release.py',"if s['time']-t0>=13:break","if s['time']-t0>=8:break")
edit('tests/coastal_browser_release.py',"assert samples and min(samples)>29.75,","assert s['time']-t0>=8 and samples and min(samples)>29.75,")
edit('tests/coastal_browser_release.py',"await page.wait_for_timeout(1200);await page.evaluate(\"__pad.buttons[6]={pressed:false,touched:false,value:0}\")","await page.wait_for_function('SVGNPlanet.inspect().speed<.04',timeout=90000);await page.evaluate(\"__pad.buttons[6]={pressed:false,touched:false,value:0}\")")
edit('tests/coastal_browser_release.py',"await page.wait_for_timeout(500);assert (await state())['paused'];ok('Controller disconnect pauses the game')","await page.wait_for_function('SVGNPlanet.inspect().paused',timeout=90000);assert (await state())['paused'];ok('Controller disconnect pauses the game')")
# Direct camera setup is only for the visual review, not a fabricated gameplay result.
edit('tests/homecoming_browser.py',"await press(9);await page.add_style_tag(content='dialog[open]{opacity:0!important}","await page.evaluate('__pad.axes[2]=.9');await wait('SVGNPlanet.inspect().render.cameraOrbit<-2.20');await page.evaluate('__pad.axes[2]=0');await press(9);await page.select_option('#quality','balanced');await page.add_style_tag(content='dialog[open]{opacity:0!important}")
marker.write_text(json.dumps({'version':'0.8.0','changes':['Batch only static plaza meshes; retain animated and state-switched groups','Measure browser braking by simulation response, not arbitrary wall time','Require at least eight simulated seconds of uninterrupted browser acceleration','Capture the real plaza in balanced quality'], 'physicalHardwareCertified':False},indent=2)+'\n')
print('Applied Homecoming final polish.')
