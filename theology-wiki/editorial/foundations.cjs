'use strict';
// Canonical foundation configuration and full-length article bodies; never reads private accounts.
const fs=require('node:fs'),path=require('node:path');
const data=require('./foundations.json');
const text=name=>fs.readFileSync(path.join(__dirname,'foundation-articles',name),'utf8');
module.exports={...data,articles:data.articles.map(p=>({...p,body:text(p.slug+'.md')})),addenda:Object.fromEntries(Object.entries(data.addenda).map(([slug,x])=>[slug,{...x,body:text(x.file)}]))};
