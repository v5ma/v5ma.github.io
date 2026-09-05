
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.join(__dirname,'../mario-maker-clone/svgn-paper-route');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const T=vm.runInNewContext('({'+source.match(/const T = \{([\s\S]+?)\n\};/)[1].replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'')+'})');
function load(extra=[]){const c={btoa,atob,escape,unescape,TextEncoder,stepPlayer(){},console,Uint8Array,Float32Array,Map,Set};vm.createContext(c);
 for(const f of ['campaign.js','sky-routes.js','grapple-core.js','open-course.js','ground-courses.js','sky-network-layout.js',...extra])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c,{filename:f});
 return {...c,T};}
module.exports={load,T,root};
