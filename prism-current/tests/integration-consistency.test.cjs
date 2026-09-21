/* Source-integration checks only. They do not certify a deployed or physical XR game. */
const {test}=require('node:test');
const A=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
function textFiles(dir){
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  if(entry.name==='__pycache__')return [];
  const name=path.join(dir,entry.name);
  return entry.isDirectory()?textFiles(name):/\.(js|cjs|py|html|css|json|md|txt)$/.test(name)?[name]:[];
 });
}
test('Prism source has no unresolved Git conflict markers',()=>{
 const conflicts=[];
 for(const file of textFiles(root)){
  const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);
  for(let i=0;i<lines.length;i++)if(/^(?:<{7} |={7}\s*$|>{7} )/.test(lines[i]))conflicts.push(`${path.relative(root,file)}:${i+1}`);
 }
 A.deepEqual(conflicts,[]);
});
test('Main River, retained rhythm and Floodgate entries keep distinct valid local dependencies',()=>{
 const entries=['index.html','rhythm.html','water-mission/index.html'];
 for(const name of entries){
  const html=read(name),parent=path.dirname(path.join(root,name));
  const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m=>m[1].split(/[?#]/)[0]);
  A.equal(new Set(scripts).size,scripts.length,`${name}: duplicated runtime script`);
  for(const src of scripts){if(/^[a-z]+:|^\/\//i.test(src))continue;A.ok(fs.statSync(path.resolve(parent,src)).isFile(),`${name}: ${src}`);}
 }
 A.match(read('index.html'),/<a-scene\s+river-game\b/);
 A.match(read('index.html'),/href="\.\/rhythm\.html"/);
 A.match(read('index.html'),/href="\.\/water-mission\/index\.html"/);
 A.match(read('rhythm.html'),/<a-scene\s+prism-game\b/);
 A.doesNotMatch(read('rhythm.html'),/<script[^>]+src="\.\/river\/app\.js/);
});
test('Main app version, title and changed app cache URL agree with the release manifest',()=>{
 const version=JSON.parse(read('release.json')).version;
 const escaped=version.replace(/\./g,'\\.');
 const html=read('index.html'),app=read('river/app.js');
 A.match(html,new RegExp('<title>[^<]*'+escaped));
 A.match(html,new RegExp('src="\\./river/app\\.js\\?v='+escaped+'"'));
 A.match(app,new RegExp("snapshot:\\(\\)=>\\(\\{version:'"+escaped+"'"));
 // Unchanged component URLs may retain their own older revision intentionally.
});
