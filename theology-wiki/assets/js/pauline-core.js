/* Nominal chronology arithmetic, not a historical date estimator. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TheologyPaulineCore=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
 const defaults=Object.freeze({founder:'88',founderEra:'bce',transition:'37',transitionEra:'ce',origin:'transition',count:'elapsed'});
 const keys=Object.keys(defaults);
 function date(value,era){
  if(!/^[0-9]{1,4}$/.test(String(value))||Number(value)<1||Number(value)>5000)throw Error('Enter a whole year from 1 to 5000. Historical year zero is not used.');
  if(!['bce','ce'].includes(era))throw Error('Choose BCE or CE for each year.');
  return era==='bce'?1-Number(value):Number(value);
 }
 function label(year){if(!Number.isSafeInteger(year))throw Error('Invalid computed year.');return year<=0?(1-year)+' BCE':year+' CE';}
 function calculate(s){
  const founder=date(s.founder,s.founderEra),transition=date(s.transition,s.transitionEra);
  if(!['transition','visit'].includes(s.origin)||!['elapsed','inclusive'].includes(s.count))throw Error('Choose one of the displayed interval origins and counting conventions.');
  if(transition<founder)throw Error('In this comparison the transition cannot precede the selected founder death.');
  const shift=s.count==='inclusive'?1:0,first=transition+3-shift,later=(s.origin==='visit'?first:transition)+14-shift;
  return {founder:label(founder),transition:label(transition),gap:transition-founder,first:label(first),later:label(later),three:3-shift,fourteen:14-shift,origin:s.origin,count:s.count};
 }
 function fromParams(params){const s={...defaults};let supplied=false;for(const k of keys){if(params.has('pc_'+k)){s[k]=params.get('pc_'+k);supplied=true;}}try{calculate(s);return {state:s,invalid:false,supplied};}catch{return {state:{...defaults},invalid:true,supplied};}}
 function toParams(url,state){calculate(state);const u=new URL(url);for(const k of keys)u.searchParams.set('pc_'+k,state[k]);return u;}
 return {defaults,keys,date,label,calculate,fromParams,toParams};
});
