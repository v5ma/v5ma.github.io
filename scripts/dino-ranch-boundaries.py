from pathlib import Path
D=Path(__file__).resolve().parents[1]/'dino-atlas'
def edit(name,old,new):
 p=D/name;s=p.read_text()
 if new in s:return
 assert old in s,(name,old[:120]);p.write_text(s.replace(old,new))
# Returning residents must never be steered back out after crossing the real gate.
edit('frontier-data.js','const outside=!insidePen(a,pen,2),south=pen.z+pen.hz;', 'const outside=!insidePen(a,pen,0),south=pen.z+pen.hz;')
edit('frontier-data.js','const r=Math.min(a.radius*.6,1.5),was=insidePen(old,pen,r),now=insidePen(a,pen,r),gateX=Math.abs(a.x-pen.x)<5-r;\n  if(was&&!now&&!(ps.open&&gateX&&a.z>pen.z))', 'const r=Math.min(a.radius*.6,1.5),was=insidePen(old,pen,0),now=insidePen(a,pen,0),gateX=Math.abs(a.x-pen.x)<5-r;\n  if(was&&!insidePen(a,pen,r)&&!(ps.open&&gateX&&a.z>pen.z))')
# Safe counts agree in the gate panel, operations, lesson, and timed roundup.
for name in ['ranger.js','ranch-game.js']:
 p=D/name;s=p.read_text();s=s.replace('insidePen(a,p,1)','insidePen(a,p,2)').replace('insidePen(a,pen,1)','insidePen(a,pen,2)');p.write_text(s)
# Persist part of real crew supply pressure across the next market refresh.
edit('frontier-economy-core.js', 's.rivalPressure[id]=clamp(rival,.04,.92);', 's.rivalPressure[id]=clamp((s.rivalPressure[id]??rival)*.7+rival*.3,.04,.92);')
p=D/'tests/ranch.test.mjs';s=p.read_text()
if 'closing a just-completed roundup keeps all four residents safely inside' not in s:
 s+='''
test('closing a just-completed roundup keeps all four residents safely inside',()=>{
 const s=emptyFrontier(),pen=PENS.find(p=>p.id==='crest-meadow'),ps=penState(s,pen),player={x:-44,y:1,z:203};ps.open=true;ps.fed=true;
 const residents=ALL_ANIMALS.filter(a=>a.pen===pen.id).map(createResident);
 residents.forEach((a,i)=>{a.x=pen.x+(i%2?3:-3);a.z=pen.z+pen.hz+7+i*4;a.origin={x:a.x,z:a.z};deterAnimal(a,player,'horn');});
 let closed=false;
 for(let i=0;i<3600;i++){
  residents.forEach(a=>stepResident(a,player,1/60,i/60,s));
  if(!closed&&residents.every(a=>insidePen(a,pen,2))){ps.open=false;closed=true;}
  if(closed)assert.ok(residents.every(a=>insidePen(a,pen,2)),'all four stay home after the first safe closure');
 }
 assert.ok(closed,'all four return through the open gate');
});
test('a closed gate blocks residents on both sides of its radius margin',()=>{
 const s=emptyFrontier(),pen=PENS[2],ps=penState(s,pen);ps.open=false;ps.fed=true;
 for(const [z,startsInside] of [[pen.z+pen.hz-.1,true],[pen.z+pen.hz+.1,false]]){
  const a=createResident(ALL_ANIMALS.find(a=>a.pen===pen.id),0);a.x=pen.x;a.z=z;
  deterAnimal(a,{x:pen.x,z:z+(startsInside?-10:10)},'water');
  for(let i=0;i<120;i++){stepResident(a,{x:0,y:1,z:0},1/60,i/60,s);assert.equal(insidePen(a,pen,0),startsInside);}
 }
});
'''
 p.write_text(s)
print('Consistent safe-home counts and closed-gate margins verified.')
