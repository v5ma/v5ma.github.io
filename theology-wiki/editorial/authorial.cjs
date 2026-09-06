"use strict";
const fs=require('node:fs'),path=require('node:path'),data=require('./authorial.json');
const map=require('./authorial-metadata.json');
function reword(value,key=''){
 if(['body','speaker','contains','excerpt','owner','id','sourceId','sourceFile','sourceHash','sha256'].includes(key))return value;
 if(typeof value==='string')return map[value]??value;
 if(Array.isArray(value)){for(let i=0;i<value.length;i++)value[i]=reword(value[i]);return value;}
 if(value&&typeof value==='object')for(const k of Object.keys(value))value[k]=reword(value[k],k);
 return value;
}
const articles=data.articles.map(p=>({...p,body:fs.readFileSync(path.join(__dirname,'authorial-articles',p.slug+'.md'),'utf8')}));
const presentation=require('./authorial-presentation.json');
// Only generated editorial prose passes through this exact, reviewed map.
function present(text){for(const [old,replacement] of Object.entries(presentation))text=text.split(old).join(replacement);return text;}
module.exports={...data,articles,reword,present};
