import {readEnvironmentPreferences,writeEnvironmentPreferences} from './preferences.mjs';
export function installEnvironmentControls({container,storage,apply,message}){
 const restored=readEnvironmentPreferences(storage);let current=restored.value;
 const section=document.createElement('fieldset');section.innerHTML='<legend>District scenery / Currentworks</legend><label for="ward-art-quality">Environment detail</label><select id="ward-art-quality"><option value="balanced">Balanced water and foliage</option><option value="light">Light / lower graphics cost</option></select><label><input id="ward-art-quiet" type="checkbox"> Still water and foliage / reduced motion</label><label><input id="ward-art-scenery" type="checkbox"> Trees and clouds</label>';
 container.append(section);const q=section.querySelector('#ward-art-quality'),quiet=section.querySelector('#ward-art-quiet'),scenery=section.querySelector('#ward-art-scenery');q.value=current.quality;quiet.checked=current.quiet;scenery.checked=current.scenery;
 function change(){current={v:1,quality:q.value,quiet:quiet.checked,scenery:scenery.checked};apply(current);try{if(restored.blocked)throw Error(restored.error);writeEnvironmentPreferences(storage,current);}catch(e){message('Scenery changed for this session. Saved preferences retained: '+e.message);}}
 for(const el of [q,quiet,scenery])el.addEventListener('change',change);
 return {get preferences(){return {...current};}};
}
