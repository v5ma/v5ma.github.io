/* Browser-local durability, not server authority. No credentials or network. */
export function createRoadStorage({storage,key,initialRaw=null,serialize,onConflict=()=>{}}){
 let expected=initialRaw,conflict=false;
 return {
  write(state){
   if(conflict)throw Error('Another tab changed this adventure. Reload before trading or saving.');
   const actual=storage.getItem(key);
   if(actual!==expected){conflict=true;onConflict();throw Error('Another tab changed this adventure. Reload before trading or saving.');}
   const value=serialize(state);
   if(typeof value!=='string'||value.length>32768)throw Error('The save record exceeds the supported size.');
   if(value!==expected)storage.setItem(key,value);
   expected=value;return true;
  },
  changed(event){if(event.key===key&&event.newValue!==expected){conflict=true;onConflict();return true;}return false;},
  inspect:()=>({conflict})
 };
}
