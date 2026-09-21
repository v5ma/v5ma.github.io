/* Reconciles the unmerged Field Desk trigger choice with the current console.
 * Presentation/input only; this module never reads or writes gameplay saves. */
export const VEHICLE_HANDS=Object.freeze(['primary','left','right']);
export function vehicleDriveHand(choice='primary',dominant='right'){
 if(!VEHICLE_HANDS.includes(choice)||!['left','right'].includes(dominant))throw new TypeError('Known vehicle trigger hand required');
 return choice==='primary'?dominant:choice;
}
export function vehicleTriggerSignal(choice,dominant,hand,pressed){
 const drive=vehicleDriveHand(choice,dominant);
 if(!['left','right'].includes(hand))return {boost:false,brake:false};
 return {boost:!!pressed&&hand===drive,brake:choice!=='primary'&&!!pressed&&hand!==drive};
}
export function vehicleControlCaption(preferences,profile,dominant,riding){
 if(profile==='courier')return 'Off trigger: speed / primary grip: throw';
 if(!riding)return 'Primary grip: interact / trigger: action';
 if(!preferences.triggerDrive)return 'Move-stick click: speed / off grip: brake';
 const choice=preferences.driveHand??'primary';vehicleDriveHand(choice,dominant);
 if(choice==='primary')return 'Primary trigger: speed / off grip: brake';
 return (choice==='left'?'LT speed / RT brake':'RT speed / LT brake')+' / release speed to stop';
}
