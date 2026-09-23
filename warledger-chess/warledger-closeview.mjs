// View preferences are separate from match saves. XR always keeps the spatial tray.
export const VIEW_KEY='warledger-chess-view-v1';
export function readViewPreference(storage) {
  try {const v=(storage||globalThis.localStorage)?.getItem(VIEW_KEY);return ['board','table'].includes(v)?v:'auto';}catch{return 'auto';}
}
export function writeViewPreference(value,storage) {
  if(!['board','table','auto'].includes(value))return false;
  try {(storage||globalThis.localStorage)?.setItem(VIEW_KEY,value);return true;}catch{return false;}
}
export function boardLayout(width,height,preference='auto',xr=false) {
  const focused=!xr&&(preference==='board'||(preference==='auto'&&(width<720||height<520)));
  const side=focused&&width>=height*1.3;
  return {focused,side,key:xr?'xr':!focused?'table':side?'board-side':'board-front',
    targetX:side?.17:0,targetZ:focused?(side?0:.035):.10};
}
export function wrapText(text,limit=30) {
  const lines=[];let line='';
  for(const word of String(text).split(/\s+/)){
    if(line&&line.length+word.length+1>limit){lines.push(line);line=word;}else line+=(line?' ':'')+word;
  }
  if(line)lines.push(line);return lines;
}
export function buildPlayTray(app,lines) {
  const spec=app.layoutSpec,T=app.THREE,tray=new T.Group();tray.name='play-tray';
  tray.rotation.x=-Math.PI/2;
  tray.position.set(spec.side?.60:0,.013,spec.focused?(spec.side?0:.435):.51);
  app.ui.add(tray);
  if(spec.side){
    const text=[lines[0],`Bank W ${app.state.bank.white} / B ${app.state.bank.black}`,
      ...lines.slice(2).flatMap(line=>wrapText(line,29))];
    app.addPanel(tray,text,.35,.265,0,.165);
  }else app.addPanel(tray,lines,.70,spec.focused?.073:.108,0,spec.focused?.022:.095);
  const buttons=app.placing?[['Higher','higher'],['Lower','lower'],['Cancel placement','cancel']]:
    [['Undo','undo'],['Market','market'],['Flip board','flip'],['Table options','options']];
  buttons.forEach(([label,action],i)=>{
    const width=spec.side?.164:.157,height=spec.focused?.054:.049;
    const x=spec.side?(i%2-.5)*.182:(i-(buttons.length-1)/2)*.172;
    const y=spec.side?-.02-Math.floor(i/2)*.067:spec.focused?-.05:0;
    app.addPanel(tray,[label],width,height,x,y,action);
  });
  if(app.xrSession)app.addPanel(tray,['Exit XR'],.16,.041,0,-.057,'exit');
  return tray;
}
