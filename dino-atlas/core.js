// Educational data is deliberately small and editorially reviewable.
// Ages and lengths are rounded guides, not exact dates or maximum sizes.
export const PERIODS = [
  {id:'triassic', name:'Triassic', start:252, end:201, stop:210, theme:'First footsteps', description:'Visit an early chapter of dinosaur history, when Earth had one enormous supercontinent: Pangaea.'},
  {id:'jurassic', name:'Jurassic', start:201, end:145, stop:150, theme:'An age of giants', description:'Explore a world of long-necked plant-eaters and plate-backed dinosaurs as Pangaea split apart.'},
  {id:'cretaceous', name:'Cretaceous', start:145, end:66, stop:67, theme:'Meet the icons', description:'Meet familiar dinosaurs from the very end of the Cretaceous, not from the entire period.'}
];
const nhm = 'https://www.nhm.ac.uk/discover/dino-directory/';
export const DINOS = [
  {id:'coelophysis', name:'Coelophysis', say:'seel-OH-fie-sis', period:'triassic', type:'runner', length:2, diet:'Meat-eater', place:'North America', color:'#d18a54', source:nhm+'coelophysis.html',
    short:'A lightly built dinosaur with a long tail and sharp teeth.',
    detail:'Hollow limb bones helped make this early theropod light. Small, pointed teeth are clues to an animal-based diet.',
    evidence:'Fossils preserve hollow limb bones and small, sharp teeth.', inference:'Its light build suggests an agile animal.', unknown:'We do not know the exact color of its skin.',
    question:'What does the name Coelophysis refer to?', answers:['Its hollow bones','Its three horns','Its back plates'], correct:0, explanation:'Coelophysis means hollow form, referring to its hollow bones.'},
  {id:'plateosaurus', name:'Plateosaurus', say:'plat-ee-oh-SORE-us', period:'triassic', type:'early', length:7, diet:'Plant-eater', place:'Europe', color:'#a288b1', source:nhm+'plateosaurus.html',
    short:'A long-necked plant-eater with a large thumb claw.',
    detail:'An early relative of later long-necked giants, Plateosaurus had grasping hands. Fossils have been found in Germany, France, and Switzerland.',
    evidence:'Hand fossils preserve a large thumb claw.', inference:'The claw may have helped collect food or defend the animal.', unknown:'Finding several animals together does not by itself prove how they lived.',
    question:'Where have Plateosaurus fossils been found?', answers:['Only Antarctica','Europe','The Moon'], correct:1, explanation:'Plateosaurus fossils are known from several European countries.'},
  {id:'diplodocus', name:'Diplodocus', say:'DIP-low-DOCK-us', period:'jurassic', type:'longneck', length:26, diet:'Plant-eater', place:'Western North America', color:'#6d9c86', source:nhm+'diplodocus.html',
    short:'A little head. A very long neck. An even longer adventure.',
    detail:'This four-legged sauropod had a long neck and a whip-like tail. Its fossils come from the Morrison Formation in the United States.',
    evidence:'Fossils reveal an elongated neck and an extremely long tail.', inference:'Its neck could help it reach plants without moving its whole body.', unknown:'Scientists debate exactly how it held and used its neck.',
    question:'Which food fits Diplodocus best?', answers:['Small dinosaurs','Fish','Plants'], correct:2, explanation:'Diplodocus was a plant-eating sauropod.'},
  {id:'stegosaurus', name:'Stegosaurus', say:'STEG-oh-SORE-us', period:'jurassic', type:'plates', length:9, diet:'Plant-eater', place:'Western North America', color:'#6e9fa1', source:nhm+'stegosaurus.html',
    short:'Look for the back plates and the spikes on its tail.',
    detail:'Stegosaurus had a small head, bony plates in its skin, and a spiked tail. Scientists have proposed different jobs for those plates.',
    evidence:'Fossils preserve upright back plates and tail spikes.', inference:'The spiked tail could help defend it from predators.', unknown:'The full function of its plates is still debated.',
    question:'What remains uncertain about Stegosaurus?', answers:['Whether it had bones','All the jobs its plates did','Whether it was a dinosaur'], correct:1, explanation:'We have its plates, but their complete function is still a research question.'},
  {id:'tyrannosaurus', name:'Tyrannosaurus rex', say:'tie-RAN-oh-SORE-us rex', period:'cretaceous', type:'rex', length:12, diet:'Meat-eater', place:'North America', color:'#b48254', source:nhm+'tyrannosaurus.html',
    short:'Meet a big-headed dinosaur with powerful jaws and tiny arms.',
    detail:'T. rex lived about 68-66 million years ago. Its teeth, bite marks on other fossils, and fossil dung help reveal what it ate.',
    evidence:'Tyrannosaurus tooth marks occur on other dinosaur fossils.', inference:'It both hunted animals and scavenged carcasses.', unknown:'We cannot tell exactly what a living T. rex sounded like.',
    question:'Could T. rex have met Stegosaurus?', answers:['No. They lived millions of years apart.','Yes. They shared every forest.','Only when it snowed.'], correct:0, explanation:'Stegosaurus lived in the Late Jurassic; T. rex lived much later, in the Late Cretaceous.'},
  {id:'triceratops', name:'Triceratops', say:'try-SERR-ah-tops', period:'cretaceous', type:'horns', length:9, diet:'Plant-eater', place:'North America', color:'#bd8069', source:nhm+'triceratops.html',
    short:'Three horns, a bony frill, and a beak for clipping plants.',
    detail:'Triceratops lived about 68-66 million years ago. Its skull had three horns, a large frill, a beak, and rows of teeth for processing plants.',
    evidence:'Skulls preserve the horn cores, beak region, and frill.', inference:'Its horns could have been useful for defense and display.', unknown:'We do not know the exact colors of its frill.',
    question:'What is the best clue that Triceratops ate plants?', answers:['Its color in our illustration','Its name','Its beak and shearing teeth'], correct:2, explanation:'Anatomy provides evidence. Our artwork colors do not tell us the animal\'s diet.'}
];
export const STORAGE_KEY = 'dino-atlas.progress.v1';
export const PATCHES = 48;
export const byId = id => DINOS.find(d => d.id === id);
export const inPeriod = id => DINOS.filter(d => d.period === id);
export const emptyProgress = () => ({version:1, observed:[], excavated:[], quizzes:[], notes:{}, digs:{}});
export function sanitizeProgress(value) {
  const p = emptyProgress();
  if (!value || typeof value !== 'object' || value.version !== 1) return p;
  for (const key of ['observed','excavated','quizzes']) {
    if (Array.isArray(value[key])) p[key] = [...new Set(value[key].filter(id => typeof id === 'string' && byId(id)))];
  }
  for (const d of DINOS) {
    if (typeof value.notes?.[d.id] === 'string') p.notes[d.id] = value.notes[d.id].slice(0,400);
    const a = value.digs?.[d.id];
    if (Array.isArray(a) && a.length === PATCHES) p.digs[d.id] = a.map(n => Number.isInteger(n) ? Math.max(0, Math.min(2,n)) : 0);
  }
  return p;
}
export function readProgress(storage) {
  try { return {progress:sanitizeProgress(JSON.parse(storage.getItem(STORAGE_KEY))), available:true}; }
  catch { return {progress:emptyProgress(), available:false}; }
}
export function writeProgress(storage, p) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(p)); return true; } catch { return false; }
}
export function addDiscovery(p, category, id) {
  if (!['observed','excavated','quizzes'].includes(category) || !byId(id) || p[category].includes(id)) return false;
  p[category].push(id); return true;
}
export function brushPatch(p, id, index) {
  if (!byId(id) || !Number.isInteger(index) || index < 0 || index >= PATCHES) return false;
  p.digs[id] ??= Array(PATCHES).fill(0);
  p.digs[id][index] = Math.min(2,p.digs[id][index]+1);
  if (digPercent(p,id) === 100) { addDiscovery(p,'excavated',id); addDiscovery(p,'observed',id); }
  return true;
}
export function digPercent(p,id) { return Math.floor((p.digs[id] || []).reduce((a,b)=>a+b,0)/(PATCHES*2)*100); }
export function journalText(p) {
  return ['DINO ATLAS - MY FIELD JOURNAL','Saved on this device. Artwork and excavation are simplified learning activities.','',
    ...DINOS.filter(d=>p.observed.includes(d.id)||p.excavated.includes(d.id)||p.notes[d.id]||p.quizzes.includes(d.id)).flatMap(d=>[
      d.name+' / '+d.period, 'Observed: '+(p.observed.includes(d.id)?'yes':'no')+'. Excavated: '+(p.excavated.includes(d.id)?'yes':'no')+'.',
      'Evidence: '+d.evidence, 'Still unknown: '+d.unknown, 'My note: '+(p.notes[d.id]||'(No note yet.)'),''
    ])].join('\n');
}
export const escapeHTML = text => String(text).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
