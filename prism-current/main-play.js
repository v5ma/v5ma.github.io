/* Put Play and headset entry before the catalog. Keep old tracks and missions reachable. */
addEventListener('DOMContentLoaded',()=>{
 const menu=document.getElementById('menu'),choices=menu.querySelector('.choices'),play=menu.querySelector('.play-buttons'),tracks=document.getElementById('tracks');
 menu.querySelector('.lead').after(choices);choices.after(play);
 const label=document.createElement('p');label.id='main-release';label.textContent='UNDERTOW / NEW MAIN RHYTHM RELEASE / v0.9.0';play.after(label);
 // A catalog remains a catalog: avoid hiding existing songs behind nested launchers.
 const scope=document.createElement('p');scope.textContent='Undertow uses the pool venue. Spectral atmosphere choices style the older songs; the hit-ripple and quiet-motion controls also apply to Undertow.';document.querySelector('#settings summary').after(scope);
 const water=document.getElementById('water-expedition');if(water)menu.append(water);
});
