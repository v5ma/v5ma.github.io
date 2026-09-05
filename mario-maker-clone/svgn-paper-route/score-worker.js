'use strict';
importScripts('./adventure-score.js');
onmessage=e=>{
 try{const {id,rate,token}=e.data,score=AdventureScore.render(id,rate);postMessage({id,token,...score},[score.left.buffer,score.right.buffer]);}
 catch(error){postMessage({token:e.data.token,error:String(error.message)});}
};
