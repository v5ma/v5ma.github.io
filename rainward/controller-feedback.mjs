/* Optional rumble; absence of hardware support must never interrupt gameplay. */
export function createControllerFeedback(getPad,enabled){let last=0;
 function stop(){try{const result=getPad()?.vibrationActuator?.reset?.();result?.catch?.(()=>{});}catch{}}
 function event(e){if(!enabled())return;const effects={shot:[75,.12,.24],damage:[150,.65,.5],reloaded:[90,.15,.12],pickup:[60,.08,.12],'task-complete':[160,.22,.3],death:[260,.5,.65]};const effect=effects[e.type];if(!effect)return;
  const now=performance.now();if(now-last<45)return;last=now;
  try{const actuator=getPad()?.vibrationActuator;if(!actuator?.playEffect)return;const result=actuator.playEffect('dual-rumble',{startDelay:0,duration:effect[0],weakMagnitude:effect[1],strongMagnitude:effect[2]});result?.catch?.(()=>{});}catch{}
 }
 return {event,stop};
}
